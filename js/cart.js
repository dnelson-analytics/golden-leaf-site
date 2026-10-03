(function () {
  const KEY = "glp-cart-v1";
  const MAX_QTY = 99;

  function read() {
    try {
      const items = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(items) ? items.filter((i) => i && i.sku && i.qty > 0) : [];
    } catch (e) {
      return [];
    }
  }

  function write(items) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch (e) {
      /* storage blocked: the cart simply will not persist */
    }
    renderBadge();
  }

  function clamp(qty) {
    return Math.max(1, Math.min(MAX_QTY, Math.floor(Number(qty)) || 1));
  }

  function add(sku, qty) {
    const items = read();
    const found = items.find((i) => i.sku === sku);
    if (found) found.qty = clamp(found.qty + qty);
    else items.push({ sku, qty: clamp(qty) });
    write(items);
  }

  function setQty(sku, qty) {
    const items = read();
    const found = items.find((i) => i.sku === sku);
    if (found) found.qty = clamp(qty);
    write(items);
  }

  function remove(sku) {
    write(read().filter((i) => i.sku !== sku));
  }

  function count() {
    return read().reduce((n, i) => n + i.qty, 0);
  }

  function renderBadge() {
    const n = count();
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = n ? String(n) : "";
      el.hidden = !n;
    });
  }

  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 2 });

  window.GLPCart = { read, add, setQty, remove, count, renderBadge, money, MAX_QTY };
  document.addEventListener("DOMContentLoaded", renderBadge);
  window.addEventListener("storage", renderBadge);
})();
