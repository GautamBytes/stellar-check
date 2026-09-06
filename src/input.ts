import { Memo, StrKey } from '@stellar/stellar-sdk';
import { parseAmount } from './amounts.js';
import type { Diagnostic, PaymentIntent, PaymentMemo } from './types.js';
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function sdkMemo(memo: PaymentMemo): Memo {
  switch (memo.type) {
    case 'text':
      return Memo.text(memo.value);
    case 'id':
      return Memo.id(memo.value);
    case 'hash':
      return Memo.hash(memo.value);
    case 'return':
      return Memo.return(memo.value);
  }
}
export function validateIntent(
  value: unknown,
): { payment: PaymentIntent; issues: [] } | { issues: Diagnostic[] } {
  const fail = (unsupported: boolean, message: string) => ({
    issues: [
      {
        code: unsupported ? ('UNSUPPORTED_PAYMENT' as const) : ('INVALID_INPUT' as const),
        party: 'application' as const,
        message,
        action: unsupported
          ? 'Use one classic payment between distinct G accounts, with one source and fee payer.'
          : 'Correct the payment input and check again.',
      },
    ],
  });
  if (!isRecord(value)) return fail(false, 'Payment must be an object.');
  const allowed = new Set([
    'networkPassphrase',
    'source',
    'destination',
    'asset',
    'amount',
    'feeBudget',
    'memo',
    'operationType',
    'operationSource',
    'feePayer',
  ]);
  if (Object.keys(value).some((key) => !allowed.has(key)))
    return fail(true, 'This payment includes unsupported fields or transaction features.');
  if (value.operationType !== undefined && value.operationType !== 'payment')
    return fail(true, 'Only a classic payment is supported.');
  if (typeof value.source !== 'string' || typeof value.destination !== 'string')
    return fail(false, 'Source and destination must be public G addresses.');
  if (
    !value.source.startsWith('G') ||
    !value.destination.startsWith('G') ||
    value.source === value.destination
  )
    return fail(true, 'Only distinct ordinary G-address accounts are supported.');
  if (
    !StrKey.isValidEd25519PublicKey(value.source) ||
    !StrKey.isValidEd25519PublicKey(value.destination)
  )
    return fail(false, 'Source or destination has an invalid address checksum.');
  if (
    (value.feePayer !== undefined && value.feePayer !== value.source) ||
    (value.operationSource !== undefined && value.operationSource !== value.source)
  )
    return fail(true, 'Separate operation sources and fee payers are unsupported.');
  if (typeof value.networkPassphrase !== 'string' || !value.networkPassphrase.trim())
    return fail(false, 'Choose an explicit network passphrase.');
  if (!isRecord(value.asset) || !['native', 'credit'].includes(String(value.asset.type)))
    return fail(true, 'Only native XLM or a classic issued asset is supported.');
  const asset = value.asset;
  if (asset.type === 'native' && Object.keys(asset).some((key) => key !== 'type'))
    return fail(false, 'Native XLM must not specify a code or issuer.');
  if (asset.type === 'credit') {
    if (Object.keys(asset).some((key) => !['type', 'code', 'issuer'].includes(key)))
      return fail(true, 'Unsupported asset fields.');
    if (
      typeof asset.code !== 'string' ||
      !/^[a-zA-Z0-9]{1,12}$/.test(asset.code) ||
      typeof asset.issuer !== 'string' ||
      !StrKey.isValidEd25519PublicKey(asset.issuer)
    )
      return fail(
        false,
        'Issued assets require a 1–12 character alphanumeric code and valid G-address issuer.',
      );
    if (asset.issuer === value.source || asset.issuer === value.destination)
      return fail(true, 'Payments involving the asset issuer as a party are unsupported.');
  }
  try {
    if (parseAmount(value.amount) === 0n)
      return fail(false, 'Payment amount must be greater than zero.');
    if (parseAmount(value.feeBudget, 4_294_967_295n) === 0n)
      return fail(false, 'Fee budget must be positive and within the transaction fee range.');
    if (value.memo !== undefined) {
      if (
        !isRecord(value.memo) ||
        Object.keys(value.memo).some((k) => !['type', 'value'].includes(k)) ||
        !['text', 'id', 'hash', 'return'].includes(String(value.memo.type)) ||
        typeof value.memo.value !== 'string'
      )
        return fail(false, 'Use a text, ID, hash or return-hash memo.');
      if (value.memo.type === 'id' && !/^\d{1,20}$/.test(value.memo.value))
        return fail(false, 'Memo ID must be an unsigned integer string.');
      if (
        ['hash', 'return'].includes(String(value.memo.type)) &&
        !/^[0-9a-fA-F]{64}$/.test(value.memo.value)
      )
        return fail(false, 'Hash memos must contain 64 hexadecimal characters.');
      sdkMemo(value.memo as unknown as PaymentMemo);
    }
  } catch (error) {
    return fail(false, error instanceof Error ? error.message : 'Invalid amount or memo.');
  }
  return { payment: value as unknown as PaymentIntent, issues: [] };
}
