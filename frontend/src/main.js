import { CONFIG, currentLang, setLang } from './config.js';
import { filterSongs, onSearchInput } from './search.js';
import { selectSong, getSelectedLyrics, clearSelection } from './preview.js';
import { loadKonteksti, buildPrompt, buildBridgePrompt, openDialog, closeDialog, copyAndRedirect, getCurrentPrompt } from './dialog.js';

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
  const t = CONFIG();
  
  app.innerHTML = `
    <div class="header">
      <h1>${t.appName}</h1>
      <div class="lang-switch">
        <button id="lang-fi" class="${currentLang === 'fi' ? 'active' : ''}">FI</button>
        <button id="lang-en" class="${currentLang === 'en' ? 'active' : ''}">EN</button>
      </div>
    </div>

    <div class="step">
      <span class="step-number">1.</span>
      <div class="step-content">
        <div class="search-box">
          <input type="text" id="search" placeholder="${t.searchPlaceholder}" />
        </div>

        <div class="panels">
          <div class="song-list">
            <div class="song-list-title">${t.songListTitle}</div>
            <div id="song-items"></div>
          </div>
          <div class="preview">
            <div class="preview-title">${t.previewTitle}</div>
            <div id="preview-content">
              <div class="preview-empty">${t.previewEmpty}</div>
            </div>
          </div>
        </div>

        <div class="custom-lyrics">
          <button class="custom-lyrics-toggle" id="custom-lyrics-toggle">${t.customLyricsLabel}</button>
          <div class="custom-lyrics-content" id="custom-lyrics-content" style="display:none;">
            <textarea id="custom-lyrics" placeholder="${t.customLyricsPlaceholder}"></textarea>
          </div>
        </div>
      </div>
    </div>

    <div class="step">
      <span class="step-number">2.</span>
      <div class="step-content">
        <div class="alteration" id="alteration-box">
          <label>${t.alterationLabel}</label>
          <textarea id="alteration" placeholder='${t.alterationPlaceholder}'></textarea>
          <div class="generate-wrap alteration-generate-wrap">
            <button class="generate-btn" id="generate-btn">${t.generateButtonText}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="step-divider" aria-hidden="true">
      <span class="step-divider-line"></span>
      <span class="step-divider-text">${t.bridgeDividerText}</span>
      <span class="step-divider-line"></span>
    </div>

    <div class="step">
      <span class="step-number">3.</span>
      <div class="step-content">
        <div class="bridge-box" id="bridge-box">
          <label for="bridge-song">${t.bridgeTitle}</label>
          <input type="text" id="bridge-song" placeholder="${t.bridgeSongPlaceholder}" />
          <div class="bridge-song-label">${t.bridgeSongLabel}</div>
          <div class="generate-wrap bridge-generate-wrap">
            <button class="generate-btn bridge-btn" id="bridge-btn">${t.bridgeButtonText}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" id="modal">
      <div class="modal">
        <button class="modal-close" id="modal-close">✕</button>
        <h2>${t.dialogHeadline}</h2>
        <button class="modal-action" id="modal-action">${t.copyButtonText}</button>
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
  const bridgeSong = document.getElementById('bridge-song');
  const bridgeBtn = document.getElementById('bridge-btn');
  const modal = document.getElementById('modal');
  const modalClose = document.getElementById('modal-close');
  const modalAction = document.getElementById('modal-action');

  // Lang switch
  document.getElementById('lang-fi').addEventListener('click', () => {
    setLang('fi');
    render();
    bind();
  });
  document.getElementById('lang-en').addEventListener('click', () => {
    setLang('en');
    render();
    bind();
  });

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
  const alterationBox = document.getElementById('alteration-box');
  const songListEl = document.querySelector('.panels');
  const bridgeBox = document.getElementById('bridge-box');

  generateBtn.addEventListener('click', () => {
    const lyrics = getSelectedLyrics(customLyrics);
    const instructions = alteration.value.trim();
    let valid = true;

    if (!lyrics) {
      flash(songListEl);
      valid = false;
    }
    if (!instructions) {
      flash(alterationBox);
      valid = false;
    }
    if (!valid) return;

    const prompt = buildPrompt(lyrics, instructions);
    openDialog(modal, prompt);
  });

  bridgeBtn.addEventListener('click', () => {
    const songName = bridgeSong.value.trim();
    if (!songName) {
      flash(bridgeBox);
      bridgeSong.focus();
      return;
    }

    const prompt = buildBridgePrompt(songName);
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

function flash(el) {
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
  el.addEventListener('animationend', () => el.classList.remove('flash'), { once: true });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

init();
