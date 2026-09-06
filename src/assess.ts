import { formatAmount, MAX_AMOUNT, parseAmount, positivePart } from './amounts.js';
import { isRecord, validateIntent } from './input.js';
import { parseAccount, validateNetwork } from './state.js';
import type { AccountState } from './state.js';
import type { Check, DiagnosticCode, Party, Read, Report, Snapshot } from './types.js';
const CHECKS: Check[] = [
  'input',
  'network',
  'source_account',
  'destination_account',
  'source_xlm',
  'source_asset',
  'destination_capacity',
  'memo',
];
export function assessPayment(input: unknown, snapshot: Snapshot): Report {
  const validated = validateIntent(input);
  const report: Report = {
    status: 'incomplete',
    issues: [...validated.issues],
    facts: {},
    coverage: CHECKS.map((check) => ({
      check,
      status: 'unresolved',
      reason: 'Required input or observation is unavailable.',
    })),
    observation: {
      networkPassphrase: 'payment' in validated ? validated.payment.networkPassphrase : null,
      reads: [],
      atomic: false,
    },
    limitations: [
      'Separate reads are not an atomic snapshot. Refresh before confirmation and whenever the payment changes.',
      'No supported issue found in observed data does not guarantee transaction success.',
      'Signatures, sequence numbers, submission, finality and surge-fee inclusion are not assessed.',
      'Memo checks establish a declared requirement or memo presence, never the intended customer’s identity.',
    ],
  };
  function mark(
    check: Check,
    status: 'complete' | 'unresolved' | 'not_applicable',
    reason?: string,
  ) {
    report.coverage[CHECKS.indexOf(check)] =
      reason === undefined ? { check, status } : { check, status, reason };
  }
  function issue(code: DiagnosticCode, party: Party, message: string, action: string) {
    report.issues.push({ code, party, message, action });
  }
  function read<T>(
    key: keyof Snapshot,
    check: Check,
    observation: Read<T>,
  ): { value: T } | undefined {
    if (
      !isRecord(observation) ||
      typeof observation.ok !== 'boolean' ||
      typeof observation.observedAt !== 'string'
    ) {
      issue(
        'MALFORMED_DATA',
        'provider',
        'The provider returned a malformed observation.',
        'Return complete observation envelopes from the provider.',
      );
      return;
    }
    report.observation.reads.push({
      check: key,
      observedAt: observation.observedAt,
      ...(observation.ok && observation.ledger !== undefined ? { ledger: observation.ledger } : {}),
    });
    if (!observation.ok) {
      issue(
        observation.code,
        'provider',
        observation.message,
        'Refresh public account data or choose an available provider, then check again.',
      );
      mark(check, 'unresolved', observation.code);
      return;
    }
    if (
      !Number.isFinite(Date.parse(observation.observedAt)) ||
      (observation.ledger !== undefined &&
        (!Number.isSafeInteger(observation.ledger) || observation.ledger <= 0))
    ) {
      issue(
        'MALFORMED_DATA',
        'provider',
        'Observation metadata is invalid.',
        'Use a provider with complete observation metadata.',
      );
      return;
    }
    return { value: observation.value };
  }
  if (!('payment' in validated)) return report;
  mark('input', 'complete');
  const p = validated.payment;
  const network = read('network', 'network', snapshot.network);
  if (!network) return report;
  let reserve: bigint, baseFee: bigint;
  try {
    ({ reserve, fee: baseFee } = validateNetwork(network.value));
  } catch (error) {
    issue(
      'MALFORMED_DATA',
      'provider',
      String(error),
      'Use complete, consistent network metadata.',
    );
    return report;
  }
  if (network.value.networkPassphrase !== p.networkPassphrase) {
    issue(
      'NETWORK_MISMATCH',
      'application',
      'The provider reports a different network passphrase.',
      'Select a Horizon provider for the chosen network.',
    );
    return report;
  }
  mark('network', 'complete');
  const amount = parseAmount(p.amount),
    fee = parseAmount(p.feeBudget);
  report.facts.baseReserve = formatAmount(reserve);
  report.facts.baseFee = formatAmount(baseFee);
  report.facts.feeBudget = formatAmount(fee);
  if (fee < baseFee)
    issue(
      'FEE_BUDGET_TOO_LOW',
      'sender',
      'The total fee budget is below the current one-operation base fee.',
      'Increase the planned fee budget and check again; inclusion under surge pricing is not guaranteed.',
    );
  function account(key: 'source' | 'destination'): AccountState | null | undefined {
    const observation = read(key, `${key}_account`, snapshot[key]);
    if (!observation) return;
    if (observation.value === null) {
      mark(`${key}_account`, 'complete');
      issue(
        key === 'source' ? 'SOURCE_ACCOUNT_MISSING' : 'DESTINATION_ACCOUNT_MISSING',
        key === 'source' ? 'sender' : 'recipient',
        `The ${key === 'source' ? 'sender' : 'recipient'} account does not exist on this network.`,
        'Activate the account through your normal onboarding flow, then check again.',
      );
      return null;
    }
    try {
      const result = parseAccount(observation.value, p[key], p.asset);
      const observed = snapshot[key];
      if (
        observed.ok &&
        observed.ledger !== undefined &&
        result.lastModifiedLedger > observed.ledger
      )
        throw new Error('Account modification ledger exceeds the observation ledger.');
      mark(`${key}_account`, 'complete');
      if (key === 'source') report.observation.sourceLastModifiedLedger = result.lastModifiedLedger;
      else report.observation.destinationLastModifiedLedger = result.lastModifiedLedger;
      return result;
    } catch (error) {
      issue(
        'MALFORMED_DATA',
        'provider',
        `${key}: ${String(error)}`,
        'Fetch complete, consistent account fields from Horizon.',
      );
      return;
    }
  }
  const sender = account('source'),
    recipient = account('destination');
  if (sender) {
    const requiredReserve = sender.reserveUnits * reserve;
    const required =
      requiredReserve + sender.native.selling + fee + (p.asset.type === 'native' ? amount : 0n);
    report.facts.sourceReserve = formatAmount(requiredReserve);
    report.facts.sourceXlmBalance = formatAmount(sender.native.balance);
    report.facts.nativeSellingLiabilities = formatAmount(sender.native.selling);
    report.facts.availableXlm = formatAmount(
      positivePart(sender.native.balance - requiredReserve - sender.native.selling - fee),
    );
    report.facts.requiredXlm = formatAmount(required);
    report.facts.xlmShortfall = formatAmount(positivePart(required - sender.native.balance));
    if (required > sender.native.balance)
      issue(
        'INSUFFICIENT_XLM',
        'sender',
        'The sender lacks XLM for the payment, required reserves, selling liabilities and planned fee.',
        'Reduce the XLM payment, add XLM, or review reserve entries and open offers, then check again.',
      );
    mark('source_xlm', 'complete');
  } else if (sender === null) mark('source_xlm', 'not_applicable', 'Sender account is missing.');
  if (p.asset.type === 'native') {
    mark('source_asset', 'not_applicable', 'Native funds are covered by source_xlm.');
    if (recipient) {
      const capacity = MAX_AMOUNT - recipient.native.balance - recipient.native.buying;
      report.facts.receivingCapacity = formatAmount(capacity);
      if (amount > capacity)
        issue(
          'DESTINATION_CAPACITY_EXCEEDED',
          'recipient',
          'This payment exceeds the recipient’s native balance range after buying liabilities.',
          'Reduce the amount or ask the recipient to free receiving capacity.',
        );
      mark('destination_capacity', 'complete');
    }
  } else {
    for (const [state, key, check, party] of [
      [sender, 'SOURCE', 'source_asset', 'sender'],
      [recipient, 'DESTINATION', 'destination_capacity', 'recipient'],
    ] as const) {
      if (state === undefined) continue;
      if (state === null) {
        mark(check, 'not_applicable', `${party} account is missing.`);
        continue;
      }
      mark(check, 'complete');
      if (!state.asset) {
        issue(
          `${key}_TRUSTLINE_MISSING`,
          party,
          `The ${party} has no trustline for this exact asset code and issuer.`,
          `The ${party} needs to create a trustline for ${p.asset.code} issued by ${p.asset.issuer}.`,
        );
        continue;
      }
      if (!state.asset.authorized)
        issue(
          `${key}_NOT_AUTHORIZED`,
          'issuer',
          `The ${party} trustline is not authorized for payments. Authorization to maintain liabilities is insufficient.`,
          'Ask the asset issuer to authorize this trustline for transfers.',
        );
      if (key === 'SOURCE') {
        const available = positivePart(state.asset.balance - state.asset.selling);
        report.facts.availableAsset = formatAmount(available);
        report.facts.assetShortfall = formatAmount(positivePart(amount - available));
        if (amount > available)
          issue(
            'INSUFFICIENT_ASSET',
            party,
            'The amount exceeds asset funds available after selling liabilities.',
            'Reduce the amount, add this exact asset, or review open sell offers.',
          );
      } else {
        const capacity = state.asset.limit - state.asset.balance - state.asset.buying;
        report.facts.receivingCapacity = formatAmount(capacity);
        report.facts.capacityShortfall = formatAmount(positivePart(amount - capacity));
        if (amount > capacity)
          issue(
            'DESTINATION_CAPACITY_EXCEEDED',
            party,
            'The recipient has insufficient trustline capacity after balance and buying liabilities.',
            'Ask the recipient to increase their trustline limit, reduce holdings or review buy offers.',
          );
      }
    }
  }
  if (recipient === null)
    mark('destination_capacity', 'not_applicable', 'Recipient account is missing.');
  const memo = read('memo', 'memo', snapshot.memo);
  if (memo) {
    if (
      !memo.value ||
      !['required', 'present', 'not_required'].includes(memo.value.result) ||
      (memo.value.result === 'present') !== (p.memo !== undefined)
    ) {
      issue(
        'MALFORMED_DATA',
        'provider',
        'Memo observation is missing or inconsistent with the payment.',
        'Repeat the SDK memo check for this exact payment.',
      );
    } else {
      mark('memo', 'complete');
      report.facts.memo = memo.value.result === 'present' ? 'presence_only' : memo.value.result;
      if (memo.value.result === 'required')
        issue(
          'MEMO_REQUIRED',
          'sender',
          'The destination declares that a memo is required.',
          'Obtain the correct memo from the receiving service and include it.',
        );
    }
  }
  report.status = report.coverage.some((c) => c.status === 'unresolved')
    ? 'incomplete'
    : report.issues.length > 0
      ? 'issues_found'
      : 'no_known_issues';
  return report;
}
