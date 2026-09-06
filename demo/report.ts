import { appendIssueActions } from './issue-actions.js';
import type { PaymentIntent, Report } from '../src/index.js';
import { copyText, displayAmount, element, icon, node } from './ui.js';
const names = {
  input: 'Payment format',
  network: 'Network match',
  source_account: 'Sender account',
  destination_account: 'Recipient account',
  source_xlm: 'XLM availability',
  source_asset: 'Issued asset availability',
  destination_capacity: 'Receiving capacity',
  memo: 'Memo requirement',
};
export function createReportView() {
  const area = element('report'),
    json = element('report-json');
  const copyButton = element<HTMLButtonElement>('copy-report');
  let current: Report | null = null;
  const tabs = [element<HTMLButtonElement>('summary-tab'), element<HTMLButtonElement>('json-tab')];
  function select(index: number) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    area.hidden = index !== 0;
    element('json-panel').hidden = index !== 1;
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', (event) => {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index;
        select(next);
        tabs[next]!.focus();
      }
    });
  });
  copyButton.addEventListener('click', async () => {
    if (!current) return;
    await copyText(JSON.stringify(current, null, 2), element('copy-report-label'));
    element('copy-feedback').textContent = element('copy-report-label').textContent;
  });
  function clear(
    title = 'Ready for a fresh look.',
    message = 'Your payment changed. Run the check again to see an up-to-date report.',
    loading = false,
  ) {
    current = null;
    copyButton.disabled = true;
    json.textContent = message;
    const graphic = node('div', '', 'empty-icon');
    graphic.append(loading ? node('span', '', 'loading-ring') : icon('shield'));
    area.replaceChildren(
      graphic,
      node('h3', title, 'empty-title'),
      node('p', message, 'empty-copy'),
    );
    select(0);
  }
  function show(report: Report, mode: string, payment: PaymentIntent) {
    current = report;
    copyButton.disabled = false;
    area.replaceChildren();
    json.textContent = JSON.stringify(report, null, 2);
    const titles = {
      no_known_issues: 'No known issues',
      issues_found: 'A little attention needed',
      incomplete: 'Check incomplete',
    };
    const status = node('div', '', `status ${report.status}`);
    status.append(
      node('span', report.status === 'no_known_issues' ? '✓' : '!', 'status-symbol'),
      node('h3', titles[report.status]),
    );
    area.append(status);
    area.append(
      node(
        'p',
        report.status === 'no_known_issues'
          ? 'No supported issue found in the observed account data.'
          : report.status === 'incomplete'
            ? 'Some checks could not finish. Review the details and try again.'
            : 'Here’s what needs to change, and who can help.',
        'report-summary',
      ),
    );
    for (const issue of report.issues) {
      const card = node('div', '', 'issue');
      card.append(
        node('span', issue.party.toUpperCase(), 'eyebrow'),
        node('p', issue.message),
        node('p', issue.action, 'action'),
        node('code', issue.code),
      );
      appendIssueActions(card, issue, payment, report, mode);
      area.append(card);
    }
    if (report.facts.availableXlm !== undefined) {
      const facts = node('div', '', 'funds'),
        top = node('div', '', 'funds-top');
      const amount = node('div', displayAmount(report.facts.availableXlm), 'funds-amount');
      amount.append(node('small', ' XLM'));
      top.append(node('h3', 'Available after reserve & fee'), amount);
      facts.append(top);
      const bar = node('div', '', 'balance-bar');
      bar.setAttribute('aria-hidden', 'true');
      // Approximation is visual only. Exact decimal strings remain in all report facts.
      const total = Number(report.facts.sourceXlmBalance);
      if (total > 0)
        for (const value of [
          report.facts.availableXlm,
          report.facts.sourceReserve,
          report.facts.nativeSellingLiabilities,
          report.facts.feeBudget,
        ]) {
          const segment = node('span', '');
          segment.style.width = `${Math.min(100, Math.max(0, (Number(value ?? 0) / total) * 100))}%`;
          bar.append(segment);
        }
      facts.append(bar);
      const metrics = node('dl', '');
      for (const [label, value] of [
        ['Balance', report.facts.sourceXlmBalance],
        ['Required reserve', report.facts.sourceReserve],
        ['Committed to offers', report.facts.nativeSellingLiabilities],
        ['Planned fee', report.facts.feeBudget],
      ]) {
        if (label && value !== undefined)
          metrics.append(node('dt', label), node('dd', `${displayAmount(value)} XLM`));
      }
      facts.append(metrics);
      area.append(facts);
    }
    const extras = node('dl', '', 'extra-facts');
    for (const [key, label] of [
      ['availableAsset', 'Available issued asset'],
      ['receivingCapacity', 'Recipient capacity'],
      ['xlmShortfall', 'XLM shortfall'],
      ['assetShortfall', 'Asset shortfall'],
      ['capacityShortfall', 'Capacity shortfall'],
    ] as const) {
      const value = report.facts[key];
      if (value !== undefined && !(key.endsWith('Shortfall') && value === '0.0000000')) {
        // Native int64 capacity is technically useful in JSON, rarely useful in the overview.
        if (key === 'receivingCapacity' && !report.facts.availableAsset && Number(value) > 1e9)
          continue;
        extras.append(node('dt', label), node('dd', displayAmount(value)));
      }
    }
    area.append(extras);
    const coverage = node('div', '', 'coverage');
    const heading = node('h3', 'Check coverage');
    const assessed = report.coverage.filter((c) => c.status !== 'unresolved').length;
    heading.append(node('span', `${assessed} / ${report.coverage.length} assessed`));
    coverage.append(heading);
    for (const item of report.coverage) {
      const row = node('div', '', 'coverage-row');
      row.append(
        node('span', names[item.check]),
        node(
          'span',
          item.status === 'not_applicable'
            ? 'Not applicable'
            : item.status === 'complete'
              ? 'Checked'
              : 'Unresolved',
          item.status,
        ),
      );
      if (item.reason) row.title = item.reason;
      coverage.append(row);
    }
    area.append(coverage);
    const latest = report.observation.finishedAt ?? report.observation.reads.at(-1)?.observedAt;
    if (latest)
      area.append(
        node(
          'p',
          `${mode === 'fixture' ? 'SAMPLE OBSERVATION' : 'LIVE OBSERVATION'} · ${new Date(latest).toLocaleString()}`,
          'report-observed',
        ),
      );
  }
  return { clear, show };
}
