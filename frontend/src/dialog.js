import { CONFIG, PROMPT_TEMPLATE } from './config.js';

let kontekstiText = '';

export async function loadKonteksti() {
  try {
    const res = await fetch('/konteksti.txt');
    kontekstiText = await res.text();
  } catch {
    kontekstiText = '';
  }
}

export function buildPrompt(lyrics, instructions) {
  return PROMPT_TEMPLATE(lyrics, instructions)
    .replace('{konteksti}', kontekstiText);
}

let currentPrompt = '';

export function openDialog(overlayEl, promptText) {
  currentPrompt = promptText;
  overlayEl.classList.add('open');
}

export function getCurrentPrompt() {
  return currentPrompt;
}

export function closeDialog(overlayEl) {
  overlayEl.classList.remove('open');
}

export async function copyAndRedirect(promptText) {
  const t = CONFIG();
  try {
    await navigator.clipboard.writeText(promptText);
  } catch {
    // fallback: prompt is already visible in the modal textarea for manual copy
  }
  window.open(t.chatgptUrl, '_blank');
}
