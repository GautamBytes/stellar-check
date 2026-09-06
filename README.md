# Stellar Check

Stellar Check is a read-only TypeScript library for checking a Stellar payment before signing. It reports available balances, reserve requirements, liabilities, trustline authorization, receiving capacity and declared memo requirements.

Pre-grant development version: **0.1.0**. UI and branding iterations remain part of v0.1 until the final product milestone. This package has not been published to npm. The proposal documents are historical planning inputs; see [implementation status](docs/implementation-status.md) for what has actually been verified.

The repository includes the library, tests, website and documentation. Historical proposal documents describe the original plan; the implementation status records what was built. CI runs the full check and package validation on pull requests.

## Run locally

Requires Node **22.12 or later** and npm. Dependencies are pinned.

```sh
npm ci
npm run check
npm run example  # four controlled, offline scenarios
npm run demo     # http://127.0.0.1:5173
```

The website includes a “Why Stellar Check?” section and a dedicated reading guide at `/docs.html`, covering purpose, problems, a worked example, integration, evidence, ecosystem value and scope.

The website offers coordinated light and dark themes. Use the header toggle to save your preference; the first visit follows your system setting.

The homepage keeps a small interactive preview. The full checker lives at `/playground.html` and starts in **controlled fixture mode**. Select **Live Horizon data** and enter real public accounts for the chosen network to run fresh reads. The library and page never request secret keys, sign transactions, create accounts or submit payments. Live requests disclose queried public addresses to the configured provider. The page clears a report when the input changes and ignores responses for superseded inputs.

## Integrate

Build with `npm run build`. Until publication, import from this checkout’s `dist/index.js`, or run `npm pack` and install the resulting local archive in your application.

```ts
import { Networks } from '@stellar/stellar-sdk';
import { checkPayment, HorizonProvider } from './dist/index.js';

const provider = new HorizonProvider('https://horizon-testnet.stellar.org');
const report = await checkPayment(
  {
    networkPassphrase: Networks.TESTNET,
    source: senderPublicAddress,
    destination: recipientPublicAddress,
    asset: { type: 'native' },
    amount: '2.5000000',
    feeBudget: '0.0000100',
    // memo: { type: 'id', value: '12345' },
  },
  provider,
);

if (report.status === 'no_known_issues') {
  // No supported issue found in observed state. Refresh before confirmation.
} else {
  for (const issue of report.issues) {
    console.log(issue.code, issue.party, issue.message, issue.action);
  }
}
```

For an issued asset, use `{ type: 'credit', code: 'USDC', issuer: issuerPublicAddress }`. Matching a code alone never identifies a trustline. `feeBudget` is the **total fee in XLM**, not stroops, and must be a positive decimal string within the transaction fee range. It is checked against the current one-operation base fee; surge pricing and inclusion are not predicted.

Memo types: `text` (up to 28 UTF-8 bytes), `id` (uint64 decimal string), `hash` and `return` (64 hexadecimal characters). Omit `memo` for no memo. The SDK considers even an empty text memo to be present; applications must obtain the receiving service’s actual memo and verify its intended meaning themselves.

The package exports ESM and TypeScript declarations, and works in Node and browser bundlers. No application database or server is required. The demo uses Vite; the library does not depend on Vite.

## Import an unsigned transaction

The Playground's **Import XDR** panel decodes locally, previews exact payment values and only loads them into the checker after an explicit click. Loading selects Live Horizon and clears the previous report. It does not make account requests; click **Check payment** to fetch current public state. The example XDR uses controlled sample addresses, not maintained live accounts.

```ts
import { importPaymentXdr, checkPayment, HorizonProvider } from 'stellar-check';
import { Networks } from '@stellar/stellar-sdk';

const decoded = importPaymentXdr(unsignedEnvelopeBase64, Networks.TESTNET);
if (!decoded.ok) {
  console.error(decoded.code, decoded.message);
} else {
  console.log(decoded.payment, decoded.context);
  // Run after reviewing the decoded payment and selected network:
  const report = await checkPayment(
    decoded.payment,
    new HorizonProvider('https://horizon-testnet.stellar.org'),
  );
  console.log(report.status);
}
```

The importer accepts canonical base64 with optional whitespace, up to 32,768 input characters. Supported envelopes are unsigned V1 transactions containing one classic payment between distinct G accounts. The transaction source and any explicit operation source must match. Fee stroops become exact XLM decimal strings. Text memos must be lossless UTF-8; ID and hash memos preserve their exact values.

Signed envelopes, fee bumps, legacy V0 envelopes, transaction extensions, extended V2 preconditions, multiple/non-payment operations and unsupported payment shapes are rejected. Ordinary time bounds and sequence numbers appear in import context but are **not assessed**. The selected network is supplied by the caller because XDR does not identify its network. An imported payment report is not transaction validation. Editing the form does not modify or rebuild the original XDR.

Issue cards offer relevant field shortcuts such as **Review amount**, **Edit fee budget** and **Edit memo**, plus copyable asset details for trustline and authorization issues. These controls do not change balances, create trustlines or assume the receiving service's memo.

## Report contract

| Status            | Meaning                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `no_known_issues` | All applicable supported checks completed without a diagnosed issue.                                                                  |
| `issues_found`    | Supported checks found one or more problems; dependent checks for a confirmed missing account are marked not applicable.              |
| `incomplete`      | Invalid/unsupported input, unavailable observations, malformed data or wrong network prevented assessment. Known issues are retained. |

