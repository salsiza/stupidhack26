import { CONFIG } from './config.js';

let selectedSong = null;

export function getSelectedLyrics(customTextarea) {
  if (customTextarea.value.trim()) return customTextarea.value.trim();
  return selectedSong ? selectedSong.lyrics : '';
}

export function selectSong(song, previewEl, songItems, customTextarea) {
  selectedSong = song;
  customTextarea.value = '';

  previewEl.innerHTML = song
    ? `<div class="preview-lyrics">${escapeHtml(song.lyrics)}</div>`
    : `<div class="preview-empty">${CONFIG.previewEmpty}</div>`;

  songItems.forEach((el) => {
    el.classList.toggle('active', Number(el.dataset.id) === song?.id);
  });
}

export function clearSelection(previewEl) {
  selectedSong = null;
  previewEl.innerHTML = `<div class="preview-empty">${CONFIG.previewEmpty}</div>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
