// Generátor statických stránek produktů + sitemap.xml + robots.txt.
//
// Zdrojem pravdy zůstává js/data.js. Tenhle skript z něj vyrobí jednu skutečnou
// HTML stránku na produkt (/produkt/<id>.html) s vyplněnými meta tagy, OG tagy
// a JSON-LD, aby Google i sociální sítě viděly obsah bez spouštění JS.
//
// Spuštění:  node tools/build.js

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "produkt");
const ORIGIN = "https://collectiversium.cz";

// --- načtení data.js + site.js do izolovaného kontextu ---------------------

function loadSiteScripts() {
  const ctx = {
    console,
    encodeURIComponent,
    document: { addEventListener() {} },
    window: {},
    exported: null,
  };
  vm.createContext(ctx);
  const src =
    fs.readFileSync(path.join(ROOT, "js", "data.js"), "utf8") +
    "\n" +
    fs.readFileSync(path.join(ROOT, "js", "site.js"), "utf8") +
    "\nexported = { PRODUCTS, CATEGORIES, categoryLabel, formatPrice, franchiseStyle, cardHTML, contactMailto, productUrl, activeProducts };";
  vm.runInContext(src, ctx);
  return ctx.exported;
}

// --- pomocné -------------------------------------------------------------

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function metaDescription(p) {
  // Google zobrazuje cca 155 znaků — ořízneme na hranici slova.
  const raw = p.desc.replace(/\s+/g, " ").trim();
  if (raw.length <= 155) return raw;
  const cut = raw.slice(0, 155);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.;–—-]$/, "") + "…";
}

function jsonLd(obj) {
  // </script> uvnitř JSON by ukončil blok dřív, než má.
  return JSON.stringify(obj, null, 2).replace(/</g, "\\u003c");
}

// Produkt pustíme do indexu jen když je opravdu hotový: má fotku i cenu.
// Polotovary ("Cena na dotaz", bez fotky) by na nové doméně byly thin content.
const isIndexable = (p) => Boolean(p.image) && p.price != null;

// --- JSON-LD -------------------------------------------------------------

function productSchema(p, S) {
  const url = ORIGIN + S.productUrl(p);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.desc,
    sku: p.id,
    category: S.categoryLabel(p.category) + " / " + p.franchise,
    brand: { "@type": "Brand", name: p.facts?.["Výrobce"] || p.franchise },
    url,
  };

  const imgs = (p.images && p.images.length ? p.images : p.image ? [p.image] : []).map((i) => ORIGIN + "/" + i);
  if (imgs.length) schema.image = imgs;

  // Nabídku uvádíme jen s reálnou cenou — cenu si nevymýšlíme.
  if (p.price != null) {
    schema.offers = {
      "@type": "Offer",
      url,
      priceCurrency: "CZK",
      price: p.price,
      itemCondition: "https://schema.org/NewCondition",
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Collectiversium" },
    };
  }
  return schema;
}

function breadcrumbSchema(p, S) {
  const items = [
    ["Domů", ORIGIN + "/"],
    [S.categoryLabel(p.category), `${ORIGIN}/products.html?category=${p.category}`],
    [p.franchise, `${ORIGIN}/products.html?category=${p.category}&franchise=${encodeURIComponent(p.franchise)}`],
    [p.name, ORIGIN + S.productUrl(p)],
  ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, item], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item,
    })),
  };
}

// --- tělo stránky --------------------------------------------------------

function purchaseBlock(p, S) {
  if (p.buyLink) {
    return `<a class="btn" href="${esc(p.buyLink)}" target="_blank" rel="noopener">Koupit</a>`;
  }
  // Bez platebního odkazu nemáme funkční pokladnu — posíláme na e-mail,
  // ať zákazník neskončí ve slepém košíku.
  return `<a class="btn" href="${esc(S.contactMailto(p))}">Napsat pro objednávku</a>`;
}