`incomplete` takes precedence over known issues. Always inspect `status`, not just whether `issues` is empty. Coverage entries distinguish `complete`, `unresolved` and `not_applicable`; a completed check may have found an issue. Each diagnostic contains a stable `code`, affected `party`, explanation and recommended `action`.

Facts are decimal strings with seven fractional digits and are absent when their dependencies are unavailable. `availableXlm` is the maximum nonnegative amount after reserve, native selling liabilities and fee. `requiredXlm` includes reserve, selling liabilities, fee and, for native payments, the amount. `xlmShortfall` includes any deficit below reserve plus fee, even for issued-asset payments. Recipient native capacity is checked against the signed int64 balance bound; issued capacity uses the trustline limit and buying liabilities.

Observation metadata contains provider URL, expected network, per-read timestamps, available `x-last-ledger` observations, and account `last_modified_ledger` values. The account modification ledger is **not** its read ledger. Root/ledger metadata, sender, recipient and SDK memo reads are separate observations. `atomic` is always `false`.

## Scope and limits

Supported: one classic Payment operation, distinct G-address source and destination, native XLM or one issued asset, one transaction/operation source and fee payer. Optional `operationType: 'payment'`, `operationSource` and `feePayer` are accepted only when consistent with that shape. Unknown intent fields are rejected so unsupported transaction features cannot silently disappear.

Unsupported: M-addresses, federation, self-payments, issuer-as-party payments, Soroban/SAC, path payments, swaps, batches, multiple operations, fee bumps and separate sources/fee payers. Address checks use the SDK’s StrKey checksum validation. The checker accepts a payment intent. The separate `importPaymentXdr` helper extracts supported payment values from an unsigned envelope.

Amounts use bigint internally and decimal strings externally. Zero/negative payments, excess precision, exponents and out-of-range amounts are invalid. Current reserve and base-fee values come from Horizon’s latest ledger; no reserve constant is substituted. Inconsistent relevant balances, missing liabilities, missing sponsorship counters and missing authorization never become invented defaults.

The official SDK `checkMemoRequired` performs SEP-29 detection. A supplied memo means **presence only**; no identity check or memo-declaration inference is made. The adapter overrides the SDK’s account loader with the same bounded read transport and maps Horizon’s REST `data` field to the SDK’s `data_attr`. It builds an unsigned, non-submittable inspection container; its dummy sequence/fee are not readiness facts.

State can change immediately after checking. Refresh after edits and immediately before confirmation. Signature validity, sequence handling, transaction timing/preconditions, submission, finality and surge-fee inclusion are outside the report. No production audit or adoption claim is implied.

## Provider and offline usage

```ts
const provider = new HorizonProvider(url, { timeoutMs: 10_000 });
```

Each HTTP request, including its response body, has a bounded timeout and uses no-store fetching. No automatic retries occur. Account 404 responses are distinct from transport failures; 429s have a dedicated diagnostic. HTTPS is required by default; `allowHttp: true` explicitly enables local development providers. Provider URLs must not contain credentials, query parameters or fragments.

`PaymentProvider` can be implemented with another public-data adapter; its methods return timestamped `Read<T>` envelopes. Custom implementations are responsible for bounded I/O and faithful network/ledger metadata. The orchestrator preserves rejected or malformed observations as incomplete reports. The payment input is copied before asynchronous reads so caller mutations cannot change the assessed intent midway.

For controlled observations, use `assessPayment(intent, snapshot)` directly. This pure function validates relevant account fields and calculates a report without I/O. Offline snapshots must conform to the exported `Snapshot` type. See [the four fixtures](examples/scenarios.ts) and [fixture coverage](docs/fixtures.md).

## Node and testnet examples

```sh
# Read a JSON payment intent using current public state:
HORIZON_URL=https://horizon-testnet.stellar.org npm run example -- /absolute/path/payment.json

# Recheck four scenarios using the included public-account manifest:
npm run testnet
# Or supply public accounts you maintain:
npm run testnet -- /absolute/path/testnet-accounts.json
```

See [testnet verification](docs/testnet.md) for the manifest requirements and report artifact. The included public accounts can change or disappear at a testnet reset; they are not project-owned fixtures.

## Development

```sh
npm run typecheck
npm test
npm run build
npm run demo:build
npm pack --dry-run
```

`npm run check` runs typechecking, the test suite, the library build and demo production build. Tests run without public network access and use real calculation code and the SDK memo helper with controlled HTTP responses. [Diagnostic meanings](docs/diagnostics.md) and [implementation status](docs/implementation-status.md) describe the current contract and verification.

## References and license

The implementation follows Stellar’s [sponsored reserve accounting](https://developers.stellar.org/docs/build/guides/transactions/sponsored-reserves), [payment operation reference](https://developers.stellar.org/docs/learn/fundamentals/transactions/list-of-operations) and [SEP-29](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0029.md). Memo behavior is verified against the pinned `@stellar/stellar-sdk` dependency, version 17.0.1.

Apache-2.0; see [LICENSE](LICENSE). The official Stellar SDK is an Apache-2.0 dependency. No source from the other proposal-referenced wallet projects was copied. Repository owner: GautamBytes. Any upstream contribution, npm publication and longer-term maintenance commitments remain to be agreed.
