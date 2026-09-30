// Objednávkový formulář (/objednavka.html) — DOČASNÉ řešení, než projde
// platební brána.
//
// Objednávka se nikam neukládá: odejdou dva e-maily přes EmailJS
// (https://www.emailjs.com) ze schránky hello@ — jeden na hello@ s celou
// objednávkou (odtud ji přepošleme na supply@), druhý zákazníkovi se shrnutím. Platbu pak posíláme ručně jako individuální odkaz.
//
// Šablony obou e-mailů jsou v tools/emailjs/ — v EmailJS se vkládají ručně.

(() => {
const EMAILJS = {
  // Veřejný klíč a ID nejsou tajemství — EmailJS je navržený tak, že
  // žijí přímo v kódu stránky. (Account → General, Email Services, Email Templates)
  publicKey: "op-xm5FypNOD9oUBP",
  serviceId: "service_mj0l0s9",
  shopTemplateId: "template_y4wx2n7", // objednávka pro nás (na hello@)
  customerTemplateId: "template_zppmom7", // potvrzení zákazníkovi
};
const EMAILJS_URL = "https://api.emailjs.com/api/v1.0/email/send";

const MAX_QTY = 10;
const NOTE_MAX = 500;

// Nabídka = aktivní produkty s cenou. Stejné pravidlo jako isPurchasable() v build.js.
function orderableProducts() {
  return activeProducts().filter((p) => p.price != null);
}

// ---------------------------------------------------------------------------
// Pomocné
// ---------------------------------------------------------------------------

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function orderNumber() {
  // CV-260927-4821. Bez databáze není pořadové číslo, proto datum + 4 náhodné
  // číslice — pro pár objednávek denně bohatě stačí na rozlišení.
  const d = new Date();
  const ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
  const rnd = String(crypto.getRandomValues(new Uint16Array(1))[0] % 10000).padStart(4, "0");
  return `CV-${ymd}-${rnd}`;
}

function formatDateTime(d) {
  return d.toLocaleString("cs-CZ", { dateStyle: "medium", timeStyle: "short" });
}

// ---------------------------------------------------------------------------
// Položky
// ---------------------------------------------------------------------------

const qty = {}; // id → počet kusů

function renderItems() {
  const list = $("order-items");
  list.innerHTML = "";
  for (const p of orderableProducts()) {
    const li = document.createElement("li");
    li.className = "order-item";
    li.dataset.id = p.id;

    const thumb = document.createElement("a");
    thumb.href = productUrl(p);
    thumb.target = "_blank";
    thumb.className = "order-thumb";
    if (p.image) {
      const img = document.createElement("img");
      img.src = "/" + p.image;
      img.alt = "";
      img.loading = "lazy";
      thumb.appendChild(img);
    } else {
      thumb.setAttribute("style", franchiseStyle(p.franchise));
    }

    const info = document.createElement("div");
    info.className = "order-item-info";
    const name = document.createElement("span");
    name.className = "order-item-name";
    name.textContent = p.name;
    const price = document.createElement("span");
    price.className = "order-item-price";
    price.textContent = formatPrice(p.price);
    info.append(name, price);

    const box = document.createElement("div");
    box.className = "qty-box";
    box.innerHTML = `<button type="button" data-step="-1" aria-label="Ubrat">−</button><input type="text" inputmode="numeric" value="0" /><button type="button" data-step="1" aria-label="Přidat">+</button>`;
    box.querySelector("input").setAttribute("aria-label", "Počet kusů – " + p.name);

    li.append(thumb, info, box);
    list.appendChild(li);
    qty[p.id] = 0;
  }

  list.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-step]");
    if (!btn) return;
    const id = btn.closest(".order-item").dataset.id;
    const next = (qty[id] || 0) + Number(btn.dataset.step);
    if (next > MAX_QTY) {
      showItemsError(`Víc než ${MAX_QTY} kusů najednou tudy neobjednáte – napište nám a domluvíme se`);
      return;
    }
    setItemQty(id, Math.max(0, next));
  });

  list.addEventListener("input", (e) => {
    if (e.target.tagName !== "INPUT") return;
    const id = e.target.closest(".order-item").dataset.id;
    const n = parseInt(e.target.value, 10);
    qty[id] = Number.isInteger(n) && n > 0 ? n : 0;
    refreshItem(id, false);
  });

  list.addEventListener("focusout", (e) => {
    if (e.target.tagName !== "INPUT") return;
    refreshItem(e.target.closest(".order-item").dataset.id, true);
  });
}

function setItemQty(id, n) {
  qty[id] = n;
  refreshItem(id, true);
}

function refreshItem(id, writeInput) {
  const li = document.querySelector(`.order-item[data-id="${CSS.escape(id)}"]`);
  if (!li) return;
  if (writeInput) li.querySelector("input").value = qty[id];
  li.classList.toggle("is-selected", qty[id] > 0);
  updateTotal();
  if (submittedOnce) validateItems();
}

