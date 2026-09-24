// Serverová část e-shopu.
//
// Worker se spouští POUZE pro /api/* — viz run_worker_first ve wrangler.jsonc.
// Všechno ostatní (HTML, CSS, obrázky) servíruje Cloudflare přímo ze
// statických souborů, bez spuštění tohohle kódu a bez účtování.
//
// Platební endpointy zatím neexistují — čekají na přístupy do sandboxu
// GoPay. Záměrně tu nejsou ani jako prázdné slupky; dokud nejsou hotové,
// je poctivější vracet 404 než něco, co vypadá funkčně.

import { CATALOG, GENERATED_AT } from "../server/catalog.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Odpovědi API se nikdy nekešují — jde o stav objednávek a plateb.
      "cache-control": "no-store",
    },
  });
}

const routes = {
  // Kontrola, že Worker běží a vidí serverový katalog. Nic citlivého
  // nevrací — katalog je stejně veřejný, jede i do prohlížeče.
  "GET /api/health": () =>
    json({
      ok: true,
      catalogItems: Object.keys(CATALOG).length,
      catalogGeneratedAt: GENERATED_AT,
      time: new Date().toISOString(),
    }),
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const handler = routes[`${request.method} ${url.pathname}`];

    if (!handler) {
      return json({ ok: false, error: "Neznámý endpoint." }, 404);
    }

    try {
      return await handler(request);
    } catch (err) {
      // Detail chyby ven neposíláme — do logu ano, klientovi ne.
      console.error("Chyba v", url.pathname, err);
      return json({ ok: false, error: "Vnitřní chyba serveru." }, 500);
    }
  },
};
