#!/usr/bin/env python3
"""Pre-render the Golden Leaf Products site so it reads well without JavaScript.

Reads data/products.json and writes a complete site folder (default _site/):
  - the hand-written pages, CSS, JS, data and assets, copied as they are
  - p/<id>/       one page per product (full text, options table, specs, JSON-LD)
  - c/<id>/       one page per collection
  - k/<id>/       one page per karat
  - sitemap.xml, robots.txt, llms.txt, llms-full.txt

JavaScript still runs on top of these pages (option picker, cart); the HTML is
what a reader without JavaScript, such as many AI crawlers, gets.

Usage:
  python tools/build_static.py [--out _site] [--base-url URL] [--indexable]

By default every page is marked noindex, because this is a prototype. With
--indexable the robots meta is removed and canonical URLs are emitted.
Standard library only.
"""
import argparse
import datetime
import html
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_BASE = "https://dnelson-analytics.github.io/golden-leaf-site/"
LIVE = "https://www.goldenleafproducts.com/"
COPY_FILES = ["index.html", "cart.html", "product.html", "karat.html"]
COPY_DIRS = ["css", "js", "data", "assets"]
SOURCE_NOTE = "Prices and stock were read from the current Golden Leaf Products site on 2026-10-03 and 2026-10-04. This is a design prototype, not the live store: orders cannot be placed here."


def esc(s):
    return html.escape(str(s), quote=True)


def money(n):
    return "${:,}".format(int(n)) if float(n) == int(n) else "${:,.2f}".format(n)


def jsonld(obj):
    text = json.dumps(obj, ensure_ascii=False, indent=1).replace("</", "<\\/")
    return '<script type="application/ld+json">\n' + text + "\n</script>"


def avail(stock):
    return "https://schema.org/LimitedAvailability" if stock == "low" else "https://schema.org/InStock"


