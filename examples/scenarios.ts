import { Networks } from '@stellar/stellar-sdk';
import type { PaymentIntent, Read, Snapshot } from '../src/index.js';
// Controlled fixtures with public addresses only; not live testnet observations.
export const fixtureSource = 'GCFIRY65OQE7DFP5KLNS2PF2LVZMUZYJX4OZIEQ36N2IQANUB5XVYOJR';
export const fixtureDestination = 'GCATS5YOVB6ROX2WUNKGNQ2MP3GMXDMKSG2O4N5CLX3A6W4PZGZZI55U';
export const fixtureIssuer = 'GDWUSKGGFDI4FRXK5EBTRECZSVQSSWJHHJOGH6JWG3AUMFFMQ435DIAG';
export const scenarioNames = {
  xlm: 'Valid XLM payment',
  credit: 'Valid issued asset',
  trustline: 'Missing recipient trustline',
  funds: 'Insufficient source availability',
};
export type Scenario = keyof typeof scenarioNames;
export function scenario(name: Scenario): { payment: PaymentIntent; snapshot: Snapshot } {
  const read = <T>(value: T): Read<T> => ({
    ok: true,
    value,
    observedAt: '2026-09-06T12:00:00.000Z',
    ledger: 101,
  });
  const account = (id: string, hasTrustline = true) => ({
    account_id: id,
    subentry_count: hasTrustline ? 1 : 0,
    num_sponsoring: 0,
    num_sponsored: 0,
    last_modified_ledger: 100,
    balances: [
      { asset_type: 'native', balance: '10', selling_liabilities: '0', buying_liabilities: '0' },
      ...(hasTrustline
        ? [
            {
              asset_type: 'credit_alphanum4',
              asset_code: 'USD',
              asset_issuer: fixtureIssuer,
              balance: '100',
              limit: '1000',
              selling_liabilities: '0',
              buying_liabilities: '0',
              is_authorized: true,
            },
          ]
        : []),
    ],
  });
  return {
    payment: {
      networkPassphrase: Networks.TESTNET,
      source: fixtureSource,
      destination: fixtureDestination,
      asset:
        name === 'credit' || name === 'trustline'
          ? { type: 'credit', code: 'USD', issuer: fixtureIssuer }
          : { type: 'native' },
      amount: name === 'funds' ? '9' : '1',
      feeBudget: '0.00001',
    },
    snapshot: {
      network: read({
        networkPassphrase: Networks.TESTNET,
        baseReserve: '0.5',
        baseFee: '0.00001',
        ledger: 101,
      }),
      source: read(account(fixtureSource)),
      destination: read(account(fixtureDestination, name !== 'trustline')),
      memo: read({ result: 'not_required' }),
    },
  };
}
