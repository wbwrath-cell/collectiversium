# Cloudflare Pages Functions

Serverová část e-shopu. Každý soubor v tomhle adresáři je route — `functions/api/checkout.js`
obsluhuje `POST /api/checkout`.

## Proč je sdílený kód mimo tenhle adresář

Routing v Pages Functions mapuje soubory na cesty a dokumentace jednoznačně neříká,
jak se chovají soubory s podtržítkem na začátku. Místo hádání je veškerá sdílená
logika v `../server/` — tam se na routing ptát nemusíme a funkce si ji naimportují:

```js
import { validateCart } from "../../server/order.js";
import { CATALOG } from "../../server/catalog.js";
```

Pages importy zabalí do bundlu, takže se nic nenačítá za běhu. To je podstatné:
**Workers nemají souborový systém**, `fs.readFile()` tu neexistuje.

## Plánované routy

| Route | Metoda | Co dělá |
|---|---|---|
| `api/checkout.js` | POST | Ověří košík proti katalogu, založí objednávku, vytvoří platbu u GoPay, vrátí URL brány |
| `api/payment-notify.js` | POST | Webhook od GoPay — ověří stav platby a posune objednávku |
| `api/order/[token].js` | GET | Stav objednávky pro návratovou stránku zákazníka |

## Tři pravidla, která se neporušují

**1. Ceny se neberou od klienta.**
Z prohlížeče přijímáme jen `{id, qty}`. Cenu vždy dohledá `validateCart()`
v `server/catalog.js`. Otestováno v `tools/test-order.js`.

**2. Webhooku se nevěří.**
Když GoPay zavolá `payment-notify`, notifikace je jen *signál, že se něco stalo* —
není to doklad o zaplacení. Server si musí sám vyžádat stav platby přes GoPay API
a rozhodnout podle odpovědi. Každé volání se loguje do `payment_events`.

**3. Zpracování je idempotentní.**
Brány doručují notifikace opakovaně. Před každou změnou stavu se ptáme
`canTransition()` — mimo jiné proto, aby pozdě doručená `failed` notifikace
nepřepsala objednávku, která už je `paid`.

## Tajemství

`GOPAY_CLIENT_SECRET` a spol. patří **výhradně do proměnných prostředí Cloudflare**
(Pages → Settings → Environment variables, označit jako Secret).

Nikdy do souboru v repozitáři. Všechno v tomhle adresáři i v `server/` je veřejně
čitelné — repozitář je public a kořen repozitáře je zároveň kořen webu.

## Otevřené body

- [ ] Ověřit, co přesně Pages servíruje staticky z kořene. `db/schema.sql`,
      `server/*.js` a `tools/*.js` jsou teď veřejně čitelné. Nic tajného tam není,
      ale je to neuklizené — vyřešit při nastavování Pages (`_routes.json`,
      nebo přesun webu do podadresáře).
- [ ] Doplnit implementaci rout podle aktuální dokumentace GoPay
      (endpointy a tvar payloadu číst z jejich dokumentace, ne po paměti).