class Site:
    def __init__(self, data, base_url, indexable):
        self.d = data
        self.base_url = base_url if base_url.endswith("/") else base_url + "/"
        self.indexable = indexable
        self.products = {p["id"]: p for p in data["products"]}
        self.collections = {c["id"]: c for c in data["collections"]}
        self.karats = {k["id"]: k for k in data["karats"]}
        self.today = datetime.date.today().isoformat()

    # ---------------------------------------------------------------- shared pieces
    def head(self, title, desc, path, base, extra_ld=""):
        robots = "" if self.indexable else '  <meta name="robots" content="noindex, nofollow">\n'
        canon = f'  <link rel="canonical" href="{esc(self.base_url + path)}">\n' if self.indexable or path else ""
        return f"""<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
{robots}  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc)}">
{canon}  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Golden Leaf Products (prototype)">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(desc)}">
  <meta property="og:url" content="{esc(self.base_url + path)}">
  <link rel="stylesheet" href="{base}css/styles.css">
  <script>document.documentElement.className = "js";</script>
{extra_ld}</head>"""

    def header(self, base):
        return f"""  <div class="proto">Design prototype. Not the live store. Nothing here takes an order or a payment.</div>
  <header class="site-header">
    <div class="wrap">
      <a class="brand" href="{base}index.html" aria-label="Golden Leaf Products home">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5C5.5 8 5.5 16 12 22.5 18.5 16 18.5 8 12 1.5Z" fill="#c9a24a"/><path d="M12 6v16" stroke="#0c0a07" stroke-width="0.8" fill="none"/></svg>
        <span><span class="brand-name gold-text">Golden Leaf</span><span class="brand-sub">PRODUCTS</span></span>
      </a>
      <button class="menu-btn" aria-expanded="false" aria-controls="nav">Menu</button>
      <nav class="nav" id="nav" aria-label="Main">
        <a href="{base}index.html#shop">Shop</a>
        <a href="{base}index.html#karat">Karats</a>
        <a href="{base}index.html#projects">Projects</a>
        <a href="{base}index.html#craft">Learn</a>
        <a href="{base}index.html#help">Questions</a>
        <a class="cart" href="{base}cart.html">Cart <span class="badge" data-cart-count hidden></span></a>
      </nav>
    </div>
  </header>"""

    def footer(self):
        return """  <footer class="site-footer">
    <div class="wrap">
      <span>Design prototype for Golden Leaf Products. Not the live store.</span>
      <span>
        <a href="https://www.facebook.com/goldenleafproducts/" rel="noopener">Facebook</a> &middot;
        <a href="https://www.instagram.com/golden.leaf.products/" rel="noopener">Instagram</a>
      </span>
    </div>
  </footer>"""

    def page(self, title, desc, path, depth, main, scripts, ld=""):
        base = "../" * depth
        return f"""<!DOCTYPE html>
<html lang="en">
{self.head(title, desc, path, base, ld)}
<body data-base="{base}">
{self.header(base)}
{main}
{self.footer()}
{scripts}
</body>
</html>
"""

    # ---------------------------------------------------------------- links
    def link_for(self, rel, base):
        """A related-item link: local product page when it exists, else the live site."""
        if rel.get("href"):
            return base + rel["href"]
        page = rel.get("page", "")
        if page.startswith("order-") and page[6:] in self.products:
            return f"{base}p/{page[6:]}/"
        return LIVE + page + ".html"

    def breadcrumb_ld(self, trail):
        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": i + 1, "name": name, "item": self.base_url + path}
                for i, (name, path) in enumerate(trail)
            ],
        }

    # ---------------------------------------------------------------- product page
    def product_ld(self, p):
        url = self.base_url + f"p/{p['id']}/"
        variants = []
        for v in p["variants"]:
            item = {
                "@type": "Product",
                "name": v["name"],
                "sku": v["sku"],
                "offers": {
                    "@type": "Offer",
                    "url": url,
                    "price": "{:.2f}".format(v["price"]),
                    "priceCurrency": "USD",
                    "availability": avail(v["stock"]),
                    "itemCondition": "https://schema.org/NewCondition",
                },
            }
            if v.get("mpn"):
                item["mpn"] = v["mpn"]
            if v.get("rating") is not None and v.get("ratingCount"):
                item["aggregateRating"] = {"@type": "AggregateRating", "ratingValue": v["rating"], "ratingCount": v["ratingCount"]}
            if v.get("weightOz"):
                item["weight"] = {"@type": "QuantitativeValue", "value": v["weightOz"], "unitCode": "ONZ"}
            desc_bits = [v["label"]] + ([v["group"]] if v.get("group") else [])
            item["description"] = p["name"] + ": " + ", ".join(desc_bits)
            variants.append(item)
        out = {
            "@context": "https://schema.org",
            "@type": "ProductGroup",
            "name": p["name"],
            "productGroupID": p["id"],
            "description": p["about"][0],
            "url": url,
            "variesBy": ["https://schema.org/size"],
            "hasVariant": variants,
            "additionalProperty": [{"@type": "PropertyValue", "name": k, "value": v} for k, v in p["specs"]],
        }
        if p.get("brand"):
            out["brand"] = {"@type": "Brand", "name": p["brand"]}
        return out

    def product_main(self, p, base):
        crumb = p["crumb"]
        has_leaves = any(v.get("leaves") for v in p["variants"])
        has_group = any(v.get("group") for v in p["variants"])
        head_cols = ["Option", "Price"] + (["Per leaf"] if has_leaves else []) + ["Availability", "Rating", "SKU"]
        rows = []
        for v in p["variants"]:
            label = esc(v["label"]) + (f" ({esc(v['sub'])})" if v.get("sub") else "")
            if has_group and v.get("group"):
                label = esc(v["group"]) + ": " + label
            cells = [label, esc(money(v["price"]))]
            if has_leaves:
                cells.append(esc("${:.2f}".format(v["price"] / v["leaves"])) if v.get("leaves") else "")
            cells.append("Low inventory: ask about availability" if v["stock"] == "low" else "In stock")
            cells.append(f"{v['rating']:.1f} ({v['ratingCount']} ratings)" if v.get("rating") is not None else "No ratings yet")
            cells.append(esc(v["sku"]))
            rows.append("<tr>" + "".join(f"<td>{c}</td>" for c in cells) + "</tr>")
        bulk = ""
        b = p.get("bulk")
        if b and b.get("leaves"):
            bulk = f'<p class="bulk">Ordering more than {b["leaves"]:,} leaves? <a href="{base}index.html#help">Ask about bulk pricing</a> or call sales at <a href="tel:+18888533672">888-853-3672</a>.</p>'
        elif b and b.get("note"):
            bulk = f'<p class="bulk">{esc(b["note"])} <a href="{base}index.html#help">Send us a message</a> or call sales at <a href="tel:+18888533672">888-853-3672</a>.</p>'
        eyebrow = " · ".join(x for x in [p.get("brand"), f"Made in {p['madeIn']}" if p.get("madeIn") else None] if x) or crumb["label"]
        specs = "".join(f"<dt>{esc(k)}</dt><dd>{esc(v)}</dd>" for k, v in p["specs"])
        about = "".join(f"<p>{esc(t)}</p>" for t in p["about"][1:])
        info = "".join(f'<li><a href="{esc(l["url"])}" rel="noopener">{esc(l["label"])}</a></li>' for l in p.get("infoLinks", []))
        related = "".join(f'<li><a href="{esc(self.link_for(r, base))}">{esc(r["name"])}</a></li>' for r in p["related"])
        swatch = ""
        if p.get("media") == "swatch":
            style = f' style="background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), {esc(p["color"])} 55%)"' if p.get("color") else ""
            swatch = f'<div class="swatch-big {esc(p.get("swatch") or "")}"{style} aria-hidden="true"></div>'
        return f"""  <main class="wrap inner" id="product" data-product="{esc(p['id'])}">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="{base}index.html">Home</a> / <a href="{base}{esc(crumb['url'])}">{esc(crumb['label'])}</a> / <span>{esc(p['name'])}</span></nav>
    <article class="pdp-static">
      <header class="pdp-buy">
        <p class="eyebrow">{esc(eyebrow)}</p>
        <h1>{esc(p['name'])}</h1>
        <p class="lede">{esc(p['about'][0])}</p>
      </header>
      {swatch}
      <section aria-labelledby="opts">
        <h2 id="opts">{esc(p['sizeLabel'])} options and prices</h2>
        <div class="tablewrap opt-wrap"><table class="opt-table">
          <caption>{esc(p['name'])}: options, prices and availability. {esc(SOURCE_NOTE)}</caption>
          <thead><tr>{"".join(f"<th scope='col'>{c}</th>" for c in head_cols)}</tr></thead>
          <tbody>{"".join(rows)}</tbody>
        </table></div>
        {bulk}
        <p class="fine">Enable JavaScript to choose an option and add it to the prototype cart.</p>
      </section>
      <section aria-labelledby="about"><h2 id="about">About this product</h2>{about}<ul>{info}</ul></section>
      <section aria-labelledby="specs"><h2 id="specs">Specifications</h2><dl class="spec-list">{specs}</dl></section>
      <section aria-labelledby="rel"><h2 id="rel">You may also be interested in</h2><ul>{related}</ul></section>
    </article>
  </main>"""

    # ---------------------------------------------------------------- listing pages
    def card(self, p, base):
        prices = [v["price"] for v in p["variants"]]
        single = len(p["variants"]) == 1
        low = any(v["stock"] == "low" for v in p["variants"])
        comp = next((v for k, v in p["specs"] if k == "Composition"), None)
        dot_class = p.get("swatch") or ("k" + p["karat"].replace(".", "").replace("k", "") if p.get("karat") else "k24")
        style = f' style="background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55), {esc(p["color"])} 55%)"' if p.get("color") else ""
        count = "" if single else f' <small>&middot; {len(p["variants"])} {esc(p["unitNoun"])}</small>'
        return (
            f'<a class="kcard" href="{base}p/{esc(p["id"])}/">'
            f'<div class="dot {esc(dot_class)}"{style} aria-hidden="true"></div>'
            f'<h3>{esc(p["name"])}</h3><p class="kfacts">{esc(" · ".join(p["facts"]))}</p>'
            + (f'<p class="kcomp">{esc(comp)}</p>' if comp else "")
            + f'<p class="kprice">{"" if single else "<small>From </small>"}<b>{esc(money(min(prices)))}</b>{count}</p>'
            + (f'<span class="klow">{"Low inventory" if single else "Some options low on inventory"}</span>' if low else "")
            + f'<span class="go">{"View product" if single else "View options"}</span></a>'
        )

    def listing_main(self, group, is_karat, base):
        gid = group["id"]
        param_dir = "k" if is_karat else "c"
        parent = None if is_karat else self.collections.get(group.get("parent") or "")
        siblings = list(self.karats.values()) if is_karat else [c for c in self.collections.values() if (c.get("parent") or None) == (group.get("parent") or None)]
        tabs = "".join(
            f'<a href="{base}{param_dir}/{esc(s["id"])}/"{" aria-current=\"page\"" if s["id"] == gid else ""}>{esc(s["label"])}</a>' for s in siblings
        )
        back = f'<p class="kback"><a href="{base}c/{esc(parent["id"])}/">← {esc(parent["label"])}</a></p>' if parent else ""
        swatch = ("k" + gid.replace(".", "").replace("k", "")) if is_karat else group["swatch"]
        eyebrow = "Genuine gold leaf" if is_karat else (parent["label"] if parent else "Collection")
        h1 = f"{group['label']} gold leaf" if is_karat else group["label"]
        child_cards = "".join(
            f'<a class="kcard" href="{base}c/{esc(c["id"])}/"><div class="dot {esc(c["swatch"])}" aria-hidden="true"></div><h3>{esc(c["label"])}</h3>'
            f'<p class="kfacts">{esc(c["blurb"])}</p><p class="kprice"><b>{len(c["products"])}</b> <small>{"product" if len(c["products"]) == 1 else "products"}</small></p><span class="go">Browse</span></a>'
            for c in (self.collections[x] for x in group.get("children", []))
        )
        cards = "".join(self.card(self.products[pid], base) for pid in group["products"])
        grids = ""
        if child_cards:
            grids += f'<div class="kgrid">{child_cards}</div>'
        if cards:
            grids += f'<div class="kgrid{" kgap" if child_cards else ""}">{cards}</div>'
        return f"""  <main class="wrap inner" id="karat">
    <nav class="ktabs" aria-label="{"Karat" if is_karat else "Collection"}">{tabs}</nav>
    {back}
    <div class="khead">
      <div class="dot {esc(swatch)}" aria-hidden="true"></div>
      <div><p class="eyebrow">{esc(eyebrow)}</p><h1>{esc(h1)}</h1><p class="lede">{esc(group['blurb'])}</p></div>
    </div>
    {grids}
    <p class="fine">Swatch colors are illustrative. Photographs will replace them. {esc(SOURCE_NOTE)}</p>
  </main>"""

    # ---------------------------------------------------------------- writers
    def write(self, out, path, text):
        target = out / path / "index.html" if path.endswith("/") else out / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding="utf-8", newline="\n")

    def build(self, out):
        urls = []
        enhance = '  <script src="../../js/cart.js"></script>\n  <script src="../../js/layout.js"></script>\n  <script src="../../js/product.js"></script>'
        plain = '  <script src="../../js/cart.js"></script>\n  <script src="../../js/layout.js"></script>'
        for p in self.products.values():
            path = f"p/{p['id']}/"
            prices = [v["price"] for v in p["variants"]]
            desc = f"{p['about'][0]} From {money(min(prices))}, {len(p['variants'])} option{'s' if len(p['variants']) != 1 else ''}."
            if len(desc) > 300:
                desc = desc[:297].rsplit(" ", 1)[0] + "..."
            ld = jsonld(self.product_ld(p)) + "\n" + jsonld(self.breadcrumb_ld([("Home", ""), (p["crumb"]["label"], p["crumb"]["url"]), (p["name"], path)]))
            self.write(out, path, self.page(f"{p['name']} | Golden Leaf Products (prototype)", desc, path, 2, self.product_main(p, "../../"), enhance, ld))
            urls.append(path)
        for c in self.collections.values():
            path = f"c/{c['id']}/"
            desc = c["blurb"]
            ld = jsonld(self.breadcrumb_ld([("Home", ""), (c["label"], path)]))
            self.write(out, path, self.page(f"{c['label']} | Golden Leaf Products (prototype)", desc, path, 2, self.listing_main(c, False, "../../"), plain, ld))
            urls.append(path)
        for k in self.karats.values():
            path = f"k/{k['id']}/"
            ld = jsonld(self.breadcrumb_ld([("Home", ""), (f"{k['label']} gold leaf", path)]))
            self.write(out, path, self.page(f"{k['label']} Genuine Gold Leaf | Golden Leaf Products (prototype)", k["blurb"], path, 2, self.listing_main(k, True, "../../"), plain, ld))
            urls.append(path)
        self.write(out, "robots.txt", self.robots())
        self.write(out, "sitemap.xml", self.sitemap(["", "cart.html"] + urls))
        self.write(out, "llms.txt", self.llms())
        self.write(out, "llms-full.txt", self.llms_full())
        return urls

    def robots(self):
        return f"User-agent: *\nAllow: /\n\nSitemap: {self.base_url}sitemap.xml\n"

    def sitemap(self, paths):
        items = "".join(f"  <url><loc>{esc(self.base_url + p)}</loc><lastmod>{self.today}</lastmod></url>\n" for p in paths)
        return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{items}</urlset>\n'

    def llms(self):
        b = self.base_url
        lines = [
            "# Golden Leaf Products (design prototype)",
            "",
            "> A prototype of a rebuilt website for Golden Leaf Products, a family-owned supplier of genuine gold, silver and other precious-metal leaf, plus gilding tools and supplies, shipping from Oceanside, California. " + SOURCE_NOTE,
            "",
            "Every product page lists each option with its price, availability and SKU, and carries schema.org product data. Prices are in US dollars.",
            "",
            "## Genuine gold leaf by karat",
        ]
        lines += [f"- [{k['label']} gold leaf]({b}k/{k['id']}/): {k['blurb']}" for k in self.karats.values()]
        lines += ["", "## Collections"]
        lines += [f"- [{c['label']}]({b}c/{c['id']}/): {c['blurb']}" for c in self.collections.values() if not c.get("parent")]
        lines += ["", "## Sub-collections"]
        lines += [f"- [{c['label']}]({b}c/{c['id']}/): {c['blurb']}" for c in self.collections.values() if c.get("parent")]
        lines += [
            "",
            "## Optional",
            f"- [Full catalog as plain text]({b}llms-full.txt): every product with its options, prices, availability and specifications",
            f"- [Catalog data as JSON]({b}data/products.json)",
            f"- [Sitemap]({b}sitemap.xml)",
            "",
        ]
        return "\n".join(lines)

    def llms_full(self):
        b = self.base_url
        out = ["# Golden Leaf Products (design prototype): full catalog", "", SOURCE_NOTE, ""]
        for p in self.products.values():
            prices = [v["price"] for v in p["variants"]]
            out.append(f"## {p['name']}")
            out.append(f"URL: {b}p/{p['id']}/")
            out.append(f"Category: {p['crumb']['label']}")
            out.append(f"Price: {money(min(prices))}" + (f" to {money(max(prices))}" if min(prices) != max(prices) else ""))
            out.append("")
            out += p["about"]
            out.append("")
            out.append(f"{p['sizeLabel']} options:")
            for v in p["variants"]:
                label = (v["group"] + ", " if v.get("group") else "") + v["label"]
                out.append(f"- {label}: {money(v['price'])}, {'low inventory' if v['stock'] == 'low' else 'in stock'}, SKU {v['sku']}")
            if p["specs"]:
                out.append("")
                out += [f"{k}: {v}" for k, v in p["specs"]]
            out.append("")
        return "\n".join(out)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="_site")
    ap.add_argument("--base-url", default=DEFAULT_BASE)
    ap.add_argument("--indexable", action="store_true", help="drop noindex and emit canonical URLs (production variant)")
    args = ap.parse_args()

    data = json.loads((ROOT / "data" / "products.json").read_text(encoding="utf-8"))
    out = (ROOT / args.out).resolve()
    if out == ROOT or ROOT not in out.parents:
        sys.exit("refusing to use an output folder outside the repo")
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    for name in COPY_FILES:
        shutil.copy2(ROOT / name, out / name)
    for name in COPY_DIRS:
        if (ROOT / name).exists():
            shutil.copytree(ROOT / name, out / name)
    if args.indexable:
        for name in ("index.html", "cart.html"):
            f = out / name
            f.write_text(f.read_text(encoding="utf-8").replace('  <meta name="robots" content="noindex, nofollow">\n', ""), encoding="utf-8", newline="\n")

    site = Site(data, args.base_url, args.indexable)
    urls = site.build(out)
    print(f"built {len(urls)} pages into {out} ({'indexable' if args.indexable else 'noindex'})")


if __name__ == "__main__":
    main()
