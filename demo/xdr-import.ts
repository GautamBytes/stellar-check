import { Account, Asset, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { importPaymentXdr } from '../src/xdr.js';
import type { XdrImportResult } from '../src/xdr.js';
import type { PaymentIntent } from '../src/types.js';
import { fixtureSource, fixtureDestination } from '../examples/scenarios.js';
import { element, node } from './ui.js';

export function setupXdrImport(apply: (payment: PaymentIntent) => void) {
  const openFromLink = () => {
    if (location.hash === '#xdr-import') element<HTMLDetailsElement>('xdr-import').open = true;
  };
  openFromLink();
  window.addEventListener('hashchange', openFromLink);
  const form = element<HTMLFormElement>('xdr-form');
  const input = element<HTMLTextAreaElement>('xdr-input');
  const network = element<HTMLSelectElement>('xdr-network');
  const preview = element('xdr-preview');
  const feedback = element('xdr-feedback');
  let decoded: Extract<XdrImportResult, {ok:true}> | undefined;
  function clear() {
    decoded = undefined;
    preview.hidden = true;
    preview.replaceChildren();
    feedback.textContent = '';
    input.removeAttribute('aria-invalid');
  }
  form.addEventListener('input',clear);
  form.addEventListener('submit',event=>{
    event.preventDefault();
    clear();
    const result = importPaymentXdr(input.value, network.value === 'testnet' ? Networks.TESTNET : Networks.PUBLIC);
    if(!result.ok) {
      feedback.textContent=result.message;
      input.setAttribute('aria-invalid','true');
      input.focus();
      return;
    }
    decoded=result;
    preview.hidden=false;
    const {payment,context}=result;
    preview.append(node('p','DECODED LOCALLY · ONE UNSIGNED PAYMENT','eyebrow'),node('h3','Review before loading'));
    const rows=node('dl','','xdr-facts');
    for(const [label,value] of [
      ['Selected network',network.value === 'testnet' ? 'Stellar Testnet' : 'Stellar Public Network'],
      ['Sender',payment.source],['Recipient',payment.destination],
      ['Amount',`${payment.amount} ${payment.asset.type === 'native' ? 'XLM' : payment.asset.code}`],
      ...(payment.asset.type === 'credit' ? [['Issuer',payment.asset.issuer]] : []),
      ['Total fee',`${payment.feeBudget} XLM`],
      ['Memo',payment.memo ? `${payment.memo.type}: ${payment.memo.value === '' ? '(empty)' : payment.memo.value}` : 'None'],
      ['Sequence (not assessed)',context.sequence],
      ['Time bounds (not assessed)', context.timeBounds ? `Unix seconds ${context.timeBounds.minTime} to ${context.timeBounds.maxTime === '0' ? 'no upper bound' : context.timeBounds.maxTime}` : 'None'],
    ]) rows.append(node('dt',label!),node('dd',value!));
    preview.append(rows);
    const notes=node('ul','','xdr-limitations');
    context.limitations.forEach(text=>notes.append(node('li',text)));
    preview.append(notes);
    const load=node('button','Load payment into checker','button button-primary');
    load.type='button';
    load.addEventListener('click',()=>{
      if(!decoded) return;
      apply(decoded.payment);
      element<HTMLDetailsElement>('xdr-import').open=false;
      element('payment-heading').focus();
    });
    preview.append(load,node('p','Loading selects Live Horizon. Public data is fetched only when you click Check payment.','xdr-note'));
    feedback.textContent='Decoded successfully. Review the payment below; no account data has been fetched.';
  });
  element('xdr-example').addEventListener('click',()=>{
    clear();
    input.value = new TransactionBuilder(new Account(fixtureSource,'1'),{fee:'100',networkPassphrase:Networks.TESTNET})
      .addOperation(Operation.payment({destination:fixtureDestination,asset:Asset.native(),amount:'1'})).setTimeout(0).build().toXdr();
    network.value='testnet';
    feedback.textContent='Example XDR loaded with controlled sample addresses. Decode it to explore the preview; these are not maintained live accounts.';
    input.focus();
  });
}
