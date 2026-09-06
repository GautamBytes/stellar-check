import { StrKey } from '@stellar/stellar-sdk';
import { MAX_AMOUNT, parseAmount } from './amounts.js';
import { isRecord } from './input.js';
import type { Asset, NetworkState } from './types.js';
export interface Balance {
  balance: bigint;
  selling: bigint;
  buying: bigint;
  limit: bigint;
  authorized: boolean;
}
export interface AccountState {
  reserveUnits: bigint;
  native: Balance;
  asset?: Balance;
  lastModifiedLedger: number;
}
function count(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > 4_294_967_295
  )
    throw new Error('Missing or invalid account counter/ledger.');
  return value;
}
export function validateNetwork(value: NetworkState): { reserve: bigint; fee: bigint } {
  if (
    !isRecord(value) ||
    typeof value.networkPassphrase !== 'string' ||
    !value.networkPassphrase.trim() ||
    count(value.ledger) === 0
  )
    throw new Error('Missing network identity or ledger.');
  const reserve = parseAmount(value.baseReserve, 4_294_967_295n),
    fee = parseAmount(value.baseFee, 4_294_967_295n);
  if (reserve === 0n || fee === 0n) throw new Error('Base reserve and base fee must be positive.');
  return { reserve, fee };
}
/** Validate relevant entries; unrelated pool-share entries never substitute for a trustline. */
export function parseAccount(value: unknown, address: string, asset: Asset): AccountState {
  if (!isRecord(value) || value.account_id !== address || !Array.isArray(value.balances))
    throw new Error('Account identity or balances are missing or inconsistent.');
  const subentries = count(value.subentry_count),
    sponsoring = count(value.num_sponsoring),
    sponsored = count(value.num_sponsored);
  if (sponsored > 2 + subentries)
    throw new Error('Sponsored reserves exceed this account’s reserve entries.');
  const reserveUnits = BigInt(2 + subentries + sponsoring - sponsored);
  const entries = new Map<string, Record<string, unknown>>();
  for (const entry of value.balances) {
    if (!isRecord(entry) || typeof entry.asset_type !== 'string')
      throw new Error('Malformed balance entry.');
    let key: string;
    if (entry.asset_type === 'native') key = 'native';
    else if (entry.asset_type === 'liquidity_pool_shares') {
      if (
        typeof entry.liquidity_pool_id !== 'string' ||
        !/^[0-9a-f]{64}$/.test(entry.liquidity_pool_id)
      )
        throw new Error('Malformed pool-share identity.');
      key = `pool:${entry.liquidity_pool_id}`;
    } else if (['credit_alphanum4', 'credit_alphanum12'].includes(entry.asset_type)) {
      if (
        typeof entry.asset_code !== 'string' ||
        !/^[a-zA-Z0-9]{1,12}$/.test(entry.asset_code) ||
        typeof entry.asset_issuer !== 'string' ||
        !StrKey.isValidEd25519PublicKey(entry.asset_issuer)
      )
        throw new Error('Malformed trustline asset identity.');
      if (entry.asset_code.length <= 4 !== (entry.asset_type === 'credit_alphanum4'))
        throw new Error('Asset code length does not match its type.');
      key = `${entry.asset_code}:${entry.asset_issuer}`;
    } else throw new Error('Unknown balance entry type.');
    if (entries.has(key)) throw new Error('Duplicate balance entry.');
    entries.set(key, entry);
  }
  if (entries.size - (entries.has('native') ? 1 : 0) > subentries)
    throw new Error('Subentry count omits returned trustlines or pool shares.');
  function balance(entry: Record<string, unknown> | undefined, native: boolean): Balance {
    if (!entry) throw new Error('Native balance is missing.');
    const amount = parseAmount(entry.balance),
      selling = parseAmount(entry.selling_liabilities),
      buying = parseAmount(entry.buying_liabilities);
    const limit = native ? MAX_AMOUNT : parseAmount(entry.limit);
    if (selling > amount || amount > limit || buying > limit - amount)
      throw new Error('Balance, liabilities and limit are inconsistent.');
    if (!native && typeof entry.is_authorized !== 'boolean')
      throw new Error('Trustline authorization is missing.');
    return {
      balance: amount,
      selling,
      buying,
      limit,
      authorized: native || entry.is_authorized === true,
    };
  }
  const result: AccountState = {
    reserveUnits,
    native: balance(entries.get('native'), true),
    lastModifiedLedger: count(value.last_modified_ledger),
  };
  const relevant =
    asset.type === 'credit' ? entries.get(`${asset.code}:${asset.issuer}`) : undefined;
  if (relevant) result.asset = balance(relevant, false);
  return result;
}
