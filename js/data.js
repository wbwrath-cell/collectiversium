// Reálný sklad Collectiversium. Fotky zatím chybí (doplní se postupně),
// popisky a ceny vychází z aktuálně drženého merche.

const CATEGORIES = [
  {
    id: "karty",
    label: "Karty TCG & sběratelské karty",
    groups: [
      { label: "Sběratelské karty", items: ["Naruto", "Demon Slayer", "Sakamoto Days", "Bleach"] },
    ],
  },
  {
    id: "figurky",
    label: "Figurky & sběratelské předměty",
    groups: [
      { label: "Figurky a piny", items: ["Naruto"] },
      { label: "Plyšáci", items: ["Pokémon"] },
    ],
  },
];

// Risografická paleta pro barevné plotny produktů (bg, fg).
const FRANCHISE_COLORS = {
  "Naruto": ["#f2921a", "#14100e"],
  "Demon Slayer": ["#1f6b4a", "#fbf8f2"],
  "Sakamoto Days": ["#1d2b6b", "#fbf8f2"],
  "Pokémon": ["#ffd400", "#14100e"],
  "Bleach": ["#c81d3f", "#fbf8f2"],
  "default": ["#e8e0d1", "#14100e"],
};

const PRODUCTS = [
  // --- Karty / Sběratelské karty — uzavřené boxy ---
  {
    id: "kayou-naruto-platinum-hs-s01-box",
    category: "karty", group: "Sběratelské karty", franchise: "Naruto", type: "Balíček",
    name: "KAYOU Naruto — Platinum, Heaven Scroll Series 01",
    price: 169, compareAt: null, stock: 1,
    buyLink: "https://checkout.revolut.com/pay/9666ebfc-f064-4032-8cfd-2075aab95518",
    image: "img/kayou-naruto-platinum-hs-s01.webp",
    desc: "Balíček sběratelských karet KAYOU Naruto z prémiové řady Platinum, edice Heaven Scroll (Series 01). Zapečetěné balení, 8 karet.",
    facts: { "Výrobce": "KAYOU", "Edice": "Platinum — Heaven Scroll", "Série": "Series 01", "Karet v balíčku": "8", "Stav": "Nový, zapečetěný" },
  },
  {
    id: "kayou-demonslayer-box",
    category: "karty", group: "Sběratelské karty", franchise: "Demon Slayer", type: "Box",
    name: "KAYOU Demon Slayer — 无限城篇, Series 01",
    price: 1399, compareAt: null, stock: 1,
    buyLink: "https://checkout.revolut.com/pay/743eeb25-6489-4a02-a0be-a747b5fded24",
    image: "img/kayou-demonslayer-box.webp",
    desc: "Uzavřený box sběratelských karet KAYOU z licence Demon Slayer / Kimetsu no Yaiba (鬼灭之刃), edice 无限城篇 (Infinity Castle Chapter), Series 01. Zapečetěné balení.",
    facts: { "Výrobce": "KAYOU", "Licence": "Demon Slayer (鬼灭之刃)", "Edice": "无限城篇 (Infinity Castle Chapter)", "Série": "Series 01", "Stav": "Nový, zapečetěný box" },
  },
  {
    id: "sakamoto-days-box",
    category: "karty", group: "Sběratelské karty", franchise: "Sakamoto Days", type: "Box",
    name: "Sakamoto Days — sběratelské karty, box",
    price: 1399, compareAt: null, stock: 1,
    buyLink: "https://checkout.revolut.com/pay/5416f4fb-1d52-4fce-a8f8-e512e3d823d7",
    image: "img/sakamoto-days-box.webp",
    desc: "Uzavřený box sběratelských karet Sakamoto Days od CardFun, licencováno Netflixem. Zapečetěné balení.",
    facts: { "Výrobce": "CardFun", "Licence": "Sakamoto Days (Netflix)", "Stav": "Nový, zapečetěný box" },
  },
  {
    id: "bleach-box",
    category: "karty", group: "Sběratelské karty", franchise: "Bleach", type: "Box",
    name: "Bleach: Thousand-Year Blood War — 千年血战篇, box",
    price: 1199, compareAt: null, stock: 3,
    buyLink: "https://checkout.revolut.com/pay/e7afd739-b97a-45ec-ae49-79dbd10923c0",
    image: "img/bleach-box.webp",
    desc: "Uzavřený box sběratelských karet Bleach: Thousand-Year Blood War (千年血战篇), licence JUMP. Zapečetěné balení.",
    facts: { "Licence": "Bleach: Thousand-Year Blood War (JUMP)", "Stav": "Nový, zapečetěný box" },
  },
  {
    id: "kayou-naruto-s07-bingzhi-box",
    category: "karty", group: "Sběratelské karty", franchise: "Naruto", type: "Box",
    name: "KAYOU Naruto 火影忍者 — Series 07, 兵之章",
    price: 1099, compareAt: null, stock: 1,
    buyLink: "https://checkout.revolut.com/pay/f53e7dd7-18c2-4e7f-a9ac-f5cbbde57704",
    image: "img/kayou-naruto-s07-bingzhi-box.webp",
    desc: "Zapečetěný box sběratelských karet KAYOU Naruto 火影忍者, Series 07 (第七弹), edice 兵之章 (Soldier Chapter). Nikdy neotevřený.",
    facts: { "Výrobce": "KAYOU", "Série": "Series 07 (第七弹)", "Edice": "兵之章 (Soldier Chapter)", "Stav": "Nový, zapečetěný box" },
  },

  // --- Karty / Sběratelské karty — balíčky ---
  {
    id: "kayou-naruto-smriti-platinum-s02-pack",
    category: "karty", group: "Sběratelské karty", franchise: "Naruto", type: "Balíček",
    name: "KAYOU Naruto Smriti — Platinum, JIN Chapter Series 02",
    price: null, compareAt: null, stock: 1,
    desc: "Balíček KAYOU Naruto Smriti z prémiové řady Platinum, JIN Chapter (Series 02). Obsahuje 5 karet.",
    facts: { "Výrobce": "KAYOU", "Edice": "Smriti — Platinum, JIN Chapter", "Série": "Series 02", "Karet v balíčku": "5", "Stav": "Nový, zapečetěný" },
  },
  {
    id: "kayou-naruto-s06-pack",
    category: "karty", group: "Sběratelské karty", franchise: "Naruto", type: "Balíček",
    name: "KAYOU Naruto 火影忍者 — Series 06",
    price: null, compareAt: null, stock: 1,
    desc: "Balíček KAYOU Naruto 火影忍者, Series 06 (第六弹, řada 阵の章).",
    facts: { "Výrobce": "KAYOU", "Série": "Series 06 (第六弹 · 阵の章)", "Stav": "Nový, zapečetěný" },
  },
  {
    id: "kayou-naruto-s08-pack",
    category: "karty", group: "Sběratelské karty", franchise: "Naruto", type: "Balíček",
    name: "KAYOU Naruto 火影忍者 — Series 08",
    price: null, compareAt: null, stock: 1,
    desc: "Balíček KAYOU Naruto 火影忍者, Series 08 (第八弹, řada 阵の章).",
    facts: { "Výrobce": "KAYOU", "Série": "Series 08 (第八弹 · 阵の章)", "Stav": "Nový, zapečetěný" },
  },
  {
    id: "kayou-naruto-gold-s01-pack",
    category: "karty", group: "Sběratelské karty", franchise: "Naruto", type: "Balíček",
    name: "KAYOU Naruto — Gold, Series 01",
    price: null, compareAt: null, stock: 3,
    desc: "Balíček KAYOU Naruto z prémiové řady Gold, Series 01.",
    facts: { "Výrobce": "KAYOU", "Edice": "Gold", "Série": "Series 01", "Stav": "Nový, zapečetěný" },
  },
  {
    id: "kayou-naruto-heavenscroll-s07-pack",
    category: "karty", group: "Sběratelské karty", franchise: "Naruto", type: "Balíček",
    name: "KAYOU Naruto — Heaven Scroll, Series 07",
    price: null, compareAt: null, stock: 4,
    desc: "Balíček KAYOU Naruto z edice Heaven Scroll, Series 07. Obsahuje 8 karet.",
    facts: { "Výrobce": "KAYOU", "Edice": "Heaven Scroll", "Série": "Series 07", "Karet v balíčku": "8", "Stav": "Nový, zapečetěný" },
  },
  {
    id: "kayou-naruto-smriti-earthscroll-s08-pack",
    category: "karty", group: "Sběratelské karty", franchise: "Naruto", type: "Balíček",
    name: "KAYOU Naruto Smriti — Earth Scroll, Series 08",
    price: null, compareAt: null, stock: 4,
    desc: "Balíček KAYOU Naruto Smriti z edice Earth Scroll, Series 08. Obsahuje 8 karet.",
    facts: { "Výrobce": "KAYOU", "Edice": "Smriti — Earth Scroll", "Série": "Series 08", "Karet v balíčku": "8", "Stav": "Nový, zapečetěný" },
  },

  // --- Figurky & sběratelské předměty / Figurky a piny ---
  {
    id: "naruto-shippuden-minifig-8pack",
    category: "figurky", group: "Figurky a piny", franchise: "Naruto", type: "Mini figurky",
    name: "Naruto Shippuden — Mini Figures, 8 pack",
    price: 799, compareAt: null, stock: 1,
    buyLink: "https://checkout.revolut.com/pay/fd9f2d95-786d-4726-90e1-b9572199b272",
    image: "img/naruto-shippuden-8pack-front.webp",
    images: ["img/naruto-shippuden-8pack-front.webp", "img/naruto-shippuden-8pack-back.webp"],
    desc: "Balení 8 mini figurek Naruto Shippuden od PMI Kids World, řada „18 Shinobies to Collect, Vol. 1“. Obsahuje 2 vzácné skryté figurky.",
    facts: { "Výrobce": "PMI Kids World", "Obsah balení": "8 mini figurek", "Vzácné kusy": "2 skryté vzácné figurky", "Stav": "Nové, v původním balení" },
  },
  {
    id: "naruto-shippuden-minifig-6pack",
    category: "figurky", group: "Figurky a piny", franchise: "Naruto", type: "Mini figurky",
    name: "Naruto Shippuden — Mini Figures, 6 pack",
    price: 599, compareAt: null, stock: 1,
    buyLink: "https://checkout.revolut.com/pay/aed3e902-4f3f-4c49-8ff7-5633c69af471",
    image: "img/naruto-shippuden-6pack-front.webp",
    images: ["img/naruto-shippuden-6pack-front.webp", "img/naruto-shippuden-6pack-back.webp"],
    desc: "Balení 6 mini figurek Naruto Shippuden od PMI. Obsahuje 1 vzácnou skrytou figurku.",
    facts: { "Výrobce": "PMI", "Obsah balení": "6 mini figurek", "Vzácné kusy": "1 skrytá vzácná figurka", "Stav": "Nové, v původním balení" },
  },
  {
    id: "funko-pin-kawaki",
    category: "figurky", group: "Figurky a piny", franchise: "Naruto", type: "Funko Pin",
    name: "Funko POP! Pin — Kawaki #64",
    price: null, compareAt: null, stock: 1,
    desc: "Sběratelský odznak Funko POP! Pin — Kawaki, postava ze seriálu Boruto: Naruto Next Generations (#64). Svítí ve tmě, dodáván se stojánkem.",
    facts: { "Výrobce": "Funko", "Série": "Boruto: Naruto Next Generations", "Číslo": "#64", "Vlastnost": "Glow in the dark", "Stav": "Nový" },
  },

  // --- Figurky & sběratelské předměty / Plyšáci ---
  {
    id: "pokemon-plush-minun",
    category: "figurky", group: "Plyšáci", franchise: "Pokémon", type: "Plyšák",
    name: "Pokémon — Minun (plyšák + karta)",
    price: null, compareAt: null, stock: 1,
    desc: "Plyšák Pokémon Minun (负电拍拍) s přiloženou TCG kartou v ochranném obalu.",
    facts: { "Postava": "Minun", "Obsahuje": "TCG karta v obalu", "Stav": "Nové" },
  },
  {
    id: "pokemon-plush-plusle",
    category: "figurky", group: "Plyšáci", franchise: "Pokémon", type: "Plyšák",
    name: "Pokémon — Plusle (plyšák + karta)",
    price: 1400, compareAt: null, stock: 1,
    desc: "Plyšák Pokémon Plusle (正电拍拍) s přiloženou TCG kartou. Nový, s visačkou.",
    facts: { "Postava": "Plusle", "Obsahuje": "TCG karta v obalu", "Stav": "Nové, s visačkou" },
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
  return v == null ? "Cena na dotaz" : v.toLocaleString("cs-CZ") + " Kč";
}

function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}
