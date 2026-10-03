// Košík přes localStorage — bez backendu, jen pro účely prototypu.

const CART_KEY = "cardshop_cart_v1";

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(id, qty = 1) {
  const cart = readCart();
  cart[id] = (cart[id] || 0) + qty;
  writeCart(cart);
}

function setQty(id, qty) {
  const cart = readCart();
  if (qty <= 0) {
    delete cart[id];
  } else {
    cart[id] = qty;
  }
  writeCart(cart);
}

function removeFromCart(id) {
  const cart = readCart();
  delete cart[id];
  writeCart(cart);
}

function cartCount() {
  const cart = readCart();
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

function updateCartBadge() {
  const el = document.getElementById("cart-badge");
  if (!el) return;
  const n = cartCount();
  el.textContent = n;
  el.style.display = n > 0 ? "flex" : "none";
}

document.addEventListener("DOMContentLoaded", updateCartBadge);
