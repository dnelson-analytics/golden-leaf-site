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

  function karatDot(id) {
    return "k" + id.replace(".", "").replace("k", "");
  }

  function dotFor(p) {
    const dot = el("div", { class: "dot " + (p.swatch || (p.karat ? karatDot(p.karat) : "k24")), "aria-hidden": "true" });
    if (p.color) dot.style.background = "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), " + p.color + " 55%)";
    return dot;
  }

  function render(data, group, isKarat) {
    const title = isKarat ? group.label + " Genuine Gold Leaf" : group.label;
    document.title = title + " - Golden Leaf Products Prototype";
    const byId = Object.fromEntries(data.products.map((p) => [p.id, p]));
    const byCollection = Object.fromEntries(data.collections.map((c) => [c.id, c]));
    const param = isKarat ? "k" : "c";
    const parent = !isKarat && group.parent ? byCollection[group.parent] : null;
    const siblings = isKarat ? data.karats : data.collections.filter((c) => (c.parent || null) === (group.parent || null));
    const swatch = isKarat ? karatDot(group.id) : group.swatch;

    const tabs = el("nav", { class: "ktabs", "aria-label": isKarat ? "Karat" : "Collection" },
      ...siblings.map((s) => el("a", { href: "karat.html?" + param + "=" + encodeURIComponent(s.id), "aria-current": s.id === group.id ? "page" : null, text: s.label })));

    const back = parent
      ? el("p", { class: "kback" }, el("a", { href: "karat.html?c=" + parent.id, text: "← " + parent.label }))
      : null;

    const head = el("div", { class: "khead" },
      el("div", { class: "dot " + swatch, "aria-hidden": "true" }),
      el("div", {},
        el("p", { class: "eyebrow", text: isKarat ? "Genuine gold leaf" : parent ? parent.label : "Collection" }),
        el("h1", { text: isKarat ? group.label + " gold leaf" : group.label }),
        el("p", { class: "lede", text: group.blurb })));

    const childCards = (group.children || []).map((cid) => {
      const c = byCollection[cid];
      return el("a", { class: "kcard", href: "karat.html?c=" + c.id },
        el("div", { class: "dot " + c.swatch, "aria-hidden": "true" }),
        el("h3", { text: c.label }),
        el("p", { class: "kfacts", text: c.blurb }),
        el("p", { class: "kprice" }, el("b", { text: String(c.products.length) }), el("small", { text: c.products.length === 1 ? " product" : " products" })),
        el("span", { class: "go", text: "Browse" }));
    });

    const cards = group.products.map((pid) => {
      const p = byId[pid];
      const prices = p.variants.map((v) => v.price);
      const low = p.variants.some((v) => v.stock === "low");
      const comp = (p.specs.find((s) => s[0] === "Composition") || [])[1];
      const single = p.variants.length === 1;
      return el("a", { class: "kcard", href: "product.html?p=" + p.id },
        dotFor(p),
        el("h3", { text: p.name }),
        el("p", { class: "kfacts", text: p.facts.join(" · ") }),
        comp ? el("p", { class: "kcomp", text: comp }) : null,
        el("p", { class: "kprice" },
          el("small", { text: single ? "" : "From " }),
          el("b", { text: money.format(Math.min(...prices)) }),
          single ? null : el("small", { text: " · " + p.variants.length + " " + p.unitNoun })),
        low ? el("span", { class: "klow", text: single ? "Low inventory" : "Some options low on inventory" }) : null,
        el("span", { class: "go", text: single ? "View product" : "View options" }));
    });

    root.replaceChildren(...[
      tabs, back, head,
      childCards.length ? el("div", { class: "kgrid" }, ...childCards) : null,
      cards.length ? el("div", { class: "kgrid" + (childCards.length ? " kgap" : "") }, ...cards) : null,
      el("p", { class: "fine", text: "Swatch colors are illustrative. Photographs will replace them. Prices and stock are read from the current site." }),
    ].filter(Boolean));
  }

  fetch("data/products.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => {
      const params = new URLSearchParams(location.search);
      const c = params.get("c");
      const collection = c && data.collections.find((x) => x.id === c);
      if (collection) return render(data, collection, false);
      const karat = data.karats.find((k) => k.id === params.get("k")) || data.karats[0];
      render(data, karat, true);
    })
    .catch(() => {
      root.replaceChildren(el("p", { class: "fine", text: "The page could not load. If you opened this file directly, serve the folder over http instead." }));
    });
})();
