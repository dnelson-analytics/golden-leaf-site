(function () {
  const root = document.getElementById("cart");
  const money = GLPCart.money;

  function el(tag, props, ...kids) {
    const node = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (v === true) node.setAttribute(k, "");
      else if (v !== false && v != null) node.setAttribute(k, v);
    });
    kids.flat().forEach((kid) => kid && node.append(kid));
    return node;
  }

  function render(variantBySku) {
    const lines = GLPCart.read().filter((i) => variantBySku[i.sku]);
    if (!lines.length) {
      root.replaceChildren(
        el("div", { class: "cart-empty" },
          el("h2", { text: "Your cart is empty" }),
          el("p", { text: "Add some gold leaf to get started." }),
          el("a", { class: "btn btn-gold", href: "product.html?p=22k-gold-leaf", text: "Shop 22k gold leaf" })));
      return;
    }

    let subtotal = 0;
    const rows = lines.map((line) => {
      const { product, variant } = variantBySku[line.sku];
      const lineTotal = variant.price * line.qty;
      subtotal += lineTotal;
      const qty = el("input", { type: "number", min: "1", max: String(GLPCart.MAX_QTY), value: String(line.qty), inputmode: "numeric", "aria-label": "Quantity for " + variant.name });
      qty.addEventListener("change", () => { GLPCart.setQty(line.sku, parseInt(qty.value, 10)); render(variantBySku); });
      const rm = el("button", { type: "button", class: "link-btn", text: "Remove" });
      rm.addEventListener("click", () => { GLPCart.remove(line.sku); render(variantBySku); });
      return el("li", { class: "cart-line" },
        el("div", { class: "cl-info" },
          el("a", { href: "product.html?p=" + product.id, text: variant.name }),
          el("small", { text: "SKU " + variant.sku + " · " + money.format(variant.price) + " each" })),
        el("label", { class: "qty" }, "Qty", qty),
        el("b", { class: "cl-total", text: money.format(lineTotal) }),
        rm);
    });

    const checkout = el("button", { type: "button", class: "btn btn-gold", disabled: true, text: "Checkout" });
    root.replaceChildren(
      el("ul", { class: "cart-lines" }, ...rows),
      el("div", { class: "cart-summary" },
        el("div", { class: "cs-row" }, el("span", { text: "Subtotal" }), el("b", { text: money.format(subtotal) })),
        el("p", { class: "fine", text: "Sales tax and shipping are worked out at checkout." }),
        checkout,
        el("p", { class: "fine", text: "Prototype: checkout and payment are built in a later step. Nothing is ordered or charged." })));
  }

  fetch("data/products.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => {
      const map = {};
      data.products.forEach((product) => product.variants.forEach((variant) => { if (!map[variant.sku]) map[variant.sku] = { product, variant }; }));
      render(map);
    })
    .catch(() => {
      root.replaceChildren(el("p", { class: "fine", text: "The cart could not load. If you opened this file directly, serve the folder over http instead." }));
    });
})();
