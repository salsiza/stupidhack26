export const TRANSLATIONS = {
  fi: {
    appName: 'Sitsi laulun muokkaus ohjelma',
    chatgptUrl: 'https://chat.openai.com',
    dialogHeadline: "Me ei makseta API laskuja tuosta paskasta",
    copyButtonText: 'Kopioi prompti & avaa ChatGPT',
    searchPlaceholder: '🔍 Etsi sitsilaulu...',
    songListTitle: 'SITSILAULUT',
    previewTitle: 'Alkuperäiset sanat',
    customLyricsLabel: 'Etkö löydä sitsilauluasi? Kirjoita se tähän',
    alterationLabel: '✏️ MUOKKAUSOHJEET:',
    alterationPlaceholder: 'esim. "tee tästä laulu kebabista"',
    generateButtonText: 'Tee see',
    previewEmpty: 'Valitse sitsilaulu listasta',
    customLyricsPlaceholder: 'Liitä tai kirjoita sanat...',
    promptEditHeader: 'Muokkaa tätä sitsilaulua:',
    promptInstructionsHeader: 'Muokkausohjeet:',
  },
  en: {
    appName: 'Sitsi Song Editor',
    chatgptUrl: 'https://chat.openai.com',
    dialogHeadline: "We aren't paying API bills for that crap",
    copyButtonText: 'Copy Prompt & Open ChatGPT',
    searchPlaceholder: '🔍 Search for a sitsi song...',
    songListTitle: 'SITSI SONGS',
    previewTitle: 'Original Lyrics',
    customLyricsLabel: "Can't find your song? Write it here",
    alterationLabel: '✏️ EDITING INSTRUCTIONS:',
    alterationPlaceholder: 'e.g. "make this a song about kebab"',
    generateButtonText: 'Do it',
    previewEmpty: 'Select a sitsi song from the list',
    customLyricsPlaceholder: 'Paste or write lyrics...',
    promptEditHeader: 'Edit this sitsi song:',
    promptInstructionsHeader: 'Editing instructions:',
  }
};

export let currentLang = localStorage.getItem('lang') || 'fi';

export function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
}

export const CONFIG = () => TRANSLATIONS[currentLang];

export const PROMPT_TEMPLATE = (lyrics, instructions) => {
  const t = CONFIG();
  return `{konteksti}\n\n${t.promptEditHeader} ${lyrics}\n\n${t.promptInstructionsHeader} ${instructions}`;
};

