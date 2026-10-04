(function () {
  const root = document.getElementById("karat");
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

  function dotClass(id) {
    return "k" + id.replace(".", "").replace("k", "");
  }

  function render(data, karat) {
    document.title = karat.label + " Genuine Gold Leaf - Golden Leaf Products Prototype";
    const byId = Object.fromEntries(data.products.map((p) => [p.id, p]));

    const tabs = el("nav", { class: "ktabs", "aria-label": "Karat" },
      ...data.karats.map((k) => el("a", { href: "karat.html?k=" + encodeURIComponent(k.id), "aria-current": k.id === karat.id ? "page" : null, text: k.label })));

    const head = el("div", { class: "khead" },
      el("div", { class: "dot " + dotClass(karat.id), "aria-hidden": "true" }),
      el("div", {},
        el("p", { class: "eyebrow", text: "Genuine gold leaf" }),
        el("h1", { text: karat.label + " gold leaf" }),
        el("p", { class: "lede", text: karat.blurb })));

    const cards = karat.products.map((pid) => {
      const p = byId[pid];
      const prices = p.variants.map((v) => v.price);
      const low = p.variants.some((v) => v.stock === "low");
      const comp = (p.specs.find((s) => s[0] === "Composition") || [])[1];
      const facts = [
        p.thickness === "Standard" ? "Standard thickness" : p.thickness + " thickness",
        p.madeIn ? "Made in " + p.madeIn : null,
        p.leafTypes.map((t) => t.label.replace(" leaf", "").toLowerCase()).join(" and "),
      ].filter(Boolean).join(" · ");
      return el("a", { class: "kcard", href: "product.html?p=" + p.id },
        el("div", { class: "dot " + dotClass(karat.id), "aria-hidden": "true" }),
        el("h3", { text: p.name }),
        el("p", { class: "kfacts", text: facts }),
        comp ? el("p", { class: "kcomp", text: comp }) : null,
        el("p", { class: "kprice" }, el("small", { text: "From " }), el("b", { text: money.format(Math.min(...prices)) }), el("small", { text: " · " + p.variants.length + " packs" })),
        low ? el("span", { class: "klow", text: "Some packs low on inventory" }) : null,
        el("span", { class: "go", text: "View packs" }));
    });

    root.replaceChildren(
      tabs, head,
      el("div", { class: "kgrid" }, ...cards),
      el("p", { class: "fine", text: "Swatch colors are illustrative. Photographs will replace them. Prices and stock are read from the current site." }));
  }

  fetch("data/products.json")
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => {
      const id = new URLSearchParams(location.search).get("k");
      const karat = data.karats.find((k) => k.id === id) || data.karats[0];
      render(data, karat);
    })
    .catch(() => {
      root.replaceChildren(el("p", { class: "fine", text: "The karat page could not load. If you opened this file directly, serve the folder over http instead." }));
    });
})();