function selectedItems() {
  return orderableProducts()
    .filter((p) => qty[p.id] > 0)
    .map((p) => ({ id: p.id, name: p.name, unitPrice: p.price, qty: qty[p.id], lineTotal: p.price * qty[p.id] }));
}

function updateTotal() {
  const total = selectedItems().reduce((s, i) => s + i.lineTotal, 0);
  $("order-total").textContent = formatPrice(total);
}

function showItemsError(msg) {
  const el = $("err-items");
  el.textContent = msg;
  el.hidden = false;
}

// ---------------------------------------------------------------------------
// Validace
// ---------------------------------------------------------------------------

let submittedOnce = false;

function setFieldError(inputId, errId, bad) {
  const input = $(inputId);
  if (input) {
    input.classList.toggle("is-invalid", bad);
    input.setAttribute("aria-invalid", bad ? "true" : "false");
  }
  $(errId).hidden = !bad;
  return !bad;
}

function deliveryMethod() {
  return document.querySelector('input[name="delivery"]:checked')?.value || "";
}

// Doručujeme jen přes Zásilkovnu — do Z-BOXu, nebo na výdejní místo
// (viz čl. 4 obchodních podmínek). Obojí se vybírá stejným polem.
const DELIVERY = {
  zbox: { method: "Do Z-BOXu", label: "Který Z-BOX", error: "Vyberte Z-BOX, kam vám balík pošleme" },
  point: { method: "Na výdejní místo", label: "Které výdejní místo", error: "Vyberte výdejní místo, kam vám balík pošleme" },
};

function validateItems() {
  const items = selectedItems();
  const tooMany = orderableProducts().some((p) => qty[p.id] > MAX_QTY);
  let msg = "";
  if (tooMany) msg = `Víc než ${MAX_QTY} kusů najednou tudy neobjednáte – napište nám a domluvíme se`;
  else if (!items.length) msg = "Aspoň jeden kus to být musí";
  $("err-items").textContent = msg;
  $("err-items").hidden = !msg;
  $("order-items").classList.toggle("is-invalid", Boolean(msg));
  return !msg;
}

const val = (id) => $(id).value.trim();

const FIELD_RULES = {
  "of-name": ["err-name", () => /\S+\s+\S+/.test(val("of-name"))],
  "of-email": ["err-email", () => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val("of-email"))],
  "of-phone": ["err-phone", () => /^(\+|00)?(42[01])?\d{9}$/.test(val("of-phone").replace(/[\s\-().]/g, ""))],
  "of-point": ["err-point", () => !deliveryMethod() || val("of-point").length >= 3],
  "of-note": ["err-note", () => $("of-note").value.length <= NOTE_MAX],
};

function validateField(id) {
  const [errId, ok] = FIELD_RULES[id];
  return setFieldError(id, errId, !ok());
}

function validateDelivery() {
  const ok = Boolean(deliveryMethod());
  $("err-delivery").hidden = ok;
  document.querySelector(".order-delivery").classList.toggle("is-invalid", !ok);
  return ok;
}

function validateConsent() {
  return setFieldError("of-consent", "err-consent", !$("of-consent").checked);
}

function validateAll() {
  const results = [
    validateItems(),
    ...Object.keys(FIELD_RULES).map(validateField),
    validateDelivery(),
    validateConsent(),
  ];
  return results.every(Boolean);
}

function focusFirstError() {
  const first = document.querySelector("#order-form .field-error:not([hidden])");
  if (!first) return;
  // Na obrazovku patří hláška (u položek je až pod seznamem), fokus dostane
  // pole, ke kterému se vztahuje.
  first.scrollIntoView({ behavior: "smooth", block: "center" });
  const section = first.closest(".field, .form-box");
  const target = section?.querySelector("input.is-invalid, textarea.is-invalid, input, textarea");
  if (target) target.focus({ preventScroll: true });
}

// ---------------------------------------------------------------------------
// Doprava
// ---------------------------------------------------------------------------

function onDeliveryChange() {
  const d = DELIVERY[deliveryMethod()];
  $("panel-point").hidden = !d;
  if (d) {
    $("label-point").textContent = d.label;
    $("err-point").textContent = d.error;
  }
  if (submittedOnce) {
    validateDelivery();
    validateField("of-point");
  }
}

function deliveryText() {
  return { method: DELIVERY[deliveryMethod()].method, detail: val("of-point") };
}

// ---------------------------------------------------------------------------
// Odeslání
// ---------------------------------------------------------------------------

const MSG = {
  invalid: "Něco ve formuláři ještě nesedí – podívejte se na červeně označená pole.",
  failed: "Objednávka se neodeslala. Zkuste to prosím ještě jednou.",
  offline: "Vypadá to, že vypadl internet. Zkontrolujte připojení a zkuste to znovu – nic z vyplněného se neztratilo.",
  server: "U nás se něco zadrhlo a objednávka se neuložila. Zkuste to prosím za chvilku znovu.",
};

class SendError extends Error {
  constructor(kind, detail) {
    super(detail);
    this.kind = kind; // "offline" | "server" | "failed"
  }
}

