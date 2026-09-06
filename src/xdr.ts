import { Transaction, TransactionBuilder } from '@stellar/stellar-sdk';
import { formatAmount } from './amounts.js';
import { validateIntent } from './input.js';
import type { PaymentIntent, PaymentMemo } from './types.js';

export type XdrImportResult =
  | { ok: true; payment: PaymentIntent; context: { sequence: string; timeBounds?: {minTime: string; maxTime: string}; limitations: string[] } }
  | { ok: false; code: 'INVALID_XDR' | 'UNSUPPORTED_XDR'; message: string };

/** Decode locally. This extracts a payment intent; it does not validate a transaction. */
export function importPaymentXdr(input: unknown, networkPassphrase: string): XdrImportResult {
  const fail = (message: string, unsupported = false): XdrImportResult => ({ok:false, code:unsupported ? 'UNSUPPORTED_XDR' : 'INVALID_XDR', message});
  if(typeof networkPassphrase !== 'string' || !networkPassphrase.trim()) return fail('Choose the network explicitly. XDR does not identify its network.');
  if(typeof input !== 'string' || !input.trim() || input.length > 32768) return fail('Paste a base64 transaction envelope of at most 32 KB.');
  const encoded = input.replace(/\s/g, '');
  if(encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return fail('Use the complete base64 transaction envelope, including its padding.');
  try {
    const tx = TransactionBuilder.fromXdr(encoded, networkPassphrase);
    if(tx.toXdr() !== encoded) return fail('The XDR is noncanonical or contains trailing data. Export a fresh transaction envelope.');
    if(!(tx instanceof Transaction)) return fail('Fee-bump envelopes are outside this importer. Use one unsigned classic payment.',true);
    const envelope = tx.toEnvelope();
    if(envelope.type !== 'envelopeTypeTx') return fail('Only modern V1 transaction envelopes are supported.',true);
    if(tx.signatures.length) return fail('Use an unsigned envelope. Signed transactions are outside this importer.',true);
    const raw = envelope.value.tx;
    if(raw.ext.type !== 'v0') return fail('Transaction extensions, including Soroban data, are unsupported.',true);
    if(raw.cond.type === 'precondV2') return fail('Extended transaction preconditions are unsupported. They cannot be assessed by this payment checker.',true);
    if(tx.operations.length !== 1) return fail('Import exactly one classic payment operation. Batches are unsupported.',true);
    const operation = tx.operations[0]!;
    if(operation.type !== 'payment') return fail('Only a classic payment operation is supported. Path payments and other operations are unsupported.',true);
    let memo: PaymentMemo | undefined;
    const decodedMemo = tx.memo;
    if(decodedMemo.type !== 'none') {
      const value = decodedMemo.value;
      const text = value instanceof Uint8Array
        ? decodedMemo.type === 'text'
          ? new TextDecoder('utf-8', {fatal:true, ignoreBOM:true}).decode(value)
          : Array.from(value, byte => byte.toString(16).padStart(2,'0')).join('')
        : String(value);
      memo = {type:decodedMemo.type, value:text};
    }
    const payment: PaymentIntent = {
      networkPassphrase,
      source:tx.source,
      destination:operation.destination,
      asset:operation.asset.isNative() ? {type:'native'} : {type:'credit', code:operation.asset.getCode(), issuer:operation.asset.getIssuer()!},
      amount:operation.amount,
      feeBudget:formatAmount(BigInt(tx.fee)),
      ...(operation.source ? {operationSource:operation.source} : {}),
      ...(memo ? {memo} : {}),
    };
    const validated = validateIntent(payment);
    if(!('payment' in validated)) return fail(validated.issues[0]!.message,true);
    return {ok:true, payment:validated.payment, context:{
      sequence:tx.sequence,
      ...(tx.timeBounds ? {timeBounds:tx.timeBounds} : {}),
      limitations:[
        'The network is selected by you; it is not encoded in the envelope.',
        'Only payment readiness is assessed. Sequence numbers, time bounds, signatures and transaction execution are not validated.',
        'Editing the imported payment changes the form only. The original XDR is not modified or rebuilt.',
      ],
    }};
  } catch {
    return fail('The envelope could not be decoded without changing its contents. Check the XDR and use a supported UTF-8 text memo.');
  }
}