function mediaBlock(p, S) {
  const gallery = p.images && p.images.length > 1 ? p.images : null;
  const main = p.image || (gallery && gallery[0]);
  const media = main
    ? `<div class="pdp-media has-photo" id="pdp-media"><img src="/${esc(main)}" alt="${esc(p.name)}" /></div>`
    : `<div class="pdp-media" id="pdp-media" style="${esc(S.franchiseStyle(p.franchise))}"><span>${esc(p.name)}</span></div>`;

  const thumbs = gallery
    ? `\n          <div class="pdp-thumbs">${gallery
        .map(
          (src, i) =>
            `<button class="pdp-thumb${i === 0 ? " active" : ""}" data-src="/${esc(src)}"><img src="/${esc(
              src
            )}" alt="${esc(p.name)} – náhled ${i + 1}" /></button>`
        )
        .join("")}</div>`
    : "";

  return `<div class="pdp-media-wrap">\n          ${media}${thumbs}\n        </div>`;
}

function stockLine(p) {
  // Bez "Poslední N ks" urgence zatím — jen dostupné / nedostupné.
  if (p.stock === 0) return `<div class="stock-line out">Momentálně nedostupné</div>`;
  return `<div class="stock-line">Skladem — ${p.stock} ks</div>`;
}

function relatedGrid(p, S) {
  const active = S.activeProducts();
  const same = active.filter((r) => r.franchise === p.franchise && r.id !== p.id);
  const pool = same.length >= 4 ? same : active.filter((r) => r.category === p.category && r.id !== p.id);
  return pool.slice(0, 4).map(S.cardHTML).join("");
}

function renderProductPage(p, S) {
  const url = ORIGIN + S.productUrl(p);
  const desc = metaDescription(p);
  const ogImage = p.image || (p.images && p.images[0]);
  const robots = isIndexable(p) ? "index, follow" : "noindex, follow";

  const priceMeta =
    p.price != null
      ? `\n<meta property="product:price:amount" content="${p.price}" />\n<meta property="product:price:currency" content="CZK" />`
      : "";

  const ogImageTags = ogImage
    ? `\n<meta property="og:image" content="${ORIGIN}/${esc(ogImage)}" />\n<meta property="og:image:alt" content="${esc(
        p.name
      )}" />\n<meta name="twitter:image" content="${ORIGIN}/${esc(ogImage)}" />`
    : "";

  return `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(p.name)} – Collectiversium</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${url}" />
<meta name="robots" content="${robots}" />

<meta property="og:type" content="product" />
<meta property="og:site_name" content="Collectiversium" />
<meta property="og:locale" content="cs_CZ" />
<meta property="og:title" content="${esc(p.name)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${url}" />${ogImageTags}${priceMeta}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(p.name)}" />
<meta name="twitter:description" content="${esc(desc)}" />

<link rel="stylesheet" href="/css/style.css" />
<script type="application/ld+json">
${jsonLd(productSchema(p, S))}
</script>
<script type="application/ld+json">
${jsonLd(breadcrumbSchema(p, S))}
</script>
</head>
<body>

<header id="site-header" class="site"></header>

<div class="container">
  <div class="crumbs">
    <a href="/">Domů</a> ›
    <a href="/products.html?category=${p.category}">${esc(S.categoryLabel(p.category))}</a> ›
    <a href="/products.html?category=${p.category}&amp;franchise=${encodeURIComponent(p.franchise)}">${esc(p.franchise)}</a>
  </div>
</div>

<div class="container">
  <div class="pdp">
    ${mediaBlock(p, S)}
    <div class="pdp-info">
      <span class="kicker">${esc(p.franchise)} / ${esc(p.type)}</span>
      <h1>${esc(p.name)}</h1>
      <div class="pdp-price">${esc(S.formatPrice(p.price))}</div>
      <p class="pdp-vat">Konečná cena v CZK včetně dopravy. Nejsme plátci DPH — daň není součástí ceny ani se k ní nepřipočítává.</p>
      <p class="pdp-desc">${esc(p.desc)}</p>
      <div class="pdp-row">${purchaseBlock(p, S)}</div>
      ${stockLine(p)}
      <ul class="pdp-facts">
        ${Object.entries(p.facts)
          .map(([k, v]) => `<li><b>${esc(k)}</b><span>${esc(v)}</span></li>`)
          .join("\n        ")}
      </ul>
      <div class="badge-note">Originál zboží od ověřených dodavatelů — prodáváme výhradně v zapečetěném / neotevřeném stavu.</div>
    </div>
  </div>
</div>

<section class="section container">
  <div class="section-head">
    <div>
      <span class="kicker">Ze stejné řady</span>
      <h2>Mohlo by se vám líbit</h2>
    </div>
  </div>
  <div class="grid">${relatedGrid(p, S)}</div>
</section>

<footer id="site-footer" class="site"></footer>

<script src="/js/data.js"></script>
<script src="/js/cart.js"></script>
<script src="/js/site.js"></script>
<script>
  // Přepínání náhledů v galerii (jen pokud má produkt víc fotek).
  document.querySelectorAll(".pdp-thumb").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelector("#pdp-media img").src = btn.dataset.src;
      document.querySelectorAll(".pdp-thumb").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
    });
  });
</script>
</body>
</html>
`;
}

