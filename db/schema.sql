-- Schéma databáze objednávek (Cloudflare D1 / SQLite).
--
-- Konvence:
--   * Peníze v CELÝCH KORUNÁCH jako INTEGER. Všechny ceny v katalogu jsou celé.
--     Převod na haléře (×100) se dělá až na hranici s GoPay, nikde jinde.
--     Žádné float — u peněz nikdy.
--   * Časy jako ISO 8601 text v UTC ('2026-09-24T13:26:45Z'). SQLite nemá
--     nativní datetime a text je čitelný i při ručním dotazu.
--
-- Aplikace:  wrangler d1 execute <db> --file=db/schema.sql

-- ---------------------------------------------------------------------------
-- Objednávky
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  -- Pořadové číslo přiděluje databáze; z něj se skládá číslo objednávky.
  seq               INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Interní UUID. Nikdy se neobjeví v URL.
  id                TEXT    NOT NULL UNIQUE,
  -- Lidsky čitelné číslo pro zákazníka a doklad, např. '2026-0001'.
  order_number      TEXT    NOT NULL UNIQUE,
  -- Náhodný token do URL návratové stránky. Odděluje veřejný identifikátor
  -- od interního, aby šel v případě potřeby zneplatnit.
  public_token      TEXT    NOT NULL UNIQUE,

  -- pending | paid | failed | cancelled | refunded  (viz server/order.js)
  status            TEXT    NOT NULL DEFAULT 'pending',

  -- Součet položek v celých Kč. Doprava je zahrnutá v ceně zboží,
  -- proto tu není zvlášť; kdyby se to změnilo, přibude sloupec shipping_czk.
  total_czk         INTEGER NOT NULL,

  -- Zákazník
  customer_email    TEXT    NOT NULL,
  customer_name     TEXT    NOT NULL,
  customer_phone    TEXT,

  -- Doručení. Zatím jeden dopravce a štítky ručně, ale sloupce jsou
  -- připravené i na výdejní místa (delivery_point_id).
  delivery_method   TEXT    NOT NULL,
  delivery_point_id TEXT,
  delivery_street   TEXT,
  delivery_city     TEXT,
  delivery_zip      TEXT,
  delivery_country  TEXT    NOT NULL DEFAULT 'CZ',
  customer_note     TEXT,

  -- Souhlas s obchodními podmínkami — kdy přesně byl udělen.
  -- Důkaz pro případný spor, ne dekorace.
  terms_accepted_at TEXT    NOT NULL,

  -- Platba
  gopay_payment_id  TEXT,
  gopay_state       TEXT,

  created_at        TEXT    NOT NULL,
  updated_at        TEXT    NOT NULL,
  paid_at           TEXT,

  CHECK (status IN ('pending','paid','failed','cancelled','refunded')),
  CHECK (total_czk > 0)
);

-- Webhook od brány dorazí s ID platby — musí být rychle dohledatelné.
CREATE INDEX IF NOT EXISTS idx_orders_gopay ON orders (gopay_payment_id);
-- Návratová stránka zákazníka.
CREATE INDEX IF NOT EXISTS idx_orders_token ON orders (public_token);
-- Výpis v administraci.
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders (status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Položky objednávky
-- ---------------------------------------------------------------------------
-- Název i cena se ukládají jako SNAPSHOT v okamžiku objednání. Když se
-- později změní katalog, objednávka i doklad musí dál ukazovat, co si
-- zákazník doopravdy koupil a za kolik.
CREATE TABLE IF NOT EXISTS order_items (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id       TEXT    NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id     TEXT    NOT NULL,
  product_name   TEXT    NOT NULL,
  unit_price_czk INTEGER NOT NULL,
  qty            INTEGER NOT NULL,
  line_total_czk INTEGER NOT NULL,

  CHECK (qty > 0),
  CHECK (unit_price_czk >= 0)
);

CREATE INDEX IF NOT EXISTS idx_items_order ON order_items (order_id);

-- ---------------------------------------------------------------------------
-- Audit plateb
-- ---------------------------------------------------------------------------
-- Každé volání webhooku a každý dotaz na stav platby se sem zapíše.
-- Bez tohohle se problém s platbou ladí velmi špatně — a u peněz je
-- potřeba umět zpětně doložit, co se kdy stalo.
CREATE TABLE IF NOT EXISTS payment_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      TEXT,
  gopay_payment_id TEXT,
  -- 'notify' = příchozí webhook, 'poll' = náš dotaz na stav platby
  source        TEXT    NOT NULL,
  -- Stav hlášený bránou.
  reported_state TEXT,
  -- Surová odpověď brány, pro pozdější dohledání.
  raw           TEXT,
  created_at    TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_order ON payment_events (order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_payment ON payment_events (gopay_payment_id);
