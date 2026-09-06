import { setupMobileNavigation } from './navigation.js';
import { setupHeroMotion, setupNavigation } from './motion.js';
import { assessPayment } from '../src/index.js';
import { scenario } from '../examples/scenarios.js';
import type { Scenario } from '../examples/scenarios.js';
import { copyText, displayAmount, element, node } from './ui.js';
export function setupLanding() {
  const isMotionPaused = setupHeroMotion();
  setupNavigation();
  const stage = document.querySelector<HTMLElement>('.hero-stage');
  const motion = window.matchMedia('(prefers-reduced-motion: no-preference) and (pointer: fine)');
  if (stage) {
    stage.addEventListener('pointermove', (event) => {
      if (!motion.matches || isMotionPaused()) return;
      const bounds = stage.getBoundingClientRect();
      stage.style.setProperty(
        '--art-x',
        `${((event.clientX - bounds.left) / bounds.width - 0.5) * 12}px`,
      );
      stage.style.setProperty(
        '--art-y',
        `${((event.clientY - bounds.top) / bounds.height - 0.5) * 8}px`,
      );
    });
    const reset = () => {
      stage.style.removeProperty('--art-x');
      stage.style.removeProperty('--art-y');
    };
    stage.addEventListener('pointerleave', reset);
    motion.addEventListener('change', reset);
  }

  document.querySelectorAll<HTMLButtonElement>('[data-hero]').forEach((button) =>
    button.addEventListener('click', () => {
      const selected = button.dataset.hero as Scenario;
      const { payment, snapshot } = scenario(selected);
      const report = assessPayment(payment, snapshot);
      document
        .querySelectorAll('[data-hero]')
        .forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
      const issue = report.issues[0];
      const status = element('hero-status');
      status.classList.toggle('attention', Boolean(issue));
      const text = node('div', '');
      text.append(
        node('strong', issue ? 'Recipient needs a trustline' : 'No known issues'),
        node(
          'span',
          issue ? 'An easy-to-miss detail, caught early.' : 'Clear in the observed account data.',
        ),
      );
      status.replaceChildren(node('span', issue ? '!' : '✓', 'round-check'), text);
      const currency = payment.asset.type === 'native' ? 'XLM' : payment.asset.code;
      element('hero-amount').replaceChildren(
        document.createTextNode('1.00 '),
        node('small', currency),
      );
      element('hero-funds').replaceChildren(
        document.createTextNode(`${displayAmount(report.facts.availableXlm!)} XLM `),
        node('i', '✓'),
      );
      element('hero-check-label').textContent = issue ? 'Recipient trustline' : 'Memo requirement';
      element('hero-check-result').replaceChildren(
        document.createTextNode(issue ? 'Missing ' : 'Not declared '),
        node('i', issue ? '!' : '✓'),
      );
    }),
  );
  element('copy-code').addEventListener('click', () => {
    const code = element('integration-code').textContent ?? '';
    void copyText(code, element('copy-code').querySelector('span')!);
  });
  setupMobileNavigation();
}
