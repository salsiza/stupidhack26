import { CONFIG } from './config.js';
import { filterSongs, onSearchInput } from './search.js';
import { selectSong, getSelectedLyrics, clearSelection } from './preview.js';
import { loadKonteksti, buildPrompt, openDialog, closeDialog, copyAndRedirect, getCurrentPrompt } from './dialog.js';

let allSongs = [];

async function init() {
  try {
    const res = await fetch('/songs-index.json');
    allSongs = await res.json();
  } catch {
    allSongs = [];
  }

  await loadKonteksti();
  render();
  bind();
}

function render() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="header">
      <h1>${CONFIG.appName}</h1>
    </div>

    <div class="search-box">
      <input type="text" id="search" placeholder="${CONFIG.searchPlaceholder}" />
    </div>

    <div class="panels">
      <div class="song-list">
        <div class="song-list-title">${CONFIG.songListTitle}</div>
        <div id="song-items"></div>
      </div>
      <div class="preview">
        <div class="preview-title">${CONFIG.previewTitle}</div>
        <div id="preview-content">
          <div class="preview-empty">${CONFIG.previewEmpty}</div>
        </div>
      </div>
    </div>

    <div class="custom-lyrics">
      <button class="custom-lyrics-toggle" id="custom-lyrics-toggle">${CONFIG.customLyricsLabel}</button>
      <div class="custom-lyrics-content" id="custom-lyrics-content" style="display:none;">
        <textarea id="custom-lyrics" placeholder="Liitä tai kirjoita sanat..."></textarea>
      </div>
    </div>

    <div class="alteration">
      <label>${CONFIG.alterationLabel}</label>
      <textarea id="alteration" placeholder='${CONFIG.alterationPlaceholder}'></textarea>
    </div>

    <div class="generate-wrap">
      <button class="generate-btn" id="generate-btn">${CONFIG.generateButtonText}</button>
    </div>

    <div class="modal-overlay" id="modal">
      <div class="modal">
        <button class="modal-close" id="modal-close">✕</button>
        <h2>${CONFIG.dialogHeadline}</h2>
        <button class="modal-action" id="modal-action">${CONFIG.copyButtonText}</button>
      </div>
    </div>
  `;

  renderSongList(allSongs);
}

function renderSongList(songs) {
  const container = document.getElementById('song-items');
  container.innerHTML = songs
    .map(
      (s) =>
        `<div class="song-item" data-id="${s.id}">
          ${escapeHtml(s.title)}${s.melody ? `<div class="melody">${escapeHtml(s.melody)}</div>` : ''}
        </div>`
    )
    .join('');
}

function bind() {
  const searchInput = document.getElementById('search');
  const previewContent = document.getElementById('preview-content');
  const customLyrics = document.getElementById('custom-lyrics');
  const customLyricsToggle = document.getElementById('custom-lyrics-toggle');
  const customLyricsContent = document.getElementById('custom-lyrics-content');
  const alteration = document.getElementById('alteration');
  const generateBtn = document.getElementById('generate-btn');
  const modal = document.getElementById('modal');
  const modalClose = document.getElementById('modal-close');
  const modalAction = document.getElementById('modal-action');

  // Custom lyrics toggle
  customLyricsToggle.addEventListener('click', () => {
    const open = customLyricsContent.style.display !== 'none';
    customLyricsContent.style.display = open ? 'none' : 'block';
    customLyricsToggle.classList.toggle('open', !open);
    if (!open) customLyrics.focus();
  });

  // Search
  onSearchInput(searchInput, allSongs, (filtered) => {
    renderSongList(filtered);
  });

  // Song selection (event delegation)
  document.getElementById('song-items').addEventListener('click', (e) => {
    const item = e.target.closest('.song-item');
    if (!item) return;
    const song = allSongs.find((s) => s.id === Number(item.dataset.id));
    if (song) {
      selectSong(song, previewContent, document.querySelectorAll('.song-item'), customLyrics);
    }
  });

  // Custom lyrics clears song selection
  customLyrics.addEventListener('input', () => {
    if (customLyrics.value.trim()) {
      clearSelection(previewContent);
      document.querySelectorAll('.song-item').forEach((el) => el.classList.remove('active'));
    }
  });

  // Generate
  generateBtn.addEventListener('click', () => {
    const lyrics = getSelectedLyrics(customLyrics);
    const instructions = alteration.value.trim();
    if (!lyrics && !instructions) return;

    const prompt = buildPrompt(lyrics, instructions);
    openDialog(modal, prompt);
  });

  // Modal
  modalClose.addEventListener('click', () => closeDialog(modal));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeDialog(modal);
  });

  modalAction.addEventListener('click', () => {
    copyAndRedirect(getCurrentPrompt());
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

init();