// --- sitemap + robots ----------------------------------------------------

const STATIC_PAGES = [
  ["/", "1.0", "daily"],
  ["/products.html", "0.9", "daily"],
  ["/aktuality.html", "0.6", "weekly"],
  ["/obchodni-podminky.html", "0.3", "yearly"],
  ["/reklamacni-rad.html", "0.3", "yearly"],
  ["/odstoupeni-od-smlouvy.html", "0.3", "yearly"],
  ["/ochrana-osobnich-udaju.html", "0.3", "yearly"],
];

function renderSitemap(products, S) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    ...STATIC_PAGES.map(([loc, prio, freq]) => ({ loc, prio, freq })),
    ...products.filter(isIndexable).map((p) => ({ loc: S.productUrl(p), prio: "0.8", freq: "weekly" })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${ORIGIN}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.prio}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
}

const ROBOTS_TXT = `User-agent: *
Allow: /

# Košík je pro každého návštěvníka jiný a nemá co dělat ve výsledcích.
Disallow: /cart.html
# Stará URL s parametrem — nahrazena /produkt/<id>.html
Disallow: /product.html

Sitemap: ${ORIGIN}/sitemap.xml
`;

// --- serverový katalog ---------------------------------------------------

// Co server potřebuje k ověření objednávky — nic víc. Popisy, fotky ani
// fakta sem nepatří, jen to, podle čeho se počítá cena a dostupnost.
//
// Do katalogu jdou pouze produkty, které lze reálně koupit: aktivní
// (ne draft) a s cenou. Tím je pokus objednat rozpracovanou položku
// odbytý už na úrovni dat — validátor ji prostě nenajde.
function isPurchasable(p) {
  return !p.draft && p.price != null;
}

function renderServerCatalog(active) {
  const purchasable = active.filter(isPurchasable);
  const entries = {};
  for (const p of purchasable) {
    entries[p.id] = { name: p.name, price: p.price, stock: p.stock };
  }

  return `// GENEROVÁNO SKRIPTEM tools/build.js — NEEDITOVAT RUČNĚ.
//
// Serverová kopie katalogu pro ověřování objednávek. Zdroj pravdy je
// js/data.js; tenhle soubor z něj vzniká při každém buildu.
//
// Existuje proto, že cenám poslaným z prohlížeče se nesmí věřit —
// server si je vždycky dohledá tady. Viz server/order.js.

export const GENERATED_AT = ${JSON.stringify(new Date().toISOString())};

export const CATALOG = ${JSON.stringify(entries, null, 2)};
`;
}

// --- main ----------------------------------------------------------------

function main() {
  const S = loadSiteScripts();

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Draft produkty (bez foto a ceny) nemají stránku vůbec — nejsou v nabídce,
  // takže by na ně stejně nikde nevedl odkaz.
  const active = S.activeProducts();
  const draftCount = S.PRODUCTS.length - active.length;

  let indexable = 0;
  for (const p of active) {
    fs.writeFileSync(path.join(OUT_DIR, p.id + ".html"), renderProductPage(p, S), "utf8");
    if (isIndexable(p)) indexable++;
  }

  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), renderSitemap(active, S), "utf8");
  fs.writeFileSync(path.join(ROOT, "robots.txt"), ROBOTS_TXT, "utf8");

  fs.mkdirSync(path.join(ROOT, "server"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "server", "catalog.js"), renderServerCatalog(active), "utf8");
  const purchasable = active.filter(isPurchasable).length;

  console.log(`produkt/      ${active.length} stránek (${indexable} v indexu, ${active.length - indexable} noindex, ${draftCount} draft vynecháno)`);
  console.log(`sitemap.xml   ${STATIC_PAGES.length + indexable} URL`);
  console.log(`robots.txt    OK`);
  console.log(`server/catalog.js  ${purchasable} prodejných položek`);
}

main();
