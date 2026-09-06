// Runs before styles load so the saved theme is applied before first paint.
(() => {
  const key = 'stellar-check-theme';
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = null;
  try {
    const saved = window.localStorage.getItem(key);
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch {
    // Theme selection still works when browser storage is unavailable.
  }
  function apply(theme) {
    root.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0c1220' : '#fcfbfe');
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  }
  const sync = () => apply(preference ?? (system.matches ? 'dark' : 'light'));
  sync();
  system.addEventListener('change', () => {
    if (preference === null) sync();
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== key && event.key !== null) return;
    preference = event.newValue === 'dark' || event.newValue === 'light' ? event.newValue : null;
    sync();
  });
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      sync();
      document.getElementById('theme-toggle')?.addEventListener('click', () => {
        preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
        apply(preference);
        try {
          window.localStorage.setItem(key, preference);
        } catch {
          /* Session-only fallback. */
        }
      });
    },
    { once: true },
  );
})();
