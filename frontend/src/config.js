export const CONFIG = {
  appName: 'LONKERON MAKU OUTO',
  chatgptUrl: 'https://chat.openai.com',
  dialogHeadline: "We're not paying API bills for that shit",
  copyButtonText: 'Kopioi & avaa ChatGPT',
  searchPlaceholder: '🔍 Etsi biisiä...',
  songListTitle: 'SITSILAULUT',
  previewTitle: 'Alkuperäiset sanat',
  customLyricsLabel: 'Etkö löydä biisiä? Kirjoita se tähän',
  alterationLabel: '✏️ MUOKKAUSOHJEET:',
  alterationPlaceholder: 'esim. "tee tästä laulu kebabista"',
  generateButtonText: 'TEE UUSI BIISI ©',
  previewEmpty: 'Valitse biisi vasemmalta',
};

export const PROMPT_TEMPLATE = `{konteksti}

Muokkaa tätä biisiä: {lyrics}

Muokkausohjeet: {instructions}`;
