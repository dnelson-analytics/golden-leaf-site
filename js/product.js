(function () {
  const root = document.getElementById("product");
  const money = GLPCart.money;
  const LIVE = "https://www.goldenleafproducts.com/";
  const base = document.body.dataset.base || "";
  const TONES = { gold: "#e2bb5a", silver: "#d9dde3", copper: "#c8703f", imitation: "#cdb04c", palladium: "#c9ccd1", variegated: "#b9a24a" };

  function foilSvg(tone) {
    const color = TONES[tone] || TONES.gold;
    return `
    <svg class="foil" viewBox="0 0 400 460" role="img" aria-label="Illustration of a sheet of leaf">
      <defs>
        <filter id="pfoil" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.010 0.016" numOctaves="4" seed="5" result="noise"/>
          <feDiffuseLighting in="noise" surfaceScale="10" diffuseConstant="1.25" lighting-color="${color}" result="diff"><feDistantLight azimuth="225" elevation="46"/></feDiffuseLighting>
          <feSpecularLighting in="noise" surfaceScale="10" specularConstant="1" specularExponent="26" lighting-color="#fff6d6" result="spec"><feDistantLight azimuth="225" elevation="46"/></feSpecularLighting>
          <feComposite in="spec" in2="diff" operator="arithmetic" k1="0" k2="1" k3="0.85" k4="0" result="lit"/>
          <feComposite in="lit" in2="SourceAlpha" operator="in"/>
        </filter>
      </defs>
      <path filter="url(#pfoil)" fill="#000" d="M18 22 L186 12 L382 20 L388 150 L379 300 L386 438 L214 448 L26 440 L14 290 L22 140 Z"/>
    </svg>`;
  }

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
        const groups = [];
    product.variants.forEach((v) => { if (v.group && !groups.includes(v.group)) groups.push(v.group); });
    const state = { group: groups[0] || null, sku: null, qty: 1 };
    const variantsFor = () => product.variants.filter((v) => !state.group || v.group === state.group);
    const current = () => product.variants.find((v) => v.sku === state.sku);
    const inStock = product.variants.filter((v) => v.stock !== "low");
    const start = inStock.find((v) => v.label === "25 leaves") || inStock[0] || product.variants[0];
    state.group = start.group;
    state.sku = start.sku;

    const ratingEl = el("p", { class: "rating" });
    const groupSet = el("div", { class: "seg", role: "radiogroup", "aria-label": product.groupLabel || "Option" });
    const packSet = el("div", { class: "packs", role: "radiogroup", "aria-label": product.sizeLabel });
    const qtyInput = el("input", { id: "qty", type: "number", min: "1", max: String(GLPCart.MAX_QTY), value: "1", inputmode: "numeric" });
    const total = el("span", { class: "total" });
    const status = el("p", { class: "added", role: "status" });
    const bulk = el("p", { class: "bulk" });
    const addBtn = el("button", { type: "button", class: "btn btn-gold", text: "Add to cart" });
    const lowNote = el("p", { class: "lownote" });

    function refresh() {
      const v = current();
      const low = v.stock === "low";
      groupSet.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.group === state.group)));
      packSet.replaceChildren(
        ...variantsFor().map((pv) => {
          const selected = pv.sku === state.sku;
          const subText = [pv.sub, pv.stock === "low" ? "Low inventory" : null].filter(Boolean).join(" · ");
          const btn = el("button", { type: "button", class: "pack", role: "radio", "aria-checked": String(selected), "data-sku": pv.sku },
            el("span", { class: "pack-main" },
              el("b", { text: pv.label }),
              subText ? el("small", { text: subText }) : null),
            el("span", { class: "pack-price" },
              el("b", { text: money.format(pv.price) }),
              pv.leaves ? el("small", { text: "$" + (pv.price / pv.leaves).toFixed(2) + " / leaf" }) : null));
          btn.addEventListener("click", () => { state.sku = pv.sku; status.textContent = ""; refresh(); });
          return btn;
        })
      );
      ratingEl.replaceChildren(
        ...(v.rating == null
          ? [el("span", { text: "No ratings yet for this selection" })]
          : [el("span", { class: "stars", "aria-hidden": "true", text: stars(v.rating) }),
             el("span", { text: " " + v.rating.toFixed(1) + " (" + v.ratingCount + " ratings) for this selection" })]));
      total.textContent = money.format(v.price * state.qty);
      addBtn.disabled = low;
      addBtn.textContent = low ? "Low inventory" : "Add to cart";
      lowNote.replaceChildren();
      if (low) {
        lowNote.append("This option is low on inventory, so it cannot be added to the cart right now. ",
          el("a", { href: base + "index.html#help", text: "Ask about availability" }), ".");
      }
      bulk.replaceChildren();
      const b = product.bulk;
      if (b && b.leaves && v.leaves) {
        const leaves = v.leaves * state.qty;
        if (leaves > b.leaves) {
          bulk.append(
            el("b", { text: "That is " + leaves.toLocaleString("en-US") + " leaves. " }),
            "Orders above " + b.leaves.toLocaleString("en-US") + " leaves get special pricing. ",
            el("a", { href: base + "index.html#help", text: "Send us a message" }), ".");
        } else {
          bulk.append("Ordering more than " + b.leaves.toLocaleString("en-US") + " leaves? ",
            el("a", { href: base + "index.html#help", text: "Ask about bulk pricing" }), ".");
        }
      } else if (b && b.note) {
        bulk.append(b.note + " ", el("a", { href: base + "index.html#help", text: "Send us a message" }), ".");
      }
    }

    groups.forEach((g) => {
      const btn = el("button", { type: "button", role: "radio", "data-group": g, text: g });
      btn.addEventListener("click", () => {
        const label = current().label;
        state.group = g;
        const list = variantsFor();
        state.sku = (list.find((v) => v.label === label) || list[0]).sku;
        status.textContent = "";
        refresh();
      });
      groupSet.append(btn);
    });
    if (groups.length === 1) groupSet.classList.add("single");

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
        el("a", { href: base + "cart.html", text: "View cart" }));
    });

    const media = el("div", { class: "pdp-media tone-" + (product.tone || "gold") });
    if (product.media === "swatch") {
      const big = el("div", { class: "swatch-big " + (product.swatch || ""), "aria-hidden": "true" });
      if (product.color) big.style.background = "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), " + product.color + " 55%)";
      media.append(big);
    } else {
      media.insertAdjacentHTML("afterbegin", foilSvg(product.tone));
    }
    media.append(el("span", { class: "foil-cap", text: "Illustration. Photography to come." }));

    const eyebrow = [product.brand, product.madeIn ? "Made in " + product.madeIn : null].filter(Boolean).join(" · ");
    const groupLabel = !product.groupLabel ? null
      : groups.length > 1 ? product.groupLabel : product.groupLabel + " (only this one is listed)";
    const buy = el("div", { class: "pdp-buy" },
      el("p", { class: "eyebrow", text: eyebrow || product.crumb.label }),
      el("h1", { text: product.name }),
      ratingEl,
      el("p", { class: "lede", text: product.about[0] }),
      groups.length && groupLabel ? el("p", { class: "label", text: groupLabel }) : null,
      groups.length && groupLabel ? groupSet : null,
      el("p", { class: "label", text: product.sizeLabel }), packSet,
      el("div", { class: "buyrow" },
        el("label", { class: "qty", for: "qty" }, "Qty", qtyInput),
        el("div", { class: "sum" }, el("small", { text: "Total" }), total),
        addBtn),
      lowNote, status, bulk);

    const details = el("section", { class: "pdp-details" },
      el("div", {}, el("h2", { text: "About this product" }),
        ...product.about.slice(1).map((t) => el("p", { text: t })),
        ...product.infoLinks.map((l) => el("p", {}, el("a", { href: l.url, rel: "noopener", text: l.label + " →" })))),
      el("div", {}, el("h2", { text: "Specifications" }),
        el("dl", {}, ...product.specs.flatMap(([k, v]) => [el("dt", { text: k }), el("dd", { text: v })]))));

    const relatedLinks = product.related.map((r) => {
      if (r.href) return el("li", {}, el("a", { href: base + r.href, text: r.name }));
      const local = r.page.startsWith("order-") && ids.has(r.page.slice(6));
      return el("li", {}, el("a", local
        ? { href: base + "p/" + r.page.slice(6) + "/", text: r.name }
        : { href: LIVE + r.page + ".html", rel: "noopener", text: r.name }));
    });
    const related = el("section", { class: "pdp-related" },
      el("h2", { text: "You may also be interested in" }),
      el("ul", {}, ...relatedLinks),
      el("p", { class: "fine", text: "These pages open here. A few items open the current site." }));

    const crumbs = el("nav", { class: "crumbs", "aria-label": "Breadcrumb" },
      el("a", { href: base + "index.html", text: "Home" }), " / ",
      el("a", { href: base + product.crumb.url, text: product.crumb.label }), " / ",
      el("span", { text: product.name }));

    root.replaceChildren(crumbs, el("div", { class: "pdp" }, media, buy), details, related);
    refresh();
  }

  fetch(base + "data/products.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => {
      const ids = new Set(data.products.map((p) => p.id));
      const id = root.dataset.product || new URLSearchParams(location.search).get("p");
      const product = data.products.find((p) => p.id === id) || data.products[0];
      render(product, ids);
    })
    .catch(() => {
      if (!root.dataset.product) root.replaceChildren(el("p", { class: "wrap fine", text: "Product details could not be loaded. If you opened this file directly, serve the folder over http instead." }));
    });
})();
