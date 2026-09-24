# Serverová část (Cloudflare Worker)

`worker.js` je jediný vstupní bod. Spouští se **pouze pro `/api/*`** — to zařizuje
`run_worker_first` ve `wrangler.jsonc`. Všechno ostatní servíruje Cloudflare přímo
ze statických souborů, bez spuštění tohohle kódu.

Požadavky na statické soubory se **neúčtují ani nepočítají do limitu Workeru**;
platí se jen volání `/api/*`.

## Proč Workers a ne Pages

Cloudflare označuje Pages ve svém rozhraní za *legacy*. Stavět na tom novou
platební integraci by znamenalo ji do roka stěhovat znovu.

Přechod stál jen přepsání routingu — `server/order.js`, `db/schema.sql`
i generování `server/catalog.js` jsou na platformě nezávislé a zůstaly beze změny.

## Struktura

```
src/worker.js        vstupní bod, routing /api/*
server/order.js      validace košíku, stavy objednávky  (testuje tools/test-order.js)
server/catalog.js    generovaný katalog pro ověřování cen
db/schema.sql        schéma D1
wrangler.jsonc       konfigurace Workeru a statických souborů
.assetsignore        co se nemá nahrávat jako veřejný soubor
```

Workers **nemají souborový systém** — `fs.readFile()` tu neexistuje. Data se
importují jako moduly a zabalí se do bundlu při deploy.

## Plánované routy

| Route | Metoda | Co dělá |
|---|---|---|
| `/api/health` | GET | ✅ hotovo — kontrola, že Worker běží a vidí katalog |
| `/api/checkout` | POST | Ověří košík, založí objednávku, vytvoří platbu, vrátí URL brány |
| `/api/payment-notify` | POST | Webhook od GoPay — ověří stav platby a posune objednávku |
| `/api/order/:token` | GET | Stav objednávky pro návratovou stránku |

Platební routy zatím neexistují ani jako prázdné slupky — dokud nejsou hotové,
je poctivější vracet 404 než něco, co vypadá funkčně.

## Tři pravidla, která se neporušují

**1. Ceny se neberou od klienta.**
Z prohlížeče přijímáme jen `{id, qty}`. Cenu vždy dohledá `validateCart()`
v `server/catalog.js`. Ověřeno testem „podvržená cena je ignorována".

**2. Webhooku se nevěří.**
Notifikace od brány je *signál, že se něco stalo* — ne doklad o zaplacení.
Server si musí sám vyžádat stav platby přes API brány a rozhodnout podle
odpovědi. Každé volání se loguje do `payment_events`.

**3. Zpracování je idempotentní.**
Brány doručují notifikace opakovaně a klidně mimo pořadí. Před každou změnou
stavu se ptáme `canTransition()` — mimo jiné proto, aby pozdě doručená `failed`
notifikace nepřepsala objednávku, která už je `paid`.

## Tajemství

`GOPAY_CLIENT_SECRET` a spol. patří **výhradně do Secrets** v nastavení Workeru
(dashboard → Settings → Variables and Secrets, typ Secret).

Nikdy do `wrangler.jsonc` ani do jiného souboru v repozitáři. Repozitář je
veřejný.

## Lokální vývoj

```bash
npx wrangler dev      # spustí Worker i statické soubory lokálně
npm run test          # testy validace košíku
npm run build         # přegeneruje produktové stránky a katalog
```
