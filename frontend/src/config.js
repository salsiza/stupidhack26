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
    promptLanguageSuffix: '',
    bridgeTitle: '🪑 AASINSILTAHOMMAT:',
    bridgeSongLabel: 'Mille biisille tää kömpelö kaarros tehdään?',
    bridgeSongPlaceholder: 'esim. Paavi ja sulttaani',
    bridgeButtonText: 'Keksi aasinsilta tästä',
    bridgeDividerText: 'Laitetaanko vielä aasinsiltahommat kuntoon?',
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
    promptLanguageSuffix: 'Please provide the response in English.',
    bridgeTitle: '🪑 BRIDGE NONSENSE:',
    bridgeSongLabel: 'Which song should this awkward segue point to?',
    bridgeSongPlaceholder: 'e.g. Pope and the Sultan',
    bridgeButtonText: 'Invent a bridge for this',
    bridgeDividerText: 'Want to fix the bridge nonsense too?',
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
  return `{konteksti}\n\n${t.promptEditHeader} ${lyrics}\n\n${t.promptInstructionsHeader} ${instructions}\n\n${t.promptLanguageSuffix}`.trim();
};

export const BRIDGE_PROMPT_TEMPLATE = `Tehtäväsi on auttaa sitsien aasinsillan rakentamisessa kahdessa vaiheessa.

Sinulle annetaan valmiiksi sitsilaulun nimi. Et tarvitse sanoituksia etkä saa käyttää biisin teemaa, sisältöä tai tarinaa aasinsillan pohjana. Aasinsillan ei pidä liittyä biisin aiheeseen, vaan sen pitää olla erillinen, tavallisen elämän pieni kertomus, jonka aivan viimeiset sanat viittaavat biisin nimeen tai kuulostavat siltä, että siitä voi tajuta mikä biisi on tulossa.

Aasinsillan idea:
Aasinsilta on lukkarin kertoma usein tahallisen kömpelö, vähän väkisin rakennettu siirtymä seuraavaan lauluun. Sen kuuluu kuulostaa enemmän tarinalta, jonka kertoisi kaverille jostain päivän tapahtumasta tai jostain aiemmasta sattumuksesta, kuin vitsiltä tai valmiiksi kirjoitetulta tekstiltä. Tarinan pitää olla uskottavan kuuloinen, vaikka se olisi keksitty. Se saa olla arkinen, turha, hieman ylipitkä, vähän huonosti perusteltu tai muuten kömpelö. Se on hyvä merkki, jos kuulijat hetken ihmettelevät yhteyttä ja joku voisi jopa sanoa “selitä”.

Tärkeimmät säännöt:
1. Älä kirjoita runoa, riimejä tai laulunsanoja.
2. Kirjoita luonnollista puhekielistä suomea.
3. Aasinsillan pitää olla sellainen tarina, jonka voisi kertoa kaverille esimerkiksi siitä mitä tänään tapahtui, mitä tapahtui eilen, matkalla tänne, kaupassa, bussissa, kotona, koulussa, töissä, baarissa tai joskus aiemmin.
4. Tarina ei saa liittyä biisin teemaan, sisältöön, tunnelmaan tai hahmoihin.
5. Ainoa yhteys biisiin tulee aivan lopussa.
6. Viimeisten sanojen pitää rimmaamalla, muistuttamalla, väärinkuulostamalla tai muuten assosioimalla tuoda biisin nimi mieleen.
7. Yhteyden biisiin ei tarvitse olla liian selvä. Sen saa olla juuri sen verran huono, että osa tajuaa heti ja osa jää miettimään.
8. Tarinan kuuluu olla tahallisen kömpelö ja vähän väkisin biisiin päätyvä.
9. Lopussa ei tarvitse mainita biisin oikeaa nimeä suoraan ennen loppurepliikkiä.
10. Jokaisen valmiin aasinsillan loppuun pitää lisätä täsmälleen tämä rivi:
Ja tästä tuli mieleen laulu numerolla...

Vaihe 1: keksi 10 vaihtoehtoa
Kun saat biisin nimen, älä kirjoita vielä aasinsiltaa.
Keksi ensin 10 erilaista vaihtoehtoa, jotka:
- rimmaavat biisin nimen kanssa, tai
- kuulostavat samalta, tai
- muistuttavat sitä väärinkuultuna, tai
- ovat muuten samanhenkinen sanapari tai lause, josta biisin nimi voisi tulla mieleen

Esimerkkejä:
- Paavi ja sulttaani -> haavi ja tulppaani
- Koskenkorva -> koskin Mikon korvaa

Näiden vaihtoehtojen pitää olla sellaisia, että niistä voisi rakentaa aasinsillan lopetuksen.

Listaa vaihtoehdot numeroituna 1–10.
Älä vielä kirjoita aasinsiltaa.
Pyydä käyttäjää valitsemaan paras vaihtoehto kertomalla sen numero.

Vaihe 2: kirjoita aasinsilta valitun vaihtoehdon pohjalta
Kun käyttäjä vastaa numerolla, kirjoita sen pohjalta 3 erilaista aasinsiltaa.

Aasinsillan rakenne:
- Aloita arkisesta tai henkilökohtaisesta tapahtumasta
- Kerro se puhekielisenä tarinana
- Älä johda liian suoraan mihinkään
- Anna tarinan kuulostaa siltä, että se vain rönsyilee eteenpäin
- Tuo valittu sanamuoto vasta ihan viimeisiin sanoihin
- Lisää loppuun omalle rivilleen:
Ja tästä tuli mieleen laulu numerolla...

Kirjoitustyyli:
- kuin kertoisit kaverille jostain päivän tai menneen ajan tapahtumasta
- puhekielinen
- luonteva mutta vähän kömpelö
- ei liian hiottu
- ei liian nokkela
- saa olla vaivaannuttava
- saa olla niin huono, että se on hyvä

Pituus:
Tee 3 versiota.
Jokaisen version pitää olla 2–4 lauseen mittainen.
Älä tee yhdestä lyhyttä, toisesta pidempää ja kolmannesta pitkää, vaan kaikkien pitää olla suunnilleen saman mittaisia.

Muista:
- Älä käytä biisin sanoituksia
- Älä rakenna tarinaa biisin teeman ympärille
- Tarinan pitää toimia irrallisena kertomuksena
- Biisiyhteys tulee vain lopussa valitun ilmauksen kautta
- Jos yhteys on vähän huono, se on usein hyvä asia
- Jos käyttäjän valitsema vaihtoehto on huono tai vaikea, älä vaihda sitä parempaan, vaan rakenna aasinsilta juuri siitä

Biisin nimi:
{songName}`;
