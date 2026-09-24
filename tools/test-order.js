// Testy validace košíku. Spuštění:  node tools/test-order.js
//
// Běží proti skutečnému vygenerovanému katalogu (server/catalog.js), takže
// zároveň ověřují, že build vyrobil použitelná data.
//
// Hlavní důraz je na útočné případy — podvržená cena, záporné množství,
// objednání skryté položky. Tyhle testy jsou důvod, proč sem validace
// vůbec patří.

import { CATALOG } from "../server/catalog.js";
import { validateCart, czkToHaler, canTransition, formatOrderNumber, MAX_QTY_PER_ITEM } from "../server/order.js";

let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ok    ${name}`);
  } else {
    failed++;
    console.log(`  CHYBA ${name}${detail ? " — " + detail : ""}`);
  }
}

const ids = Object.keys(CATALOG);
if (ids.length === 0) {
  console.error("Katalog je prázdný — nejdřív spusť: node tools/build.js");
  process.exit(1);
}

// Vybereme produkt, který má aspoň 1 ks skladem, ať jdou dělat kladné testy.
const sampleId = ids.find((id) => CATALOG[id].stock > 0);
const sample = CATALOG[sampleId];

console.log(`\nKatalog: ${ids.length} položek, testovací produkt: ${sampleId} (${sample.price} Kč, ${sample.stock} ks)\n`);

console.log("Platné objednávky");
{
  const r = validateCart([{ id: sampleId, qty: 1 }], CATALOG);
  check("jeden kus projde", r.ok);
  check("cena odpovídá katalogu", r.ok && r.total === sample.price, r.ok ? `dostal ${r.total}` : "");
  check("položka nese snapshot názvu", r.ok && r.items[0].name === sample.name);
}

console.log("\nPodvržená cena z prohlížeče");
{
  // Přesně ten případ, kvůli kterému validace existuje: klient pošle
  // vlastní cenu. Musí se ignorovat.
  const r = validateCart([{ id: sampleId, qty: 1, price: 1, unitPrice: 1, lineTotal: 1 }], CATALOG);
  check("podvržená cena je ignorována", r.ok && r.total === sample.price, r.ok ? `dostal ${r.total}` : "neprošlo vůbec");
}

console.log("\nNeplatné vstupy");
{
  check("prázdný košík neprojde", !validateCart([], CATALOG).ok);
  check("null neprojde", !validateCart(null, CATALOG).ok);
  check("neznámé id neprojde", !validateCart([{ id: "neexistuje-xyz", qty: 1 }], CATALOG).ok);
  check("záporné množství neprojde", !validateCart([{ id: sampleId, qty: -5 }], CATALOG).ok);
  check("nulové množství neprojde", !validateCart([{ id: sampleId, qty: 0 }], CATALOG).ok);
  check("desetinné množství neprojde", !validateCart([{ id: sampleId, qty: 1.5 }], CATALOG).ok);
  check("množství jako text neprojde", !validateCart([{ id: sampleId, qty: "1; DROP TABLE" }], CATALOG).ok);
  check("položka bez id neprojde", !validateCart([{ qty: 1 }], CATALOG).ok);
  check("duplicitní položka neprojde", !validateCart([{ id: sampleId, qty: 1 }, { id: sampleId, qty: 1 }], CATALOG).ok);
  check(`množství nad limit (${MAX_QTY_PER_ITEM}) neprojde`, !validateCart([{ id: sampleId, qty: MAX_QTY_PER_ITEM + 1 }], CATALOG).ok);
  check("množství nad sklad neprojde", !validateCart([{ id: sampleId, qty: sample.stock + 1 }], CATALOG).ok);
}

console.log("\nSkryté položky nejsou objednatelné");
{
  // Draft produkty se do serverového katalogu vůbec negenerují.
  const draftIds = ["pokemon-plush-plusle", "pokemon-plush-minun", "kayou-naruto-s06-pack"];
  for (const id of draftIds) {
    check(`${id} není v katalogu`, !(id in CATALOG));
    check(`${id} nelze objednat`, !validateCart([{ id, qty: 1 }], CATALOG).ok);
  }
}

console.log("\nPřevod na haléře");
{
  check("1099 Kč = 109900 haléřů", czkToHaler(1099) === 109900);
  check("0 Kč projde", czkToHaler(0) === 0);
  let threw = false;
  try { czkToHaler(10.5); } catch { threw = true; }
  check("desetinná částka vyhodí chybu", threw);
}

console.log("\nStavy objednávky");
{
  check("pending → paid povoleno", canTransition("pending", "paid"));
  check("pending → failed povoleno", canTransition("pending", "failed"));
  check("paid → failed ZAKÁZÁNO", !canTransition("paid", "failed"));
  check("paid → paid zakázáno (idempotence)", !canTransition("paid", "paid"));
  check("refunded je koncový", !canTransition("refunded", "paid"));
  check("failed → paid povoleno (druhý pokus)", canTransition("failed", "paid"));
}

console.log("\nČíslo objednávky");
{
  check("formát 2026-0001", formatOrderNumber(2026, 1) === "2026-0001");
  check("formát 2026-0042", formatOrderNumber(2026, 42) === "2026-0042");
  check("nepřeteče nad 9999", formatOrderNumber(2026, 12345) === "2026-12345");
}

console.log(`\n${passed} prošlo, ${failed} selhalo\n`);
process.exit(failed === 0 ? 0 : 1);
