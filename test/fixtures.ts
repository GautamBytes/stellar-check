import { Keypair, Networks } from '@stellar/stellar-sdk';
import type { PaymentIntent, Snapshot, Read } from '../src/types.js';
export const source = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 1)).publicKey();
export const destination = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 2)).publicKey();
export const issuer = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 3)).publicKey();
export const otherIssuer = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 4)).publicKey();
export const credit = { type: 'credit', code: 'USD', issuer } as const;
export const intent = (patch: Partial<PaymentIntent> = {}): PaymentIntent => ({
  networkPassphrase: Networks.TESTNET,
  source,
  destination,
  asset: { type: 'native' },
  amount: '1',
  feeBudget: '0.00001',
  ...patch,
});
export const line = (patch: Record<string, unknown> = {}) => ({
  asset_type: 'credit_alphanum4',
  asset_code: 'USD',
  asset_issuer: issuer,
  balance: '100.0000000',
  limit: '1000.0000000',
  selling_liabilities: '0.0000000',
  buying_liabilities: '0.0000000',
  is_authorized: true,
  ...patch,
});
export const account = (id: string, patch: Record<string, unknown> = {}) => ({
  account_id: id,
  subentry_count: 1,
  num_sponsoring: 0,
  num_sponsored: 0,
  last_modified_ledger: 100,
  balances: [
    {
      asset_type: 'native',
      balance: '10.0000000',
      selling_liabilities: '0.0000000',
      buying_liabilities: '0.0000000',
    },
    line(),
  ],
  ...patch,
});
export const read = <T>(value: T): Read<T> => ({
  ok: true,
  value,
  observedAt: '2026-09-06T12:00:00.000Z',
  ledger: 101,
});
export const snapshot = (): Snapshot => ({
  network: read({
    networkPassphrase: Networks.TESTNET,
    baseReserve: '0.5',
    baseFee: '0.00001',
    ledger: 101,
  }),
  source: read(account(source)),
  destination: read(account(destination)),
  memo: read({ result: 'not_required' }),
});
export const native = (balance: string, selling = '0', buying = '0') => ({
  asset_type: 'native',
  balance,
  selling_liabilities: selling,
  buying_liabilities: buying,
});
