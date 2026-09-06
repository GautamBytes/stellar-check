import '@fontsource-variable/manrope';
import '@fontsource/ibm-plex-mono/latin-400.css';
import { Networks } from '@stellar/stellar-sdk';
import { assessPayment, checkPayment, HorizonProvider } from '../src/index.js';
import type { PaymentIntent, PaymentMemo, Report } from '../src/index.js';
import { fixtureIssuer, scenario } from '../examples/scenarios.js';
import type { Scenario } from '../examples/scenarios.js';
import { createReportView } from './report.js';
import { setupMobileNavigation } from './navigation.js';
import { setupXdrImport } from './xdr-import.js';
import { element } from './ui.js';
const field = (id: string) => element<HTMLInputElement | HTMLSelectElement>(id);
const form = element<HTMLFormElement>('payment-form');
const view = createReportView();
let revision = 0,
  running = false;
function syncFields() {
  const live = field('mode').value === 'live';
  element('scenario-field').hidden = live;
  element('horizon-field').hidden = !live;
  element('credit-fields').hidden = field('asset').value !== 'credit';
  field('memo').disabled = field('memo-type').value === 'none';
  element('report-mode').textContent = live ? 'LIVE HORIZON' : 'SAMPLE DATA';
  element('mode-hint').textContent = live
    ? 'Fresh public reads from your selected Horizon provider.'
    : 'Controlled sample accounts. No network requests.';
  element('amount-unit').textContent =
    field('asset').value === 'native' ? 'XLM' : field('code').value || 'ASSET';
  document
    .querySelectorAll<HTMLButtonElement>('[data-mode]')
    .forEach((button) =>
      button.setAttribute('aria-pressed', String(button.dataset.mode === field('mode').value)),
    );
  document
    .querySelectorAll<HTMLButtonElement>('[data-scenario]')
    .forEach((button) =>
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.scenario === field('scenario').value),
      ),
    );
}
function loadScenario() {
  element('imported-notice').hidden = true;
  const { payment, snapshot } = scenario(field('scenario').value as Scenario);
  field('source').value = payment.source;
  field('destination').value = payment.destination;
  field('asset').value = payment.asset.type;
  field('issuer').value = fixtureIssuer;
  field('code').value = 'USD';
  field('amount').value = payment.amount;
  field('fee').value = payment.feeBudget;
  field('network').value = 'testnet';
  field('horizon').value = 'https://horizon-testnet.stellar.org';
  field('memo-type').value = 'none';
  field('memo').value = '';
  syncFields();
  revision++;
  view.show(assessPayment(payment, snapshot), 'fixture', payment);
}
function stale() {
  revision++;
  view.clear();
}
form.addEventListener('input', () => {
  syncFields();
  stale();
});
form.addEventListener(
  'invalid',
  () => {
    element<HTMLDetailsElement>('advanced-settings').open = true;
  },
  true,
);
document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) =>
  button.addEventListener('click', () => {
    field('mode').value = button.dataset.mode!;
    syncFields();
    if (field('mode').value === 'fixture') loadScenario();
    else stale();
  }),
);
document.querySelectorAll<HTMLButtonElement>('[data-scenario]').forEach((button) =>
  button.addEventListener('click', () => {
    field('scenario').value = button.dataset.scenario!;
    loadScenario();
  }),
);
field('network').addEventListener('change', () => {
  field('horizon').value =
    field('network').value === 'testnet'
      ? 'https://horizon-testnet.stellar.org'
      : 'https://horizon.stellar.org';
  stale();
});
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (running) return;
  const memoType = field('memo-type').value;
  const payment: PaymentIntent = {
    networkPassphrase: field('network').value === 'testnet' ? Networks.TESTNET : Networks.PUBLIC,
    source: field('source').value.trim(),
    destination: field('destination').value.trim(),
    asset:
      field('asset').value === 'native'
        ? { type: 'native' }
        : { type: 'credit', code: field('code').value, issuer: field('issuer').value.trim() },
    amount: field('amount').value,
    feeBudget: field('fee').value,
    ...(memoType === 'none'
      ? {}
      : { memo: { type: memoType as PaymentMemo['type'], value: field('memo').value } }),
  };
  const runRevision = revision,
    mode = field('mode').value;
  running = true;
  field('check').disabled = true;
  element('check-label').textContent = 'Checking payment…';
  form.setAttribute('aria-busy', 'true');
  view.clear(
    'Taking a closer look…',
    mode === 'live'
      ? 'Reading the network and public account state from Horizon.'
      : 'Assessing the controlled sample state.',
    true,
  );
  try {
    let report: Report;
    if (mode === 'fixture') {
      const { snapshot } = scenario(field('scenario').value as Scenario);
      if (payment.memo && snapshot.memo.ok) snapshot.memo.value = { result: 'present' };
      report = assessPayment(payment, snapshot);
    } else report = await checkPayment(payment, new HorizonProvider(field('horizon').value));
    if (runRevision === revision) view.show(report, mode, payment);
  } catch (error) {
    if (runRevision === revision)
      view.clear(
        'Check could not start',
        error instanceof Error ? error.message : 'Review the provider configuration.',
      );
  } finally {
    running = false;
    field('check').disabled = false;
    element('check-label').textContent = 'Check payment';
    form.removeAttribute('aria-busy');
  }
});
setupMobileNavigation();
const requestedScenario = new URLSearchParams(location.search).get('scenario');
if (requestedScenario && ['xlm', 'credit', 'trustline', 'funds'].includes(requestedScenario)) {
  field('scenario').value = requestedScenario;
}
loadScenario();

setupXdrImport((payment) => {
  field('mode').value = 'live';
  field('source').value = payment.source;
  field('destination').value = payment.destination;
  field('asset').value = payment.asset.type;
  field('code').value = payment.asset.type === 'credit' ? payment.asset.code : '';
  field('issuer').value = payment.asset.type === 'credit' ? payment.asset.issuer : '';
  field('amount').value = payment.amount;
  field('fee').value = payment.feeBudget;
  field('network').value = payment.networkPassphrase === Networks.TESTNET ? 'testnet' : 'public';
  field('horizon').value = payment.networkPassphrase === Networks.TESTNET ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org';
  field('memo-type').value = payment.memo?.type ?? 'none';
  field('memo').value = payment.memo?.value ?? '';
  element<HTMLDetailsElement>('advanced-settings').open = Boolean(payment.memo);
  element('imported-notice').hidden = false;
  syncFields();
  stale();
});
