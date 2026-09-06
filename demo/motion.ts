import { element } from './ui.js';

export function setupHeroMotion() {
  const hero = document.querySelector<HTMLElement>('.hero')!;
  const stage = document.querySelector<HTMLElement>('.hero-stage')!;
  const toggle = element<HTMLButtonElement>('motion-toggle');
  let paused = false;
  toggle.addEventListener('click', () => {
    paused = !paused;
    hero.dataset.motionPaused = String(paused);
    toggle.setAttribute('aria-pressed', String(paused));
    const label = paused ? 'Resume hero motion' : 'Pause hero motion';
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    stage.style.removeProperty('--art-x');
    stage.style.removeProperty('--art-y');
  });
  new IntersectionObserver((entries) => {
    for (const entry of entries) hero.dataset.motionOffscreen = String(!entry.isIntersecting);
  }).observe(hero);
  return () => paused;
}

export function setupNavigation() {
  const links = [
    ...document.querySelectorAll<HTMLAnchorElement>('.desktop-nav a, .mobile-nav a'),
  ].filter((link) => link.pathname === location.pathname && link.hash.length > 1);
  function select(id: string) {
    for (const link of links) {
      if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }
  const sections = [
    ...document.querySelectorAll<HTMLElement>('.hero, #why, #checks, #developers'),
  ];
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) select(entry.target.id);
      }
    },
    { rootMargin: '-10% 0px -65% 0px' },
  );
  sections.forEach((section) => observer.observe(section));
  links.forEach((link) => link.addEventListener('click', () => select(link.hash.slice(1))));
}
