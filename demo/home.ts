import '@fontsource-variable/manrope';
import '@fontsource/ibm-plex-mono/latin-400.css';
import { setupLanding } from './landing.js';

// Keep bookmarks made before the checker moved to its own page working.
function redirectLegacyPlayground() {
  if (location.hash !== '#playground') return;
  const target = new URL('/playground.html', location.origin);
  const scenario = new URLSearchParams(location.search).get('scenario');
  if (scenario && ['xlm', 'credit', 'trustline', 'funds'].includes(scenario)) {
    target.searchParams.set('scenario', scenario);
  }
  location.replace(target.href);
}

redirectLegacyPlayground();
window.addEventListener('hashchange', redirectLegacyPlayground);
setupLanding();
