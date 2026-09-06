export type Asset = { type: 'native' } | { type: 'credit'; code: string; issuer: string };
export type PaymentMemo = { type: 'text' | 'id' | 'hash' | 'return'; value: string };
/** Decimal strings use XLM/asset units, including feeBudget (not stroops). */
export interface PaymentIntent {
  networkPassphrase: string;
  source: string;
  destination: string;
  asset: Asset;
  amount: string;
  feeBudget: string;
  memo?: PaymentMemo;
  operationType?: 'payment';
  operationSource?: string;
  feePayer?: string;
}
export type DiagnosticCode =
  | 'INVALID_INPUT'
  | 'UNSUPPORTED_PAYMENT'
  | 'NETWORK_MISMATCH'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE'
  | 'MALFORMED_DATA'
  | 'SOURCE_ACCOUNT_MISSING'
  | 'DESTINATION_ACCOUNT_MISSING'
  | 'SOURCE_TRUSTLINE_MISSING'
  | 'DESTINATION_TRUSTLINE_MISSING'
  | 'SOURCE_NOT_AUTHORIZED'
  | 'DESTINATION_NOT_AUTHORIZED'
  | 'INSUFFICIENT_XLM'
  | 'INSUFFICIENT_ASSET'
  | 'DESTINATION_CAPACITY_EXCEEDED'
  | 'FEE_BUDGET_TOO_LOW'
  | 'MEMO_REQUIRED';
export type Party = 'sender' | 'recipient' | 'issuer' | 'application' | 'provider';
export interface Diagnostic {
  code: DiagnosticCode;
  party: Party;
  message: string;
  action: string;
}
export type ProviderErrorCode =
  'PROVIDER_TIMEOUT' | 'PROVIDER_RATE_LIMITED' | 'PROVIDER_UNAVAILABLE' | 'MALFORMED_DATA';
export type Read<T> =
  | { ok: true; value: T; observedAt: string; ledger?: number }
  | { ok: false; code: ProviderErrorCode; message: string; observedAt: string };
export interface NetworkState {
  networkPassphrase: string;
  baseReserve: string;
  baseFee: string;
  ledger: number;
}
export interface MemoCheck {
  result: 'required' | 'present' | 'not_required';
}
export interface Snapshot {
  network: Read<NetworkState>;
  source: Read<unknown | null>;
  destination: Read<unknown | null>;
  memo: Read<MemoCheck>;
}
export interface PaymentProvider {
  readonly url: string;
  getNetwork(): Promise<Read<NetworkState>>;
  getAccount(address: string): Promise<Read<unknown | null>>;
  checkMemo(payment: PaymentIntent): Promise<Read<MemoCheck>>;
}
export type Check =
  | 'input'
  | 'network'
  | 'source_account'
  | 'destination_account'
  | 'source_xlm'
  | 'source_asset'
  | 'destination_capacity'
  | 'memo';
export interface Coverage {
  check: Check;
  status: 'complete' | 'unresolved' | 'not_applicable';
  reason?: string;
}
export interface Facts {
  baseReserve?: string;
  baseFee?: string;
  sourceReserve?: string;
  sourceXlmBalance?: string;
  nativeSellingLiabilities?: string;
  feeBudget?: string;
  availableXlm?: string;
  requiredXlm?: string;
  xlmShortfall?: string;
  availableAsset?: string;
  assetShortfall?: string;
  receivingCapacity?: string;
  capacityShortfall?: string;
  memo?: 'required' | 'presence_only' | 'not_required';
}
export interface Report {
  status: 'no_known_issues' | 'issues_found' | 'incomplete';
  issues: Diagnostic[];
  facts: Facts;
  coverage: Coverage[];
  observation: {
    networkPassphrase: string | null;
    provider?: string;
    startedAt?: string;
    finishedAt?: string;
    reads: { check: keyof Snapshot; observedAt: string; ledger?: number }[];
    sourceLastModifiedLedger?: number;
    destinationLastModifiedLedger?: number;
    atomic: false;
  };
  limitations: string[];
}
