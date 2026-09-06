import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Networks } from '@stellar/stellar-sdk';
import { HorizonProvider } from '../src/horizon.js';
import { checkPayment } from '../src/check.js';
import { account, destination, intent, native, source } from './fixtures.js';
const url = 'https://horizon.example';
function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'x-last-ledger': '101' },
  });
}
function mockFetch(
  overrides: Record<string, () => Response | Promise<Response>> = {},
): typeof fetch {
  return async (input) => {
    const path = new URL(String(input)).pathname;
    if (overrides[path]) return overrides[path]();
    if (path === '/') return response({ network_passphrase: Networks.TESTNET });
    if (path === '/ledgers')
      return response({
        _embedded: {
          records: [{ sequence: 101, base_reserve_in_stroops: 5000000, base_fee_in_stroops: 100 }],
        },
      });
    if (path.startsWith('/accounts/'))
      return response({ ...account(path.split('/').at(-1)!), sequence: '100', data: {} });
    return response({}, 404);
  };
}
test('adapter combines live-shaped data and real SDK memo checks', async () => {
  const r = await checkPayment(intent(), new HorizonProvider(url, { fetch: mockFetch() }));
  assert.equal(r.status, 'no_known_issues');
  assert.equal(r.facts.sourceReserve, '1.5000000');
  assert.equal(r.observation.provider, url);
  assert.equal(r.observation.reads.length, 4);
});
test('SDK detects SEP-29 memo requirement', async () => {
  const provider = new HorizonProvider(url, {
    fetch: mockFetch({
      [`/accounts/${destination}`]: () =>
        response({
          ...account(destination),
          sequence: '100',
          data: { 'config.memo_required': 'MQ==' },
        }),
    }),
  });
  const r = await checkPayment(intent(), provider);
  assert.ok(r.issues.some((i) => i.code === 'MEMO_REQUIRED'));
  assert.equal(r.status, 'issues_found');
  const supplied = await checkPayment(intent({ memo: { type: 'id', value: '42' } }), provider);
  assert.equal(supplied.status, 'no_known_issues');
  assert.equal(supplied.facts.memo, 'presence_only');
});
test('25 network mismatch stops account reads', async () => {
  let accountReads = 0;
  const transport = mockFetch({ '/': () => response({ network_passphrase: Networks.PUBLIC }) });
  const provider = new HorizonProvider(url, {
    fetch: async (...args) => {
      if (String(args[0]).includes('/accounts/')) accountReads++;
      return transport(...args);
    },
  });
  const r = await checkPayment(intent(), provider);
  assert.equal(r.status, 'incomplete');
  assert.ok(r.issues.some((i) => i.code === 'NETWORK_MISMATCH'));
  assert.equal(accountReads, 0);
});
for (const [status, code] of [
  [429, 'PROVIDER_RATE_LIMITED'],
  [503, 'PROVIDER_UNAVAILABLE'],
] as const)
  test(`26 HTTP ${status}`, async () => {
    const r = await checkPayment(
      intent(),
      new HorizonProvider(url, {
        fetch: mockFetch({ [`/accounts/${source}`]: () => response({}, status) }),
      }),
    );
    assert.equal(r.status, 'incomplete');
    assert.ok(r.issues.some((i) => i.code === code));
  });
test('26 timeout is bounded even if transport ignores abort', async () => {
  const provider = new HorizonProvider(url, {
    fetch: async () => new Promise(() => {}),
    timeoutMs: 15,
  });
  const r = await checkPayment(intent(), provider);
  assert.equal(r.status, 'incomplete');
  assert.ok(r.issues.some((i) => i.code === 'PROVIDER_TIMEOUT'));
});
test('26 malformed JSON', async () => {
  const r = await checkPayment(
    intent(),
    new HorizonProvider(url, { fetch: async () => new Response('not json') }),
  );
  assert.equal(r.status, 'incomplete');
  assert.ok(r.issues.some((i) => i.code === 'MALFORMED_DATA'));
});
for (const body of [
  {},
  { _embedded: { records: [] } },
  { _embedded: { records: [{ sequence: 101, base_fee_in_stroops: 100 }] } },
])
  test(`26 missing ledger fields ${JSON.stringify(body)}`, async () => {
    const r = await checkPayment(
      intent(),
      new HorizonProvider(url, { fetch: mockFetch({ '/ledgers': () => response(body) }) }),
    );
    assert.equal(r.status, 'incomplete');
    assert.ok(r.issues.some((i) => i.code === 'MALFORMED_DATA'));
  });
