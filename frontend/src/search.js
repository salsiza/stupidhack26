let debounceTimer = null;

export function filterSongs(songs, query) {
  if (!query) return songs;
  const q = query.toLowerCase();
  return songs.filter(
    (s) => s.title.toLowerCase().includes(q) || s.melody.toLowerCase().includes(q)
  );
}

export function onSearchInput(inputEl, songs, callback) {
  inputEl.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      callback(filterSongs(songs, inputEl.value));
    }, 150);
  });
}
