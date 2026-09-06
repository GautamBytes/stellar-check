import '@fontsource-variable/manrope';
import '@fontsource/ibm-plex-mono/latin-400.css';
import { setupMobileNavigation } from './navigation.js';
import { copyText } from './ui.js';

setupMobileNavigation();
const contents = document.querySelector<HTMLDetailsElement>('#docs-contents')!;
const narrow = matchMedia('(max-width: 900px)');
const syncContents = () => {
  contents.open = !narrow.matches;
};
syncContents();
narrow.addEventListener('change', syncContents);
const links = [...document.querySelectorAll<HTMLAnchorElement>('.toc a')];
links.forEach((link) =>
  link.addEventListener('click', () => {
    if (narrow.matches) contents.open = false;
  }),
);
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const link of links) {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
  },
  { rootMargin: '-15% 0px -65% 0px' },
);
document.querySelectorAll('[data-doc-section]').forEach((section) => observer.observe(section));
const words = document.querySelector('.docs-article')!.textContent!.trim().split(/\s+/).length;
document.getElementById('reading-time')!.textContent =
  `${Math.max(1, Math.ceil(words / 220))} min read`;
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => {
  button.addEventListener('click', () => {
    const code = document.getElementById(button.dataset.copy!)!;
    void copyText(code.textContent ?? '', button.querySelector('span')!);
  });
});
