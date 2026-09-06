import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { Networks } from '@stellar/stellar-sdk';
import { checkPayment, HorizonProvider } from '../src/index.js';
import type { PaymentIntent } from '../src/index.js';
import { formatAmount, MAX_AMOUNT, parseAmount } from '../src/amounts.js';
import { isRecord } from '../src/input.js';
const config: unknown = JSON.parse(
  await readFile(process.argv[2] ?? 'examples/testnet-accounts.json', 'utf8'),
);
if (
  !isRecord(config) ||
  [
    'nativeSource',
    'nativeDestination',
    'creditSource',
    'creditDestination',
    'creditCode',
    'creditIssuer',
    'missingTrustlineDestination',
  ].some((key) => typeof config[key] !== 'string')
)
  throw new Error('Use the documented testnet public-account manifest.');
const settings = config as Record<string, string>;
const provider = new HorizonProvider(
  process.env.HORIZON_URL ?? 'https://horizon-testnet.stellar.org',
);
const network = await provider.getNetwork();
if (!network.ok || network.value.networkPassphrase !== Networks.TESTNET)
  throw new Error('Testnet metadata is unavailable or the provider is on another network.');
const base: PaymentIntent = {
  source: settings.nativeSource!,
  destination: settings.nativeDestination!,
  networkPassphrase: Networks.TESTNET,
  asset: { type: 'native' },
  amount: '0.0000001',
  feeBudget: network.value.baseFee,
};
const credit: PaymentIntent = {
  ...base,
  source: settings.creditSource!,
  destination: settings.creditDestination!,
  asset: { type: 'credit', code: settings.creditCode!, issuer: settings.creditIssuer! },
};
const source = await provider.getAccount(base.source);
if (!source.ok || !isRecord(source.value) || !Array.isArray(source.value.balances))
  throw new Error('Native source is unavailable.');
const native: unknown = source.value.balances.find(
  (b: unknown) => isRecord(b) && b.asset_type === 'native',
);
if (!isRecord(native)) throw new Error('Source has no native balance.');
const balance = parseAmount(native.balance);
const oversized = formatAmount(balance < MAX_AMOUNT ? balance + 1n : MAX_AMOUNT);
const cases = [
  { name: 'Valid XLM payment', payment: base, expected: 'no_known_issues' },
  { name: 'Valid issued-asset payment', payment: credit, expected: 'no_known_issues' },
  {
    name: 'Missing recipient trustline',
    payment: { ...credit, destination: settings.missingTrustlineDestination! },
    expected: 'DESTINATION_TRUSTLINE_MISSING',
  },
  {
    name: 'Insufficient source availability',
    payment: { ...base, amount: oversized },
    expected: 'INSUFFICIENT_XLM',
  },
];
const results = [];
for (const entry of cases) {
  const report = await checkPayment(entry.payment, provider);
  const passed =
    entry.expected === 'no_known_issues'
      ? report.status === entry.expected
      : report.status === 'issues_found' &&
        report.issues.some((issue) => issue.code === entry.expected);
  results.push({ ...entry, passed, report });
  console.log(
    `${passed ? 'PASS' : 'FAIL'} ${entry.name}: ${report.status} ${report.issues.map((i) => i.code).join(', ')}`,
  );
}
await mkdir('artifacts', { recursive: true });
await writeFile(
  'artifacts/testnet-results.json',
  JSON.stringify(
    {
      verifiedAt: new Date().toISOString(),
      provider: provider.url,
      transactionsSubmitted: 0,
      results,
    },
    null,
    2,
  ) + '\n',
);
if (results.some((result) => !result.passed)) process.exitCode = 1;