async function sendEmail(templateId, params) {
  if (!EMAILJS.publicKey || !EMAILJS.serviceId || !templateId) {
    throw new SendError("failed", "EmailJS není nastavené (js/order-form.js, konstanta EMAILJS).");
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    let res;
    try {
      res = await fetch(EMAILJS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS.serviceId,
          template_id: templateId,
          user_id: EMAILJS.publicKey,
          template_params: params,
        }),
      });
    } catch (err) {
      throw new SendError("offline", String(err));
    }
    if (res.ok) return;
    const text = await res.text().catch(() => "");
    // EmailJS pustí 1 požadavek za sekundu — při souběhu dvou zákazníků
    // jednou počkáme a zkusíme znovu.
    if (res.status === 429 && attempt === 0) {
      await sleep(1500);
      continue;
    }
    throw new SendError(res.status >= 500 ? "server" : "failed", `HTTP ${res.status} ${text}`);
  }
}

function buildParams(number, consentAt) {
  const items = selectedItems();
  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  const d = deliveryText();
  const itemsText = items
    .map((i) => `${i.qty}× ${i.name} — ${formatPrice(i.lineTotal)}${i.qty > 1 ? ` (${formatPrice(i.unitPrice)}/ks)` : ""}`)
    .join("\n");
  const itemsWithIds = items.map((i) => `${i.qty}× ${i.name} [${i.id}] — ${formatPrice(i.lineTotal)}`).join("\n");
  const note = $("of-note").value.trim();

  return {
    order_number: number,
    customer_name: val("of-name"),
    customer_email: val("of-email"),
    customer_phone: val("of-phone"),
    delivery_method: d.method,
    delivery_detail: d.detail,
    items_text: itemsText,
    items_with_ids: itemsWithIds,
    total: formatPrice(total),
    note: note || "—",
    consent_at: formatDateTime(consentAt),
    created_at: formatDateTime(new Date()),
  };
}

let sending = false;

async function onSubmit(e) {
  e.preventDefault();
  if (sending) return;
  submittedOnce = true;

  const errForm = $("err-form");
  if (!validateAll()) {
    errForm.textContent = MSG.invalid;
    errForm.hidden = false;
    focusFirstError();
    return;
  }
  errForm.hidden = true;

  const number = orderNumber();

  // Robot vyplnil honeypot: tváříme se, že vše prošlo, ale nic neposíláme.
  if ($("of-web").value) {
    showThanks(number);
    return;
  }

  if (navigator.onLine === false) {
    errForm.textContent = MSG.offline;
    errForm.hidden = false;
    return;
  }

  sending = true;
  const btn = $("of-submit");
  btn.disabled = true;
  btn.textContent = "Odesílám…";

  const params = buildParams(number, consentAt || new Date());

  try {
    // 1) Objednávka k nám. Když tohle projde, objednávka existuje.
    await sendEmail(EMAILJS.shopTemplateId, params);
  } catch (err) {
    console.error("Objednávku se nepodařilo odeslat:", err);
    errForm.textContent = MSG[err.kind] || MSG.failed;
    errForm.hidden = false;
    btn.disabled = false;
    btn.textContent = "Objednat";
    sending = false;
    return;
  }

  // 2) Shrnutí zákazníkovi. Limit EmailJS je 1 požadavek/s, proto pauza.
  // Když tohle selže, objednávka už u nás je — zákazníka tím nestrašíme,
  // odpovíme mu ručně.
  try {
    await sleep(1100);
    await sendEmail(EMAILJS.customerTemplateId, params);
  } catch (err) {
    console.warn("Shrnutí zákazníkovi se neodeslalo (objednávka ale dorazila):", err);
  }

  showThanks(number);
}

function showThanks(number) {
  $("order-form").hidden = true;
  $("thanks-number").textContent = number;
  $("order-thanks").hidden = false;
  document.title = "Díky, máme to! – Collectiversium";
  window.scrollTo({ top: 0 });
}

// Kdy přesně zákazník zaškrtl souhlas — posíláme s objednávkou jako doklad.
let consentAt = null;

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

function init() {
  renderItems();

  // Předvybraná položka z tlačítka "Objednat" u produktu.
  const wanted = new URLSearchParams(location.search).get("id");
  if (wanted) {
    if (qty[wanted] !== undefined) {
      setItemQty(wanted, 1);
      // Ať ji zákazník vidí hned nahoře, ne někde uprostřed seznamu.
      const li = document.querySelector(`.order-item[data-id="${CSS.escape(wanted)}"]`);
      li.parentNode.prepend(li);
    } else {
      $("order-missing").hidden = false;
    }
  }
  updateTotal();

  document.querySelectorAll('input[name="delivery"]').forEach((r) => r.addEventListener("change", onDeliveryChange));

  for (const id of Object.keys(FIELD_RULES)) {
    $(id).addEventListener("input", () => submittedOnce && validateField(id));
  }
  $("of-consent").addEventListener("change", () => {
    consentAt = $("of-consent").checked ? new Date() : null;
    if (submittedOnce) validateConsent();
  });

  $("order-form").addEventListener("submit", onSubmit);
}

init();
})();
