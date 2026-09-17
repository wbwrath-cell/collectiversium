// Sdílený header/footer + mega menu. Načítá partials a staví navigaci z CATEGORIES (data.js).

async function loadPartial(elId, url) {
  const el = document.getElementById(elId);
  if (!el) return;
  const res = await fetch(url);
  el.innerHTML = await res.text();
}

function buildNav() {
  const bar = document.getElementById("cat-bar");
  const panelsHost = document.getElementById("mega-panels");
  if (!bar || !panelsHost) return;

  bar.innerHTML =
    CATEGORIES.map((cat) => `<button class="cat-btn" data-cat="${cat.id}">${cat.label} <span class="car">▾</span></button>`).join("") +
    `<a href="/products.html" class="cat-btn all-link">Všechny produkty</a>`;

  panelsHost.innerHTML = CATEGORIES.map(
    (cat) => `
    <div class="mega-panel" id="mega-${cat.id}">
      <div class="container mega-grid">
        ${cat.groups
          .map(
            (g) => `
          <div class="mega-col">
            <h5>${g.label}</h5>
            <ul>${g.items.map((it) => `<li><a href="/products.html?category=${cat.id}&franchise=${encodeURIComponent(it)}">${it}</a></li>`).join("")}</ul>
          </div>`
          )
          .join("")}
        <div class="mega-col">
          <h5>&nbsp;</h5>
          <ul><li><a href="/products.html?category=${cat.id}" style="font-weight:700;color:var(--accent-dark);">Zobrazit vše →</a></li></ul>
        </div>
      </div>
    </div>`
  ).join("");

  const backdrop = document.getElementById("mega-backdrop");

  function closeAll() {
    document.querySelectorAll(".mega-panel.open").forEach((p) => p.classList.remove("open"));
    document.querySelectorAll(".cat-btn.open").forEach((b) => b.classList.remove("open"));
    backdrop.classList.remove("open");
  }

  bar.querySelectorAll(".cat-btn[data-cat]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.cat;
      const panel = document.getElementById("mega-" + id);
      const isOpen = panel.classList.contains("open");
      closeAll();
      if (!isOpen) {
        panel.classList.add("open");
        btn.classList.add("open");
        backdrop.classList.add("open");
      }
    });
  });

  backdrop.addEventListener("click", closeAll);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });
}

// Produkty bez Revolut odkazu nemají funkční pokladnu — místo slepého košíku
// je posíláme na e-mail s předvyplněným předmětem.
const CONTACT_EMAIL = "hello@collectiversium.cz";

function contactMailto(p) {
  return "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent("Objednávka: " + p.name);
}

function productUrl(p) {
  return "/produkt/" + p.id + ".html";
}

function cardHTML(p) {
  const soldOut = p.stock === 0;
  const noPrice = p.price == null && !p.buyLink;
  const unavailable = soldOut || noPrice;
  const stamp = soldOut
    ? '<span class="card-stamp out">Vyprodáno</span>'
    : noPrice
    ? '<span class="card-stamp">Cena na dotaz</span>'
    : p.stock <= 6
    ? `<span class="card-stamp">Poslední ${p.stock} ks</span>`
    : "";
  const addBtn = p.buyLink
    ? `<button class="card-add" onclick="event.preventDefault();window.open('${p.buyLink}','_blank');" aria-label="Koupit">+</button>`
    : `<button class="card-add" ${soldOut ? "disabled" : ""} onclick="event.preventDefault();window.location.href='${contactMailto(p)}';" aria-label="Napsat pro objednávku">✉</button>`;
  const media = p.image
    ? `<img src="/${p.image}" alt="${p.name}" loading="lazy" />`
    : `<span class="card-media-label">${p.name}</span>`;
  return `
    <a href="${productUrl(p)}" class="card">
      <div class="card-media${p.image ? " has-photo" : ""}" style="${p.image ? "" : franchiseStyle(p.franchise)}">
        ${stamp}
        ${media}
      </div>
      <div class="card-body">
        <div class="card-kicker">${p.franchise} / ${p.type}</div>
        <div class="card-title">${p.name}</div>
        <div class="card-bottom">
          <div class="price">${formatPrice(p.price)}</div>
          ${addBtn}
        </div>
      </div>
    </a>`;
}

