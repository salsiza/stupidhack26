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
  return PROMPT_TEMPLATE
    .replace('{konteksti}', kontekstiText)
    .replace('{lyrics}', lyrics)
    .replace('{instructions}', instructions);
}

export function openDialog(overlayEl, promptText) {
  const textarea = overlayEl.querySelector('.modal textarea');
  textarea.value = promptText;
  overlayEl.classList.add('open');
}

export function closeDialog(overlayEl) {
  overlayEl.classList.remove('open');
}

export async function copyAndRedirect(promptText) {
  try {
    await navigator.clipboard.writeText(promptText);
  } catch {
    // fallback: prompt is already visible in the modal textarea for manual copy
  }
  window.open(CONFIG.chatgptUrl, '_blank');
}
