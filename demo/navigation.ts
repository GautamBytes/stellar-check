import { element } from './ui.js';

export function setupMobileNavigation() {
  const toggle = element<HTMLButtonElement>('menu-toggle');
  const navigation = element('mobile-nav');
  function close() {
    navigation.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
  }
  toggle.addEventListener('click', () => {
    navigation.hidden = !navigation.hidden;
    toggle.setAttribute('aria-expanded', String(!navigation.hidden));
    toggle.setAttribute('aria-label', navigation.hidden ? 'Open navigation' : 'Close navigation');
  });
  navigation.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !navigation.hidden) {
      close();
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', (event) => {
    if (event.matches) close();
  });
}
