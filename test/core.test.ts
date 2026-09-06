import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessPayment } from '../src/assess.js';
import {
  account,
  credit,
  destination,
  intent,
  issuer,
  line,
  native,
  otherIssuer,
  read,
  snapshot,
  source,
} from './fixtures.js';
import type { Snapshot } from '../src/types.js';
function check(code: string, state: Snapshot, payment: unknown = intent()) {
  const report = assessPayment(payment, state);
  assert.notEqual(report.status, 'no_known_issues');
  assert.ok(
    report.issues.some((issue) => issue.code === code),
    JSON.stringify(report),
  );
  return report;
}
test('01 valid XLM payment returns exact facts and complete coverage', () => {
  const r = assessPayment(intent(), snapshot());
  assert.equal(r.status, 'no_known_issues');
  assert.equal(r.facts.sourceReserve, '1.5000000');
  assert.equal(r.facts.availableXlm, '8.4999900');
  assert.ok(r.coverage.every((c) => c.status !== 'unresolved'));
  assert.doesNotThrow(() => JSON.stringify(r));
});
test('02 valid issued payment', () =>
  assert.equal(assessPayment(intent({ asset: credit }), snapshot()).status, 'no_known_issues'));
for (const [n, party, code] of [
  [3, 'source', 'SOURCE_ACCOUNT_MISSING'],
  [4, 'destination', 'DESTINATION_ACCOUNT_MISSING'],
] as const) {
  test(`${n} missing ${party}`, () => {
    const s = snapshot();
    s[party] = read(null);
    check(code, s);
  });
}
for (const [n, party, code] of [
  [5, 'source', 'SOURCE_TRUSTLINE_MISSING'],
  [6, 'destination', 'DESTINATION_TRUSTLINE_MISSING'],
] as const) {
  test(`${n} missing ${party} trustline`, () => {
    const s = snapshot();
    s[party] = read(
      account(party === 'source' ? source : destination, { balances: [native('10')] }),
    );
    check(code, s, intent({ asset: credit }));
  });
}
test('07 same code, different issuer is not a match', () => {
  const s = snapshot();
  s.destination = read(
    account(destination, { balances: [native('10'), line({ asset_issuer: otherIssuer })] }),
  );
  check('DESTINATION_TRUSTLINE_MISSING', s, intent({ asset: credit }));
});
for (const [n, party, code] of [
  [8, 'source', 'SOURCE_NOT_AUTHORIZED'],
  [9, 'destination', 'DESTINATION_NOT_AUTHORIZED'],
] as const) {
  for (const maintain of [true, false])
    test(`${n} ${party} authorization; maintain liabilities ${maintain}`, () => {
      const s = snapshot();
      s[party] = read(
        account(party === 'source' ? source : destination, {
          balances: [
            native('10'),
            line({ is_authorized: false, is_authorized_to_maintain_liabilities: maintain }),
          ],
        }),
      );
      check(code, s, intent({ asset: credit }));
    });
}
test('10 exactly sufficient XLM including fee', () =>
  assert.equal(assessPayment(intent({ amount: '8.49999' }), snapshot()).status, 'no_known_issues'));
test('11 one-stroop XLM shortfall', () =>
  assert.equal(
    check('INSUFFICIENT_XLM', snapshot(), intent({ amount: '8.4999901' })).facts.xlmShortfall,
    '0.0000001',
  ));
for (const [n, counts, reserve] of [
  [12, { subentry_count: 4 }, '3.0000000'],
  [13, { num_sponsoring: 2 }, '2.5000000'],
  [14, { num_sponsored: 3 }, '0.0000000'],
  [14, { num_sponsoring: 3, num_sponsored: 2 }, '2.0000000'],
] as const)
  test(`${n} reserve ${JSON.stringify(counts)}`, () => {
    const s = snapshot();
    s.source = read(account(source, counts));
    assert.equal(assessPayment(intent(), s).facts.sourceReserve, reserve);
  });
test('15 native selling liabilities', () => {
  const s = snapshot();
  s.source = read(account(source, { balances: [native('10', '8')] }));
  check('INSUFFICIENT_XLM', s);
});
test('16 issued selling liabilities boundary', () => {
  const s = snapshot();
  s.source = read(
    account(source, { balances: [native('10'), line({ selling_liabilities: '99' })] }),
  );
  assert.equal(assessPayment(intent({ asset: credit }), s).status, 'no_known_issues');
  assert.equal(
    check('INSUFFICIENT_ASSET', s, intent({ asset: credit, amount: '1.0000001' })).facts
      .assetShortfall,
    '0.0000001',
  );
});
test('17 issued funds sufficient but XLM below reserve plus fee', () => {
  const s = snapshot();
  s.source = read(account(source, { balances: [native('1.5'), line()] }));
  check('INSUFFICIENT_XLM', s, intent({ asset: credit }));
});
for (const [n, amount, buying, ok] of [
  [18, '5', '0', true],
  [19, '5.0000001', '0', false],
  [20, '5', '0.0000001', false],
] as const) {
  test(`${n} receiving capacity boundary`, () => {
    const s = snapshot();
    s.destination = read(
      account(destination, {
        balances: [native('10'), line({ balance: '95', limit: '100', buying_liabilities: buying })],
      }),
    );
    const p = intent({ asset: credit, amount });
    if (ok) assert.equal(assessPayment(p, s).status, 'no_known_issues');
    else check('DESTINATION_CAPACITY_EXCEEDED', s, p);
  });
}
test('21 required memo absent', () => {
  const s = snapshot();
  s.memo = read({ result: 'required' });
  check('MEMO_REQUIRED', s);
});
test('22 supplied memo is only a presence check', () => {
  const s = snapshot();
  s.memo = read({ result: 'present' });
  const r = assessPayment(intent({ memo: { type: 'text', value: 'customer' } }), s);
  assert.equal(r.status, 'no_known_issues');
  assert.equal(r.facts.memo, 'presence_only');
});
test('23 no memo declaration does not infer exchange identity', () =>
  assert.equal(assessPayment(intent(), snapshot()).facts.memo, 'not_required'));
