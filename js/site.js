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
    `<a href="products.html" class="cat-btn all-link">Všechny produkty</a>`;

  panelsHost.innerHTML = CATEGORIES.map(
    (cat) => `
    <div class="mega-panel" id="mega-${cat.id}">
      <div class="container mega-grid">
        ${cat.groups
          .map(
            (g) => `
          <div class="mega-col">
            <h5>${g.label}</h5>
            <ul>${g.items.map((it) => `<li><a href="products.html?category=${cat.id}&franchise=${encodeURIComponent(it)}">${it}</a></li>`).join("")}</ul>
          </div>`
          )
          .join("")}
        <div class="mega-col">
          <h5>&nbsp;</h5>
          <ul><li><a href="products.html?category=${cat.id}" style="font-weight:700;color:var(--accent-dark);">Zobrazit vše →</a></li></ul>
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

function cardHTML(p) {
  const soldOut = p.stock === 0;
  const stamp = soldOut
    ? '<span class="card-stamp out">Vyprodáno</span>'
    : p.stock <= 6
    ? `<span class="card-stamp">Poslední ${p.stock} ks</span>`
    : "";
  return `
    <a href="product.html?id=${p.id}" class="card">
      <div class="card-media" style="${franchiseStyle(p.franchise)}">
        ${stamp}
        <span class="card-media-label">${p.name}</span>
      </div>
      <div class="card-body">
        <div class="card-kicker">${p.franchise} / ${p.type}</div>
        <div class="card-title">${p.name}</div>
        <div class="card-bottom">
          <div class="price">${formatPrice(p.price)}${p.compareAt ? `<small>${formatPrice(p.compareAt)}</small>` : ""}</div>
          <button class="card-add" ${soldOut ? "disabled" : ""} onclick="event.preventDefault();addToCart('${p.id}');" aria-label="Přidat do košíku">+</button>
        </div>
      </div>
    </a>`;
}

async function initSite() {
  await Promise.all([loadPartial("site-header", "partials/header.html"), loadPartial("site-footer", "partials/footer.html")]);
  buildNav();
  if (typeof updateCartBadge === "function") updateCartBadge();

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.value.trim()) {
        window.location.href = "products.html?q=" + encodeURIComponent(e.target.value.trim());
      }
    });
  }

  document.dispatchEvent(new CustomEvent("site:ready"));
}

document.addEventListener("DOMContentLoaded", initSite);
