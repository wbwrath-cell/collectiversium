// Validace košíku a výpočet ceny objednávky.
//
// BEZPEČNOSTNÍ PRAVIDLO: ceny se NIKDY neberou od klienta. Cokoliv přijde
// z prohlížeče, se bere jen jako "seznam id a množství" — cena se vždy
// dohledá v serverovém katalogu (server/catalog.js, generovaný z js/data.js).
// Kdyby si někdo v konzoli přepsal 1099 na 1, projde to sem, ale výsledná
// částka se stejně spočítá z katalogu.
//
// Tenhle soubor záměrně nemá žádné závislosti na Cloudflare ani na síti,
// aby se dal testovat lokálně (tools/test-order.js).

// Kolik kusů jedné položky smí být v jedné objednávce. Prodáváme sběratelské
// kusy po jednom až pár, takhle vysoké číslo je jen pojistka proti nesmyslům.
export const MAX_QTY_PER_ITEM = 10;
// Kolik různých položek smí být v košíku.
export const MAX_DISTINCT_ITEMS = 20;

/**
 * Ověří košík proti katalogu a spočítá cenu.
 *
 * @param {unknown} rawItems  co přišlo od klienta — nedůvěřujeme ničemu
 * @param {Record<string, {name: string, price: number, stock: number}>} catalog
 * @returns {{ok: true, items: Array, total: number} | {ok: false, errors: string[]}}
 */
export function validateCart(rawItems, catalog) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { ok: false, errors: ["Košík je prázdný."] };
  }
  if (rawItems.length > MAX_DISTINCT_ITEMS) {
    return { ok: false, errors: ["Košík obsahuje příliš mnoho různých položek."] };
  }

  const errors = [];
  const items = [];
  const seen = new Set();

  for (const raw of rawItems) {
    const id = typeof raw?.id === "string" ? raw.id : null;
    if (!id) {
      errors.push("Položka bez identifikátoru produktu.");
      continue;
    }
    if (seen.has(id)) {
      errors.push(`Produkt ${id} je v košíku vícekrát.`);
      continue;
    }
    seen.add(id);

    // Katalog obsahuje jen prodejné produkty — draft položky a položky
    // bez ceny se do něj vůbec negenerují, takže tahle jedna podmínka
    // ošetří i pokus objednat něco, co není v nabídce.
    const product = catalog[id];
    if (!product) {
      errors.push(`Produkt ${id} není v nabídce.`);
      continue;
    }

    const qty = Number(raw.qty);
    if (!Number.isInteger(qty) || qty < 1) {
      errors.push(`${product.name}: neplatné množství.`);
      continue;
    }
    if (qty > MAX_QTY_PER_ITEM) {
      errors.push(`${product.name}: maximálně ${MAX_QTY_PER_ITEM} ks v jedné objednávce.`);
      continue;
    }
    if (qty > product.stock) {
      errors.push(
        product.stock === 0
          ? `${product.name}: momentálně vyprodáno.`
          : `${product.name}: skladem je pouze ${product.stock} ks.`
      );
      continue;
    }

    items.push({
      id,
      name: product.name,
      unitPrice: product.price, // vždy z katalogu
      qty,
      lineTotal: product.price * qty,
    });
  }

  if (errors.length) return { ok: false, errors };

  const total = items.reduce((sum, i) => sum + i.lineTotal, 0);
  if (!Number.isInteger(total) || total <= 0) {
    return { ok: false, errors: ["Neplatná celková částka objednávky."] };
  }

  return { ok: true, items, total };
}

/**
 * Ceny v katalogu i v databázi držíme v celých korunách (všechny jsou celé).
 * GoPay ale očekává částku v haléřích — převod patří výhradně na tuhle hranici.
 */
export function czkToHaler(czk) {
  if (!Number.isInteger(czk) || czk < 0) throw new Error(`Neplatná částka: ${czk}`);
  return czk * 100;
}

/**
 * Číslo objednávky pro zákazníka: 2026-0001.
 * Pořadové číslo přiděluje databáze, tohle jen formátuje.
 */
export function formatOrderNumber(year, seq) {
  return `${year}-${String(seq).padStart(4, "0")}`;
}

/** Povolené stavy objednávky. */
export const ORDER_STATES = Object.freeze({
  PENDING: "pending", // vytvořená, čeká na platbu
  PAID: "paid", // zaplaceno, potvrzeno u brány
  FAILED: "failed", // platba selhala
  CANCELLED: "cancelled", // zrušeno zákazníkem nebo timeoutem
  REFUNDED: "refunded", // vráceno
});

/**
 * Přechody, které dávají smysl. Webhook od brány může přijít opakovaně
 * i mimo pořadí, takže se na tohle ptáme před každou změnou stavu —
 * jinak by pozdní "failed" notifikace přepsala už zaplacenou objednávku.
 */
const ALLOWED_TRANSITIONS = {
  pending: ["paid", "failed", "cancelled"],
  paid: ["refunded"],
  failed: ["paid"], // zákazník může zkusit zaplatit znovu
  cancelled: ["paid"], // totéž
  refunded: [],
};

export function canTransition(from, to) {
  if (from === to) return false; // idempotence: stejný stav = není co dělat
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}