for (const amount of [
  '0',
  '-1',
  '+1',
  '0.00000001',
  '922337203685.4775808',
  '1e2',
  ' 1',
  '',
  'NaN',
  1,
  null,
]) {
  test(`24 invalid amount ${amount}`, () => {
    check('INVALID_INPUT', snapshot(), { ...intent(), amount });
  });
}
test('24 maximum protocol amount remains exact', () => {
  check('INSUFFICIENT_XLM', snapshot(), intent({ amount: '922337203685.4775807' }));
});
for (const feeBudget of ['0', '-1', '429.4967296', '0.00000001'])
  test(`24 invalid fee ${feeBudget}`, () => {
    check('INVALID_INPUT', snapshot(), intent({ feeBudget }));
  });
for (const patch of [
  { source: destination },
  { source: 'M' + 'A'.repeat(68) },
  { operationType: 'pathPaymentStrictSend' },
  { operations: [] },
  { feePayer: destination },
  { operationSource: destination },
  { feeBump: true },
  { asset: { type: 'soroban' } },
  { asset: { type: 'credit', code: 'USD', issuer: source } },
  { asset: { type: 'credit', code: 'USD', issuer: destination } },
  { destination: 'alice*example.org' },
])
  test(`27 unsupported shape ${JSON.stringify(patch)}`, () => {
    assert.equal(
      check('UNSUPPORTED_PAYMENT', snapshot(), { ...intent(), ...patch }).status,
      'incomplete',
    );
  });
test('28 partial read retains known issue but is incomplete', () => {
  const s = snapshot();
  s.source = read(null);
  s.destination = {
    ok: false,
    code: 'PROVIDER_TIMEOUT',
    message: 'timed out',
    observedAt: '2026-09-06T12:00:00.000Z',
  };
  const r = check('SOURCE_ACCOUNT_MISSING', s);
  assert.equal(r.status, 'incomplete');
  assert.ok(r.coverage.some((c) => c.status === 'unresolved'));
});
for (const patch of [
  { num_sponsored: 4 },
  { num_sponsoring: undefined },
  { subentry_count: -1 },
  { account_id: issuer },
  { balances: [native('10'), native('10')] },
]) {
  test(`28 malformed account ${JSON.stringify(patch)}`, () => {
    const s = snapshot();
    s.source = read(account(source, patch));
    assert.equal(check('MALFORMED_DATA', s).status, 'incomplete');
  });
}
test('28 missing liability cannot become zero', () => {
  const s = snapshot();
  s.source = read(account(source, { balances: [{ asset_type: 'native', balance: '10' }] }));
  assert.equal(check('MALFORMED_DATA', s).status, 'incomplete');
});
test('fee budget below current network base fee is diagnosed', () => {
  check('FEE_BUDGET_TOO_LOW', snapshot(), intent({ feeBudget: '0.0000001' }));
});
test('native recipient overflow includes buying liabilities', () => {
  const s = snapshot();
  s.destination = read(
    account(destination, { balances: [native('922337203685.4775805', '0', '0.0000001')] }),
  );
  assert.equal(assessPayment(intent({ amount: '0.0000001' }), s).status, 'no_known_issues');
  check('DESTINATION_CAPACITY_EXCEEDED', s, intent({ amount: '0.0000002' }));
});
test('subentry count cannot omit a returned trustline', () => {
  const s = snapshot();
  s.source = read(account(source, { subentry_count: 0 }));
  assert.equal(check('MALFORMED_DATA', s).status, 'incomplete');
});
test('modified ledger cannot be later than observation ledger', () => {
  const s = snapshot();
  s.source = read(account(source, { last_modified_ledger: 102 }));
  assert.equal(check('MALFORMED_DATA', s).status, 'incomplete');
});
for (const memo of [
  { type: 'id', value: '18446744073709551616' },
  { type: 'text', value: 'a'.repeat(29) },
  { type: 'hash', value: 'hello' },
])
  test(`invalid memo ${memo.type}`, () => {
    check('INVALID_INPUT', snapshot(), { ...intent(), memo });
  });
for (const patch of [
  { is_authorized: undefined },
  { balance: '1001' },
  { selling_liabilities: '101' },
  { buying_liabilities: '901' },
])
  test(`inconsistent credit data ${JSON.stringify(patch)}`, () => {
    const s = snapshot();
    s.source = read(account(source, { balances: [native('10'), line(patch)] }));
    assert.equal(check('MALFORMED_DATA', s, intent({ asset: credit })).status, 'incomplete');
  });
