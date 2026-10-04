(function () {
  const root = document.getElementById("product");
  const money = GLPCart.money;
  const LIVE = "https://www.goldenleafproducts.com/";
  const PACK_NAMES = { 5: "Booklet", 10: "2 booklets", 25: "Book", 100: "4 books", 250: "Half pack", 500: "Pack" };

  const FOIL_SVG = `
    <svg class="foil" viewBox="0 0 400 460" role="img" aria-label="Illustration of a sheet of gold leaf">
      <defs>
        <filter id="pfoil" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.010 0.016" numOctaves="4" seed="5" result="noise"/>
          <feDiffuseLighting in="noise" surfaceScale="10" diffuseConstant="1.25" lighting-color="#e2bb5a" result="diff"><feDistantLight azimuth="225" elevation="46"/></feDiffuseLighting>
          <feSpecularLighting in="noise" surfaceScale="10" specularConstant="1" specularExponent="26" lighting-color="#fff6d6" result="spec"><feDistantLight azimuth="225" elevation="46"/></feSpecularLighting>
          <feComposite in="spec" in2="diff" operator="arithmetic" k1="0" k2="1" k3="0.85" k4="0" result="lit"/>
          <feComposite in="lit" in2="SourceAlpha" operator="in"/>
        </filter>
      </defs>
      <path filter="url(#pfoil)" fill="#000" d="M18 22 L186 12 L382 20 L388 150 L379 300 L386 438 L214 448 L26 440 L14 290 L22 140 Z"/>
    </svg>`;

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

  function stars(rating) {
    const full = Math.round(rating);
    return "★".repeat(full) + "☆".repeat(5 - full);
  }

  function render(product, ids) {
    document.title = product.name + " - Golden Leaf Products Prototype";
    const state = { leafType: product.leafTypes[0].id, sku: null, qty: 1 };
    const variantsFor = () => product.variants.filter((v) => v.leafType === state.leafType).sort((a, b) => a.leaves - b.leaves);
    const current = () => product.variants.find((v) => v.sku === state.sku);
    const inStock = product.variants.filter((v) => v.stock !== "low");
    const start = inStock.find((v) => v.leafType === state.leafType && v.leaves === 25) || inStock.find((v) => v.leaves === 25) || inStock[0] || product.variants[0];
    state.leafType = start.leafType;
    state.sku = start.sku;

    const ratingEl = el("p", { class: "rating" });
    const leafSet = el("div", { class: "seg", role: "radiogroup", "aria-label": "Leaf type" });
    const packSet = el("div", { class: "packs", role: "radiogroup", "aria-label": "Pack size" });
    const qtyInput = el("input", { id: "qty", type: "number", min: "1", max: String(GLPCart.MAX_QTY), value: "1", inputmode: "numeric" });
    const total = el("span", { class: "total" });
    const status = el("p", { class: "added", role: "status" });
    const bulk = el("p", { class: "bulk" });
    const addBtn = el("button", { type: "button", class: "btn btn-gold", text: "Add to cart" });
    const lowNote = el("p", { class: "lownote" });

    function refresh() {
      const v = current();
      const low = v.stock === "low";
      leafSet.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.id === state.leafType)));
      packSet.replaceChildren(
        ...variantsFor().map((pv) => {
          const selected = pv.sku === state.sku;
          const btn = el("button", { type: "button", class: "pack", role: "radio", "aria-checked": String(selected), "data-sku": pv.sku },
            el("span", { class: "pack-main" },
              el("b", { text: pv.leaves + " leaves" }),
              el("small", { text: pv.stock === "low" ? PACK_NAMES[pv.leaves] + " · Low inventory" : PACK_NAMES[pv.leaves] })),
            el("span", { class: "pack-price" },
              el("b", { text: money.format(pv.price) }),
              el("small", { text: "$" + (pv.price / pv.leaves).toFixed(2) + " / leaf" })));
          btn.addEventListener("click", () => { state.sku = pv.sku; status.textContent = ""; refresh(); });
          return btn;
        })
      );
      ratingEl.replaceChildren(
        ...(v.rating == null
          ? [el("span", { text: "No ratings yet for this pack" })]
          : [el("span", { class: "stars", "aria-hidden": "true", text: stars(v.rating) }),
             el("span", { text: " " + v.rating.toFixed(1) + " (" + v.ratingCount + " ratings) for this pack" })]));
      total.textContent = money.format(v.price * state.qty);
      addBtn.disabled = low;
      addBtn.textContent = low ? "Low inventory" : "Add to cart";
      lowNote.replaceChildren();
      if (low) {
        lowNote.append("This pack is low on inventory, so it cannot be added to the cart right now. ",
          el("a", { href: "index.html#help", text: "Ask about availability" }), ".");
      }
      const leaves = v.leaves * state.qty;
      bulk.replaceChildren();
      if (leaves > product.bulkThreshold) {
        bulk.append(
          el("b", { text: "That is " + leaves.toLocaleString("en-US") + " leaves. " }),
          "Orders above " + product.bulkThreshold.toLocaleString("en-US") + " leaves get special pricing. ",
          el("a", { href: "index.html#help", text: "Send us a message" }), ".");
      } else {
        bulk.append("Ordering more than " + product.bulkThreshold.toLocaleString("en-US") + " leaves? ",
          el("a", { href: "index.html#help", text: "Ask about bulk pricing" }), ".");
      }
    }

    product.leafTypes.forEach((lt) => {
      const b = el("button", { type: "button", role: "radio", "data-id": lt.id, text: lt.label });
      b.addEventListener("click", () => {
        const leaves = current().leaves;
        state.leafType = lt.id;
        const list = variantsFor();
        state.sku = (list.find((v) => v.leaves === leaves) || list[0]).sku;
        status.textContent = "";
        refresh();
      });
      leafSet.append(b);
    });
    if (product.leafTypes.length === 1) leafSet.classList.add("single");

    qtyInput.addEventListener("input", () => {
      state.qty = Math.max(1, Math.min(GLPCart.MAX_QTY, parseInt(qtyInput.value, 10) || 1));
      refresh();
    });
    qtyInput.addEventListener("change", () => { qtyInput.value = String(state.qty); });

    addBtn.addEventListener("click", () => {
      if (current().stock === "low") return;
      GLPCart.add(state.sku, state.qty);
      status.replaceChildren(
        el("b", { text: "Added. " }),
        state.qty + " x " + current().name + " ",
        el("a", { href: "cart.html", text: "View cart" }));
    });

    const media = el("div", { class: "pdp-media" });
    media.insertAdjacentHTML("afterbegin", FOIL_SVG);
    media.append(el("span", { class: "foil-cap", text: "Illustration. Photography to come." }));

    const eyebrow = [product.brand, product.madeIn ? "Made in " + product.madeIn : null].filter(Boolean).join(" · ");
    const buy = el("div", { class: "pdp-buy" },
      el("p", { class: "eyebrow", text: eyebrow || product.karat + " genuine gold leaf" }),
      el("h1", { text: product.name }),
      ratingEl,
      el("p", { class: "lede", text: product.about[0] }),
      el("p", { class: "label", text: product.leafTypes.length > 1 ? "Leaf type" : "Leaf type (only this type is listed)" }), leafSet,
      el("p", { class: "label", text: "Pack size" }), packSet,
      el("div", { class: "buyrow" },
        el("label", { class: "qty", for: "qty" }, "Qty", qtyInput),
        el("div", { class: "sum" }, el("small", { text: "Total" }), total),
        addBtn),
      lowNote, status, bulk);

    const details = el("section", { class: "pdp-details" },
      el("div", {}, el("h2", { text: "About this leaf" }),
        ...product.about.slice(1).map((t) => el("p", { text: t })),
        ...product.infoLinks.map((l) => el("p", {}, el("a", { href: l.url, rel: "noopener", text: l.label + " →" })))),
      el("div", {}, el("h2", { text: "Specifications" }),
        el("dl", {}, ...product.specs.flatMap(([k, v]) => [el("dt", { text: k }), el("dd", { text: v })]))));

    const relatedLinks = product.related.map((r) => {
      const local = r.page.startsWith("order-") && ids.has(r.page.slice(6));
      return el("li", {}, el("a", local
        ? { href: "product.html?p=" + r.page.slice(6), text: r.name }
        : { href: LIVE + r.page + ".html", rel: "noopener", text: r.name }));
    });
    const related = el("section", { class: "pdp-related" },
      el("h2", { text: "You may also be interested in" }),
      el("ul", {}, ...relatedLinks),
      el("p", { class: "fine", text: "Gold leaf pages open here. Other items open the current site until their pages are built." }));

    const crumbs = el("nav", { class: "crumbs", "aria-label": "Breadcrumb" },
      el("a", { href: "index.html", text: "Home" }), " / ",
      el("a", { href: "karat.html?k=" + encodeURIComponent(product.karat), text: product.karat + " gold leaf" }), " / ",
      el("span", { text: product.name }));

    root.replaceChildren(crumbs, el("div", { class: "pdp" }, media, buy), details, related);
    refresh();
  }

  fetch("data/products.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => {
      const ids = new Set(data.products.map((p) => p.id));
      const id = new URLSearchParams(location.search).get("p");
      const product = data.products.find((p) => p.id === id) || data.products[0];
      render(product, ids);
    })
    .catch(() => {
      root.replaceChildren(el("p", { class: "wrap fine", text: "Product details could not be loaded. If you opened this file directly, serve the folder over http instead." }));
    });
})();