test('26 missing memo data cannot mean no requirement', async () => {
  const r = await checkPayment(
    intent(),
    new HorizonProvider(url, {
      fetch: mockFetch({
        [`/accounts/${destination}`]: () => response({ ...account(destination), sequence: '100' }),
      }),
    }),
  );
  assert.equal(r.status, 'incomplete');
  assert.ok(r.issues.some((i) => i.code === 'MALFORMED_DATA'));
});
test('404 account is distinguished from unavailable provider', async () => {
  const r = await checkPayment(
    intent(),
    new HorizonProvider(url, {
      fetch: mockFetch({ [`/accounts/${destination}`]: () => response({}, 404) }),
    }),
  );
  assert.equal(r.status, 'issues_found');
  assert.ok(r.issues.some((i) => i.code === 'DESTINATION_ACCOUNT_MISSING'));
});
test('root 404 is provider failure, not a missing account', async () => {
  const r = await checkPayment(
    intent(),
    new HorizonProvider(url, { fetch: mockFetch({ '/': () => response({}, 404) }) }),
  );
  assert.equal(r.status, 'incomplete');
  assert.ok(r.issues.some((i) => i.code === 'PROVIDER_UNAVAILABLE'));
});
test('28 fresh reads observe changed balances', async () => {
  let balance = '10';
  const provider = new HorizonProvider(url, {
    fetch: mockFetch({
      [`/accounts/${source}`]: () =>
        response({ ...account(source), balances: [native(balance)], sequence: '100', data: {} }),
    }),
  });
  assert.equal((await checkPayment(intent(), provider)).status, 'no_known_issues');
  balance = '1.5';
  assert.ok(
    (await checkPayment(intent(), provider)).issues.some((i) => i.code === 'INSUFFICIENT_XLM'),
  );
});
test('invalid intent makes zero network calls', async () => {
  let calls = 0;
  const r = await checkPayment(
    { ...intent(), amount: '-1' },
    new HorizonProvider(url, {
      fetch: async () => {
        calls++;
        throw new Error();
      },
    }),
  );
  assert.equal(r.status, 'incomplete');
  assert.equal(calls, 0);
});
test('malformed custom provider observations become incomplete reports', async () => {
  const provider = new HorizonProvider(url, { fetch: mockFetch() });
  provider.getAccount = async () => undefined as never;
  const r = await checkPayment(intent(), provider);
  assert.equal(r.status, 'incomplete');
  assert.ok(r.issues.some((i) => i.code === 'MALFORMED_DATA'));
});
test('mutable input is captured before asynchronous reads', async () => {
  const payment = intent();
  const provider = new HorizonProvider(url, {
    fetch: mockFetch({
      '/': () => {
        payment.amount = '9';
        return response({ network_passphrase: Networks.TESTNET });
      },
    }),
  });
  const r = await checkPayment(payment, provider);
  assert.equal(r.status, 'no_known_issues');
});
test('leading zero decimal strings work through SDK memo inspection', async () => {
  const r = await checkPayment(
    intent({ amount: '0001.0000000' }),
    new HorizonProvider(url, { fetch: mockFetch() }),
  );
  assert.equal(r.status, 'no_known_issues');
});
test('slow response body is covered by timeout', async () => {
  const provider = new HorizonProvider(url, {
    timeoutMs: 10,
    fetch: async () => new Response(new ReadableStream({ start() {} })),
  });
  const r = await checkPayment(intent(), provider);
  assert.equal(r.status, 'incomplete');
  assert.ok(r.issues.some((i) => i.code === 'PROVIDER_TIMEOUT'));
});
test('SDK memo transport failures do not disappear behind successful account reads', async () => {
  let reads = 0;
  const provider = new HorizonProvider(url, {
    fetch: mockFetch({
      [`/accounts/${destination}`]: () =>
        ++reads === 1
          ? response({ ...account(destination), sequence: '100', data: {} })
          : response({}, 429),
    }),
  });
  const r = await checkPayment(intent(), provider);
  assert.equal(r.status, 'incomplete');
  assert.ok(r.issues.some((i) => i.code === 'PROVIDER_RATE_LIMITED'));
});
test('browser native fetch retains its global receiver', async () => {
  const original = globalThis.fetch;
  const transport = mockFetch();
  globalThis.fetch = async function (this: unknown, ...args: Parameters<typeof fetch>) {
    if (this !== globalThis) throw new TypeError('Illegal invocation');
    return transport(...args);
  };
  try {
    const r = await checkPayment(intent(), new HorizonProvider(url));
    assert.equal(r.status, 'no_known_issues');
  } finally {
    globalThis.fetch = original;
  }
});
