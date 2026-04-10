export const CONFIG = {
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
};

export const PROMPT_TEMPLATE = `{konteksti}

Muokkaa tätä sitsilaulua: {lyrics}

Muokkausohjeet: {instructions}`;
