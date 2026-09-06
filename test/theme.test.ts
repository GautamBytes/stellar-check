import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync(new URL('../demo/public/theme.js', import.meta.url), 'utf8');
function browser(saved: string | null = null, dark = false, blocked = false) {
  const attributes = new Map<string, string>();
  const listeners = new Map<string, (event?: unknown) => void>();
  const root = { dataset: { theme: '' } };
  const media = {
    matches: dark,
    addEventListener: (_: string, fn: () => void) => listeners.set('system', fn),
  };
  const button = {
    setAttribute: (key: string, value: string) => attributes.set(key, value),
    addEventListener: (_: string, fn: () => void) => listeners.set('click', fn),
  };
  let stored = saved;
  runInNewContext(source, {
    document: {
      documentElement: root,
      querySelector: () => ({
        setAttribute: (_: string, value: string) => attributes.set('meta', value),
      }),
      getElementById: (id: string) => (id === 'theme-toggle' ? button : null),
      addEventListener: (_: string, fn: () => void) => listeners.set('ready', fn),
    },
    window: {
      matchMedia: () => media,
      addEventListener: (_: string, fn: (event: unknown) => void) => listeners.set('storage', fn),
      localStorage: {
        getItem: () => {
          if (blocked) throw new Error('blocked');
          return stored;
        },
        setItem: (_: string, value: string) => {
          if (blocked) throw new Error('blocked');
          stored = value;
        },
      },
    },
  });
  return {
    root,
    attributes,
    media,
    stored: () => stored,
    fire: (name: string, event?: unknown) => listeners.get(name)?.(event),
  };
}
test('theme applies system preference before DOM readiness and follows changes', () => {
  const b = browser(null, true);
  assert.equal(b.root.dataset.theme, 'dark');
  b.media.matches = false;
  b.fire('system');
  assert.equal(b.root.dataset.theme, 'light');
});
test('saved theme overrides the system and restores on the next load', () => {
  const b = browser('light', true);
  b.fire('ready');
  b.fire('click');
  assert.equal(b.stored(), 'dark');
  const next = browser(b.stored(), false);
  assert.equal(next.root.dataset.theme, 'dark');
  next.fire('system');
  assert.equal(next.root.dataset.theme, 'dark');
});
test('icon-only toggle updates accessible state and browser color', () => {
  const b = browser();
  b.fire('ready');
  b.fire('click');
  assert.equal(b.attributes.get('aria-pressed'), 'true');
  assert.equal(b.attributes.get('title'), 'Switch to light mode');
  assert.equal(b.attributes.get('meta'), '#0c1220');
  b.fire('click');
  assert.equal(b.attributes.get('aria-pressed'), 'false');
  assert.equal(b.attributes.get('meta'), '#fcfbfe');
});
test('storage failures do not prevent theme changes', () => {
  const b = browser(null, false, true);
  b.fire('ready');
  b.fire('click');
  assert.equal(b.root.dataset.theme, 'dark');
  b.fire('system');
  assert.equal(b.root.dataset.theme, 'dark');
});
test('invalid stored values follow system preference', () => {
  assert.equal(browser('unknown', true).root.dataset.theme, 'dark');
});
test('cross-tab changes sync, and cleared preferences resume following the system', () => {
  const b = browser('light', true);
  b.fire('storage', { key: 'unrelated', newValue: 'dark' });
  assert.equal(b.root.dataset.theme, 'light');
  b.fire('storage', { key: 'stellar-check-theme', newValue: 'dark' });
  assert.equal(b.root.dataset.theme, 'dark');
  b.fire('storage', { key: null, newValue: null });
  b.media.matches = false;
  b.fire('system');
  assert.equal(b.root.dataset.theme, 'light');
});
