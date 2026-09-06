export const element = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
export function node<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text: string,
  className?: string,
) {
  const result = document.createElement(tag);
  result.textContent = text;
  if (className) result.className = className;
  return result;
}
export function icon(name: string) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}
export const displayAmount = (value: string) =>
  value.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
export async function copyText(text: string, label: HTMLElement, success = 'Copied') {
  const original = label.textContent;
  try {
    await navigator.clipboard.writeText(text);
    label.textContent = success;
  } catch {
    label.textContent = 'Copy unavailable';
  }
  window.setTimeout(() => {
    label.textContent = original;
  }, 2200);
}
