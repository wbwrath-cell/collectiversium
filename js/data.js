// Ukázková data. V ostré verzi nahradit napojením na sklad/CMS.

const CATEGORIES = [
  {
    id: "karty",
    label: "Karty",
    groups: [
      { label: "TCG karty", items: ["Pokémon", "Magic: The Gathering", "Yu-Gi-Oh!", "One Piece", "Lorcana", "Dragon Ball", "Další TCG"] },
      { label: "Sběratelské karty", items: ["Kayou", "Anime karty", "Filmové karty", "Sportovní karty", "Další sběratelské série"] },
    ],
  },
  {
    id: "filmy-serialy",
    label: "Filmy & seriály",
    groups: [
      { label: "Franšízy", items: ["Marvel", "DC", "Star Wars", "Harry Potter", "Disney", "Anime"] },
      { label: "Merch & edice", items: ["Filmový a seriálový merch", "Vlastní tvorba", "Sběratelské edice"] },
    ],
  },
  {
    id: "figurky",
    label: "Figurky & sběratelské předměty",
    groups: [
      { label: "Figurky", items: ["Funko Pop", "DeAgostini", "Anime figurky", "Limitované figurky"] },
      { label: "Ostatní", items: ["Busty", "Repliky", "Další collectibles"] },
    ],
  },
];

// Risografická paleta pro barevné plotny produktů (bg, fg).
const FRANCHISE_COLORS = {
  "Pokémon": ["#ffd400", "#14100e"],
  "Magic: The Gathering": ["#765ba7", "#fbf8f2"],
  "Yu-Gi-Oh!": ["#ff665e", "#14100e"],
  "One Piece": ["#0078bf", "#fbf8f2"],
  "Lorcana": ["#ff48b0", "#14100e"],
  "Dragon Ball": ["#ff6c2f", "#14100e"],
  "Kayou": ["#e23a25", "#fbf8f2"],
  "Anime karty": ["#00a95c", "#14100e"],
  "Filmové karty": ["#1d2b6b", "#fbf8f2"],
  "Sportovní karty": ["#00838a", "#fbf8f2"],
  "Marvel": ["#ff665e", "#14100e"],
  "DC": ["#0078bf", "#fbf8f2"],
  "Star Wars": ["#14100e", "#fbf8f2"],
  "Harry Potter": ["#c9922e", "#14100e"],
  "Disney": ["#3ea8de", "#14100e"],
  "Anime": ["#ff48b0", "#14100e"],
  "Funko Pop": ["#ff6c2f", "#14100e"],
  "DeAgostini": ["#4a423c", "#fbf8f2"],
  "Anime figurky": ["#765ba7", "#fbf8f2"],
  "default": ["#e8e0d1", "#14100e"],
};

