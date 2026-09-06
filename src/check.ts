import { assessPayment } from './assess.js';
import { isRecord, validateIntent } from './input.js';
import { validateNetwork } from './state.js';
import type { PaymentProvider, Read, Report, Snapshot } from './types.js';
/** Fresh observations on every call. An incomplete report may still contain known issues. */
export async function checkPayment(input: unknown, provider: PaymentProvider): Promise<Report> {
  let capturedInput = input;
  const startedAt = new Date().toISOString();
  const unavailable: Read<never> = {
    ok: false,
    code: 'PROVIDER_UNAVAILABLE',
    message:
      'This read was not attempted because required input or network metadata was unavailable.',
    observedAt: startedAt,
  };
  const snapshot: Snapshot = {
    network: unavailable,
    source: unavailable,
    destination: unavailable,
    memo: unavailable,
  };
  function finish() {
    const report = assessPayment(capturedInput, snapshot);
    report.observation = {
      ...report.observation,
      provider: provider.url,
      startedAt,
      finishedAt: new Date().toISOString(),
    };
    return report;
  }
  const validated = validateIntent(input);
  if (!('payment' in validated)) return finish();
  const payment = {
    ...validated.payment,
    asset: { ...validated.payment.asset },
    ...(validated.payment.memo ? { memo: { ...validated.payment.memo } } : {}),
  };
  capturedInput = payment;
  async function read<T>(fn: () => Promise<Read<T>>): Promise<Read<T>> {
    try {
      const result = await fn();
      if (
        !isRecord(result) ||
        typeof result.ok !== 'boolean' ||
        typeof result.observedAt !== 'string' ||
        (result.ok && !('value' in result)) ||
        (!result.ok &&
          (![
            'PROVIDER_TIMEOUT',
            'PROVIDER_RATE_LIMITED',
            'PROVIDER_UNAVAILABLE',
            'MALFORMED_DATA',
          ].includes(String(result.code)) ||
            typeof result.message !== 'string'))
      )
        return {
          ok: false,
          code: 'MALFORMED_DATA',
          message: 'The provider returned a malformed observation.',
          observedAt: new Date().toISOString(),
        };
      return result;
    } catch {
      return {
        ok: false,
        code: 'PROVIDER_UNAVAILABLE',
        message: 'The provider failed to return an observation.',
        observedAt: new Date().toISOString(),
      };
    }
  }
  snapshot.network = await read(() => provider.getNetwork());
  if (!snapshot.network.ok) return finish();
  try {
    validateNetwork(snapshot.network.value);
  } catch {
    return finish();
  }
  if (snapshot.network.value.networkPassphrase !== payment.networkPassphrase) return finish();
  [snapshot.source, snapshot.destination, snapshot.memo] = await Promise.all([
    read(() => provider.getAccount(payment.source)),
    read(() => provider.getAccount(payment.destination)),
    read(() => provider.checkMemo(payment)),
  ]);
  return finish();
}
