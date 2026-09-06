import {
  Account,
  AccountRequiresMemoError,
  Asset,
  Horizon,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { formatAmount } from './amounts.js';
import { isRecord, sdkMemo } from './input.js';
import type {
  MemoCheck,
  NetworkState,
  PaymentIntent,
  PaymentProvider,
  ProviderErrorCode,
  Read,
} from './types.js';
class ProviderFailure extends Error {
  constructor(
    readonly code: ProviderErrorCode,
    message: string,
  ) {
    super(message);
  }
}
/** Restrict the SDK memo helper's account loading to our bounded read transport. */
class MemoServer extends Horizon.Server {
  constructor(
    url: string,
    private readonly load: (address: string) => Promise<Horizon.AccountResponse>,
  ) {
    super(url, { allowHttp: new URL(url).protocol === 'http:' });
  }
  override loadAccount(address: string): Promise<Horizon.AccountResponse> {
    return this.load(address);
  }
}
export interface HorizonOptions {
  timeoutMs?: number;
  fetch?: typeof fetch;
  allowHttp?: boolean;
}
export class HorizonProvider implements PaymentProvider {
  readonly url: string;
  private readonly transport: typeof fetch;
  private readonly timeoutMs: number;
  constructor(url: string, options: HorizonOptions = {}) {
    const parsed = new URL(url);
    if (
      !['https:', 'http:'].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    )
      throw new Error('Use a plain HTTP(S) Horizon URL without credentials, query or fragment.');
    if (parsed.protocol === 'http:' && !options.allowHttp)
      throw new Error('HTTP requires explicit allowHttp for local development.');
    this.url = parsed.toString().replace(/\/$/, '');
    this.transport = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.timeoutMs = options.timeoutMs ?? 10_000;
    if (!Number.isSafeInteger(this.timeoutMs) || this.timeoutMs <= 0 || this.timeoutMs > 60_000)
      throw new Error('timeoutMs must be an integer between 1 and 60000.');
  }
  private async request(
    path: string,
    allowMissing = false,
  ): Promise<{ body: unknown; ledger?: number }> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(
          new ProviderFailure('PROVIDER_TIMEOUT', 'The Horizon read exceeded its time limit.'),
        );
        controller.abort();
      }, this.timeoutMs);
    });
    try {
      return await Promise.race([
        timeout,
        (async () => {
          const response = await this.transport(`${this.url}${path}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
            cache: 'no-store',
          });
          if (response.status === 404 && allowMissing) return { body: null };
          if (response.status === 429)
            throw new ProviderFailure(
              'PROVIDER_RATE_LIMITED',
              'Horizon rate-limited the read. Try again later.',
            );
          if (!response.ok)
            throw new ProviderFailure(
              'PROVIDER_UNAVAILABLE',
              `Horizon returned HTTP ${response.status}.`,
            );
          let body: unknown;
          try {
            body = await response.json();
          } catch {
            throw new ProviderFailure('MALFORMED_DATA', 'Horizon returned invalid JSON.');
          }
          const header = response.headers.get('x-last-ledger');
          if (
            header !== null &&
            (!/^\d+$/.test(header) || !Number.isSafeInteger(Number(header)) || Number(header) <= 0)
          )
            throw new ProviderFailure(
              'MALFORMED_DATA',
              'Horizon returned an invalid ledger header.',
            );
          return header === null ? { body } : { body, ledger: Number(header) };
        })(),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  private async capture<T>(fn: () => Promise<{ value: T; ledger?: number }>): Promise<Read<T>> {
    try {
      return { ok: true, ...(await fn()), observedAt: new Date().toISOString() };
    } catch (error) {
      return {
        ok: false,
        code: error instanceof ProviderFailure ? error.code : 'PROVIDER_UNAVAILABLE',
        message:
          error instanceof ProviderFailure
            ? error.message
            : 'The Horizon read could not be completed.',
        observedAt: new Date().toISOString(),
      };
    }
  }
  getNetwork(): Promise<Read<NetworkState>> {
    return this.capture(async () => {
      const root = await this.request('/');
      if (
        !isRecord(root.body) ||
        typeof root.body.network_passphrase !== 'string' ||
        !root.body.network_passphrase.trim()
      )
        throw new ProviderFailure('MALFORMED_DATA', 'Horizon network passphrase is missing.');
      const result = await this.request('/ledgers?order=desc&limit=1');
      const embedded = isRecord(result.body) && result.body._embedded;
      const records = isRecord(embedded) && embedded.records;
      const ledger: unknown = Array.isArray(records) ? records[0] : undefined;
      if (
        !isRecord(ledger) ||
        typeof ledger.sequence !== 'number' ||
        !Number.isSafeInteger(ledger.sequence) ||
        ledger.sequence <= 0
      )
        throw new ProviderFailure('MALFORMED_DATA', 'Horizon did not return a current ledger.');
      function units(value: unknown): string {
        if (
          (typeof value !== 'number' && typeof value !== 'string') ||
          !/^\d{1,10}$/.test(String(value))
        )
          throw new ProviderFailure(
            'MALFORMED_DATA',
            'Ledger reserve or base fee is missing or malformed.',
          );
        const amount = BigInt(value);
        if (amount <= 0n || amount > 4_294_967_295n)
          throw new ProviderFailure(
            'MALFORMED_DATA',
            'Ledger reserve or base fee is outside its range.',
          );
        return formatAmount(amount);
      }
      return {
        value: {
          networkPassphrase: root.body.network_passphrase,
          baseReserve: units(ledger.base_reserve_in_stroops),
          baseFee: units(ledger.base_fee_in_stroops),
          ledger: ledger.sequence,
        },
        ledger: ledger.sequence,
      };
    });
  }
  getAccount(address: string): Promise<Read<unknown | null>> {
    return this.capture(async () => {
      const { body, ...metadata } = await this.request(
        `/accounts/${encodeURIComponent(address)}`,
        true,
      );
      return { value: body, ...metadata };
    });
  }
  checkMemo(payment: PaymentIntent): Promise<Read<MemoCheck>> {
    return this.capture(async () => {
      let observedLedger: number | undefined;
      let missing = false;
      const server = new MemoServer(this.url, async (address) => {
        const result = await this.request(`/accounts/${encodeURIComponent(address)}`, true);
        observedLedger = result.ledger;
        if (result.body === null) {
          missing = true;
          throw new ProviderFailure('PROVIDER_UNAVAILABLE', 'Memo destination is missing.');
        }
        const record = result.body;
        // Horizon REST calls this `data`; the SDK exposes it as `data_attr`.
        if (
          !isRecord(record) ||
          record.account_id !== address ||
          typeof record.sequence !== 'string' ||
          !/^\d+$/.test(record.sequence) ||
          !isRecord(record.data) ||
          Object.values(record.data).some(
            (value) =>
              typeof value !== 'string' ||
              !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value),
          )
        )
          throw new ProviderFailure(
            'MALFORMED_DATA',
            'The account memo declaration data is missing or malformed.',
          );
        return new Horizon.AccountResponse({
          ...record,
          data_attr: record.data,
        } as unknown as Horizon.ServerApi.AccountRecord);
      });
      const asset =
        payment.asset.type === 'native'
          ? Asset.native()
          : new Asset(payment.asset.code, payment.asset.issuer);
      // Sequence 0 is only a container for SDK memo inspection; never signed or submitted.
      const builder = new TransactionBuilder(new Account(payment.source, '0'), {
        fee: '100',
        networkPassphrase: payment.networkPassphrase,
      })
        .addOperation(
          Operation.payment({ destination: payment.destination, asset, amount: payment.amount }),
        )
        .setTimeout(0);
      if (payment.memo) builder.addMemo(sdkMemo(payment.memo));
      let result: MemoCheck['result'] = payment.memo ? 'present' : 'not_required';
      try {
        await server.checkMemoRequired(builder.build());
      } catch (error) {
        if (error instanceof AccountRequiresMemoError) result = 'required';
        else if (!missing) throw error;
      }
      return {
        value: { result },
        ...(observedLedger === undefined ? {} : { ledger: observedLedger }),
      };
    });
  }
}
