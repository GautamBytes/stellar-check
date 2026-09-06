export const SCALE = 10_000_000n;
export const MAX_AMOUNT = 9_223_372_036_854_775_807n;
export function parseAmount(value: unknown, max = MAX_AMOUNT): bigint {
  if (typeof value !== 'string' || value.length > 32 || !/^\d+(\.\d{1,7})?$/.test(value)) {
    throw new Error('Use a decimal string with at most seven decimal places.');
  }
  const [whole = '', fraction = ''] = value.split('.');
  const units = BigInt(whole) * SCALE + BigInt(fraction.padEnd(7, '0'));
  if (units > max) throw new Error('Amount exceeds the protocol range.');
  return units;
}
export function formatAmount(units: bigint): string {
  const sign = units < 0n ? '-' : '';
  const positive = units < 0n ? -units : units;
  return `${sign}${positive / SCALE}.${(positive % SCALE).toString().padStart(7, '0')}`;
}
export const positivePart = (units: bigint): bigint => (units > 0n ? units : 0n);