const PRODUCTS = [
  // --- Karty / TCG karty ---
  {
    id: "pkm-151-box",
    category: "karty", group: "TCG karty", franchise: "Pokémon", type: "Booster Box",
    name: "Pokémon TCG Scarlet & Violet 151 Box",
    price: 4590, compareAt: 4890, stock: 6,
    desc: "Populární retro edice s original 151 Pokémony. 36 balíčků v boxu, anglická verze.",
    facts: { "Balíčků v boxu": "36", "Jazyk": "Angličtina", "Vydavatel": "The Pokémon Company", "Stav": "Nový, zapečetěný" },
  },
  {
    id: "pkm-pack-151",
    category: "karty", group: "TCG karty", franchise: "Pokémon", type: "Booster Pack",
    name: "Pokémon TCG Scarlet & Violet 151 – Booster Pack",
    price: 159, compareAt: null, stock: 63,
    desc: "Jednotlivý booster z edice 151. 10 karet v balení, šance na klasické Pokémony v novém artworku.",
    facts: { "Karet v balíčku": "10", "Jazyk": "Angličtina", "Stav": "Nový, zapečetěný" },
  },
  {
    id: "mtg-dsk-box",
    category: "karty", group: "TCG karty", franchise: "Magic: The Gathering", type: "Draft Booster Box",
    name: "Magic: The Gathering Duskmourn – Draft Booster Box",
    price: 3190, compareAt: null, stock: 9,
    desc: "36 draft boosterů z edice Duskmourn: House of Horror. Ideální pro draft i budování sbírky.",
    facts: { "Balíčků v boxu": "36", "Jazyk": "Angličtina", "Vydavatel": "Wizards of the Coast", "Stav": "Nový, zapečetěný" },
  },
  {
    id: "mtg-commander-deck",
    category: "karty", group: "TCG karty", franchise: "Magic: The Gathering", type: "Commander Deck",
    name: "Magic: The Gathering – Commander Deck",
    price: 890, compareAt: null, stock: 14,
    desc: "Hotový 100kartový Commander balíček připravený ke hraní hned po vybalení.",
    facts: { "Karet v balíčku": "100", "Jazyk": "Angličtina", "Stav": "Nový, zapečetěný" },
  },
  {
    id: "ygo-box",
    category: "karty", group: "TCG karty", franchise: "Yu-Gi-Oh!", type: "Booster Box",
    name: "Yu-Gi-Oh! Legendary Duelists – Booster Box",
    price: 2490, compareAt: null, stock: 7,
    desc: "24 balíčků v boxu, tematická edice s ikonickými souboji legendárních duelantů.",
    facts: { "Balíčků v boxu": "24", "Jazyk": "Angličtina", "Vydavatel": "Konami", "Stav": "Nový, zapečetěný" },
  },
  {
    id: "op-romance-op01",
    category: "karty", group: "TCG karty", franchise: "One Piece", type: "Booster Box",
    name: "One Piece TCG Romance Dawn OP-01 Box",
    price: 3290, compareAt: null, stock: 5,
    desc: "První edice oficiální One Piece TCG. Anglická verze, 24 balíčků v boxu.",
    facts: { "Balíčků v boxu": "24", "Jazyk": "Angličtina", "Vydavatel": "Bandai", "Stav": "Nový, zapečetěný" },
  },
  {
    id: "op-pack-op09",
    category: "karty", group: "TCG karty", franchise: "One Piece", type: "Booster Pack",
    name: "One Piece TCG OP-09 – Booster Pack",
    price: 179, compareAt: null, stock: 0,
    desc: "Nejnovější edice OP-09. Momentálně vyprodáno, doplnění skladu očekáváme brzy.",
    facts: { "Karet v balíčku": "12", "Jazyk": "Angličtina", "Vydavatel": "Bandai" },
  },
  {
    id: "lorcana-rotf-pack",
    category: "karty", group: "TCG karty", franchise: "Lorcana", type: "Booster Pack",
    name: "Disney Lorcana: Rise of the Floodborn – Booster Pack",
    price: 199, compareAt: null, stock: 31,
    desc: "Druhá edice Disney Lorcana. 12 karet v balení, kombinuje klasické disneyovky s kartovou strategií.",
    facts: { "Karet v balíčku": "12", "Jazyk": "Angličtina", "Stav": "Nový, zapečetěný" },
  },
  {
    id: "dbz-fusion-box",
    category: "karty", group: "TCG karty", franchise: "Dragon Ball", type: "Booster Box",
    name: "Dragon Ball Super Card Game – Fusion World Box",
    price: 2990, compareAt: null, stock: 11,
    desc: "Aktuální generace Dragon Ball TCG. 24 balíčků v boxu, anglická verze.",
    facts: { "Balíčků v boxu": "24", "Jazyk": "Angličtina", "Vydavatel": "Bandai", "Stav": "Nový, zapečetěný" },
  },

  // --- Karty / Sběratelské karty ---
  {
    id: "nrt-boruto-bp01",
    category: "karty", group: "Sběratelské karty", franchise: "Kayou", type: "Booster Pack",
    name: "Naruto Kayou BP01 – Booster Pack",
    price: 149, compareAt: null, stock: 42,
    desc: "Oficiální sběratelský booster z řady Kayou BP01. Každý balíček obsahuje 6 karet, šance na Rare/SP vydání.",
    facts: { "Karet v balíčku": "6", "Jazyk": "Čínština (mezinárodní vydání)", "Vydavatel": "Kayou", "Stav": "Nový, zapečetěný" },
  },
  {
    id: "nrt-tier1-box",
    category: "karty", group: "Sběratelské karty", franchise: "Kayou", type: "Booster Box",
    name: "Naruto Kayou Tier 1 – Booster Box (30 ks)",
    price: 3690, compareAt: 3990, stock: 8,
    desc: "Celý box po 30 balíčcích. Zaručený obsah minimálně jedné SSP/UR karty na box (dle aktuální edice).",
    facts: { "Balíčků v boxu": "30", "Karet celkem": "180", "Vydavatel": "Kayou", "Stav": "Nový, zapečetěný" },
  },
  {
    id: "ds-pack-01",
    category: "karty", group: "Sběratelské karty", franchise: "Anime karty", type: "Booster Pack",
    name: "Demon Slayer TCG – Booster Pack",
    price: 169, compareAt: null, stock: 27,
    desc: "Sběratelské karty Demon Slayer / Kimetsu no Yaiba. Limitovaná edice.",
    facts: { "Karet v balíčku": "9", "Jazyk": "Angličtina", "Stav": "Nový, zapečetěný" },
  },
  {
    id: "marvel-metal-pack",
    category: "karty", group: "Sběratelské karty", franchise: "Filmové karty", type: "Booster Pack",
    name: "Marvel Metal Universe – Booster Pack",
    price: 139, compareAt: null, stock: 38,
    desc: "Kovové sběratelské karty s hrdiny a záporáky z Marvel univerza.",
    facts: { "Karet v balíčku": "5", "Jazyk": "Angličtina", "Stav": "Nový, zapečetěný" },
  },
  {
    id: "nba-hoops-box",
    category: "karty", group: "Sběratelské karty", franchise: "Sportovní karty", type: "Booster Box",
    name: "NBA Hoops – Booster Box",
    price: 2190, compareAt: null, stock: 10,
    desc: "Aktuální sezóna NBA Hoops. 24 balíčků v boxu, šance na rookie karty a autogramy.",
    facts: { "Balíčků v boxu": "24", "Vydavatel": "Panini", "Stav": "Nový, zapečetěný" },
  },

  // --- Filmy & seriály ---
  {
    id: "marvel-steelbook",
    category: "filmy-serialy", group: "Franšízy", franchise: "Marvel", type: "Sběratelská edice",
    name: "Marvel Cinematic Universe – Steelbook sběratelská edice",
    price: 990, compareAt: 1190, stock: 4,
    desc: "Limitovaná steelbook edice s exkluzivním artworkem. Obsahuje bonusový materiál.",
    facts: { "Formát": "4K Ultra HD + Blu-ray", "Jazyk": "CZ/EN titulky", "Stav": "Nové, zafóliované" },
  },
  {
    id: "starwars-set",
    category: "filmy-serialy", group: "Franšízy", franchise: "Star Wars", type: "Sběratelská edice",
    name: "Star Wars – Original Trilogy Sběratelský box set",
    price: 1690, compareAt: null, stock: 3,
    desc: "Kompletní původní trilogie v prémiovém sběratelském balení s artbookem.",
    facts: { "Formát": "4K Ultra HD", "Obsah": "3 filmy + artbook", "Stav": "Nové, zafóliované" },
  },
  {
    id: "hp-pin-set",
    category: "filmy-serialy", group: "Merch & edice", franchise: "Harry Potter", type: "Merch",
    name: "Harry Potter – Sada odznaků bradavických kolejí",
    price: 349, compareAt: null, stock: 22,
    desc: "Sada 4 smaltovaných odznaků se znaky všech čtyř bradavických kolejí.",
    facts: { "Počet kusů": "4", "Materiál": "Kov, smalt", "Stav": "Nové" },
  },
  {
    id: "disney-vinylmation",
    category: "filmy-serialy", group: "Franšízy", franchise: "Disney", type: "Merch",
    name: "Disney – Limitovaná sběratelská figurka série Vault",
    price: 590, compareAt: null, stock: 12,
    desc: "Limitovaná edice sběratelské figurky z klasické disneyovské kolekce Vault.",
    facts: { "Edice": "Limitovaná", "Materiál": "Vinyl", "Stav": "Nové, v originální krabičce" },
  },
  {
    id: "onepiece-poster",
    category: "filmy-serialy", group: "Merch & edice", franchise: "Anime", type: "Merch",
    name: "One Piece – Sběratelský plakát Straw Hat Crew",
    price: 299, compareAt: null, stock: 40,
    desc: "Prémiový tisk na těžším papíře, limitovaná edice s číslovaným certifikátem.",
    facts: { "Rozměr": "50 × 70 cm", "Edice": "Číslovaná", "Stav": "Nové" },
  },

  // --- Figurky & sběratelské předměty ---
  {
    id: "funko-spiderman",
    category: "figurky", group: "Figurky", franchise: "Funko Pop", type: "Funko Pop!",
    name: "Funko Pop! Marvel – Spider-Man",
    price: 349, compareAt: null, stock: 26,
    desc: "Oficiální Funko Pop! figurka Spider-Mana v originální krabičce.",
    facts: { "Výška": "9 cm", "Číslo edice": "#1234", "Stav": "Nové, v krabičce" },
  },
  {
    id: "funko-itachi",
    category: "figurky", group: "Figurky", franchise: "Anime figurky", type: "Funko Pop!",
    name: "Funko Pop! Naruto – Itachi Uchiha",
    price: 399, compareAt: null, stock: 17,
    desc: "Sběratelská Funko Pop! figurka Itachiho Uchihy z Naruto Shippuden.",
    facts: { "Výška": "9 cm", "Edice": "Special Edition", "Stav": "Nové, v krabičce" },
  },
  {
    id: "deagostini-starwars",
    category: "figurky", group: "Figurky", franchise: "DeAgostini", type: "Stavebnicová kolekce",
    name: "DeAgostini Star Wars – Stavebnicová kolekce, díl 1",
    price: 249, compareAt: null, stock: 34,
    desc: "První díl sběratelské stavebnicové kolekce s časopisem a doplňkovými díly.",
    facts: { "Vydání": "Díl 1/100", "Obsah": "Časopis + díly modelu", "Stav": "Nové" },
  },
  {
    id: "bust-batman",
    category: "figurky", group: "Ostatní", franchise: "DC", type: "Busta",
    name: "DC Collectibles – Busta Batman Prémiová edice",
    price: 2490, compareAt: 2790, stock: 5,
    desc: "Ručně malovaná pryskyřicová busta v měřítku 1:6, limitovaná edice s číslovaným certifikátem.",
    facts: { "Měřítko": "1:6", "Materiál": "Pryskyřice", "Edice": "Číslovaná", "Stav": "Nové" },
  },
  {
    id: "replica-wand",
    category: "figurky", group: "Ostatní", franchise: "Harry Potter", type: "Replika",
    name: "Harry Potter – Sběratelská replika hůlky (Ollivander's)",
    price: 890, compareAt: null, stock: 19,
    desc: "Detailní replika kouzelnické hůlky v dřevěné krabičce s certifikátem pravosti.",
    facts: { "Délka": "35 cm", "Materiál": "Pryskyřice, dřevěný povrch", "Stav": "Nové, v krabičce" },
  },
];

function franchiseColors(franchise) {
  return FRANCHISE_COLORS[franchise] || FRANCHISE_COLORS.default;
}

function franchiseStyle(franchise) {
  const [bg, fg] = franchiseColors(franchise);
  return `background:${bg}; color:${fg};`;
}

function categoryLabel(id) {
  const c = CATEGORIES.find((c) => c.id === id);
  return c ? c.label : id;
}

function formatPrice(v) {
  return v.toLocaleString("cs-CZ") + " Kč";
}

function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}
