import { readdir, readFile, writeFile, copyFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const OUT_DIR = resolve(__dirname, '..', 'public');

const SONG_DIRS = [
  join(ROOT, 'sitsi_songs'),
  join(ROOT, 'sitsi_songs_lauluwiki'),
];

async function findTxtFiles(dir) {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== '.git') {
      results.push(...await findTxtFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.txt')) {
      results.push(fullPath);
    }
  }
  return results;
}

function parseSongFile(content) {
  const lyricsStart = content.indexOf('---LYRICS---');
  if (lyricsStart === -1) return null;

  const header = content.slice(0, lyricsStart);
  const afterLyrics = content.slice(lyricsStart + '---LYRICS---'.length);
  const endMarker = afterLyrics.indexOf('---END---');
  const lyrics = (endMarker !== -1 ? afterLyrics.slice(0, endMarker) : afterLyrics).trim();

  if (!lyrics) return null;

  const getField = (name) => {
    const match = header.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'));
    return match ? match[1].trim() : '';
  };

  return {
    title: getField('Title'),
    melody: getField('Melody'),
    lyrics,
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const seen = new Set();
  const songs = [];
  let id = 0;

  for (const dir of SONG_DIRS) {
    const files = await findTxtFiles(dir);
    for (const file of files) {
      try {
        const content = await readFile(file, 'utf-8');
        const song = parseSongFile(content);
        if (!song || !song.title) continue;

        const key = song.title.toLowerCase().trim();
        if (seen.has(key)) continue;
        seen.add(key);

        songs.push({ id: id++, ...song });
      } catch {
        // skip unreadable files
      }
    }
  }

  songs.sort((a, b) => a.title.localeCompare(b.title, 'fi'));

  await writeFile(join(OUT_DIR, 'songs-index.json'), JSON.stringify(songs));
  console.log(`Built index: ${songs.length} songs`);

  try {
    await copyFile(join(ROOT, 'konteksti.txt'), join(OUT_DIR, 'konteksti.txt'));
    console.log('Copied konteksti.txt');
  } catch {
    console.warn('Warning: konteksti.txt not found');
  }
}

main();