const COOKIE_CONSENT_KEY = "cardshop_cookie_consent_v1";

function getCookieConsent() {
  try { return JSON.parse(localStorage.getItem(COOKIE_CONSENT_KEY)); } catch { return null; }
}

function setCookieConsent(analytics, marketing) {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ analytics, marketing, ts: Date.now() }));
  document.getElementById("cookie-banner")?.setAttribute("hidden", "");
}

function initCookieBanner() {
  const banner = document.createElement("div");
  banner.id = "cookie-banner";
  banner.className = "cookie-banner";
  banner.innerHTML = `
    <div class="cookie-main">
      <p>Nezbytné cookies potřebujeme pro chod webu (např. aby fungoval košík) — ty běží vždy. Analytické a marketingové cookies použijeme jen tehdy, pokud nám k tomu dáte souhlas. Podrobnosti najdete v <a href="/ochrana-osobnich-udaju.html">zásadách ochrany osobních údajů</a>.</p>
      <div class="cookie-actions">
        <button class="btn cookie-btn" id="cookie-reject">Odmítnout vše</button>
        <button class="btn cookie-btn" id="cookie-accept">Přijmout vše</button>
        <button class="btn cookie-btn cookie-btn-alt" id="cookie-customize">Nastavit podrobně</button>
      </div>
    </div>
    <div class="cookie-detail" id="cookie-detail" hidden>
      <label class="cookie-cat">
        <input type="checkbox" checked disabled />
        <span><strong>Nezbytné</strong> — bez nich web nefunguje (košík, uložené nastavení souhlasu). Nelze vypnout.</span>
      </label>
      <label class="cookie-cat">
        <input type="checkbox" id="cookie-cat-analytics" />
        <span><strong>Analytické</strong> — anonymní statistiky návštěvnosti, které nám pomáhají web zlepšovat.</span>
      </label>
      <label class="cookie-cat">
        <input type="checkbox" id="cookie-cat-marketing" />
        <span><strong>Marketingové</strong> — měření účinnosti reklamy a personalizace nabídek.</span>
      </label>
      <button class="btn cookie-btn" id="cookie-save">Uložit volbu</button>
    </div>`;
  document.body.appendChild(banner);

  const detail = banner.querySelector("#cookie-detail");
  banner.querySelector("#cookie-accept").addEventListener("click", () => setCookieConsent(true, true));
  banner.querySelector("#cookie-reject").addEventListener("click", () => setCookieConsent(false, false));
  banner.querySelector("#cookie-customize").addEventListener("click", () => { detail.hidden = !detail.hidden; });
  banner.querySelector("#cookie-save").addEventListener("click", () =>
    setCookieConsent(
      banner.querySelector("#cookie-cat-analytics").checked,
      banner.querySelector("#cookie-cat-marketing").checked
    )
  );

  if (getCookieConsent()) banner.setAttribute("hidden", "");

  const settingsLink = document.getElementById("cookie-settings-link");
  if (settingsLink) {
    settingsLink.addEventListener("click", (e) => {
      e.preventDefault();
      const saved = getCookieConsent();
      if (saved) {
        banner.querySelector("#cookie-cat-analytics").checked = !!saved.analytics;
        banner.querySelector("#cookie-cat-marketing").checked = !!saved.marketing;
      }
      detail.hidden = false;
      banner.removeAttribute("hidden");
    });
  }
}

async function initSite() {
  await Promise.all([loadPartial("site-header", "/partials/header.html"), loadPartial("site-footer", "/partials/footer.html")]);
  buildNav();
  initCookieBanner();
  if (typeof updateCartBadge === "function") updateCartBadge();

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.value.trim()) {
        window.location.href = "/products.html?q=" + encodeURIComponent(e.target.value.trim());
      }
    });
  }

  document.dispatchEvent(new CustomEvent("site:ready"));
}

document.addEventListener("DOMContentLoaded", initSite);
