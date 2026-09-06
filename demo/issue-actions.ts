import type { Diagnostic, PaymentIntent, Report } from '../src/types.js';
import { copyText, displayAmount, element, node } from './ui.js';

export function appendIssueActions(card: HTMLElement, issue: Diagnostic, payment: PaymentIntent, report: Report, mode: string) {
  let field: string | undefined;
  let label = '';
  switch(issue.code) {
    case 'INSUFFICIENT_XLM':
      field = payment.asset.type === 'native' ? 'amount' : 'fee';
      label = payment.asset.type === 'native' ? 'Review amount' : 'Review XLM fee';
      if(payment.asset.type === 'native' && report.facts.availableXlm !== undefined)
        card.append(node('p',`Observed available balance: ${displayAmount(report.facts.availableXlm)} XLM. Other checks may still need attention.`,'action-context'));
      break;
    case 'INSUFFICIENT_ASSET': case 'DESTINATION_CAPACITY_EXCEEDED': field='amount';label='Review amount';break;
    case 'FEE_BUDGET_TOO_LOW': field='fee';label='Edit fee budget';break;
    case 'MEMO_REQUIRED': field='memo-type';label='Edit memo';break;
    case 'SOURCE_ACCOUNT_MISSING': field='source';label='Review sender';break;
    case 'DESTINATION_ACCOUNT_MISSING': field='destination';label='Review recipient';break;
    case 'NETWORK_MISMATCH': field='network';label='Review network';break;
    case 'PROVIDER_TIMEOUT': case 'PROVIDER_RATE_LIMITED': case 'PROVIDER_UNAVAILABLE': case 'MALFORMED_DATA':
      if(mode==='live') {field='horizon';label='Review provider';} break;
    case 'INVALID_INPUT': case 'UNSUPPORTED_PAYMENT': field='payment-heading';label='Review payment details';break;
  }
  const actions=node('div','','issue-actions');
  if(field) {
    const target=field;
    const button=node('button',label,'issue-action');
    button.type='button';
    button.addEventListener('click',()=>{
      if(['fee','memo-type'].includes(target)) element<HTMLDetailsElement>('advanced-settings').open=true;
      element(target).focus();
    });
    actions.append(button);
  }
  if(payment.asset.type === 'credit' && ['SOURCE_TRUSTLINE_MISSING','DESTINATION_TRUSTLINE_MISSING','SOURCE_NOT_AUTHORIZED','DESTINATION_NOT_AUTHORIZED','DESTINATION_CAPACITY_EXCEEDED'].includes(issue.code)) {
    const button=node('button','Copy asset details','issue-action');
    button.type='button';
    button.setAttribute('aria-live','polite');
    const details = `Asset: ${payment.asset.code}\nIssuer: ${payment.asset.issuer}\nSender: ${payment.source}\nRecipient: ${payment.destination}\nNetwork: ${payment.networkPassphrase}\nIssue: ${issue.message}\nNext step: ${issue.action}`;
    button.addEventListener('click',()=>void copyText(details,button));
    actions.append(button);
  }
  if(actions.childElementCount) card.append(actions);
}
