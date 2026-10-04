#!/usr/bin/env python3
"""Check the built site the way a reader without JavaScript would see it.

Usage: python tools/check_static.py [_site]

For every generated page (p/, c/, k/) and the home page it checks: one h1, a
title, a meta description, valid JSON-LD, no "Loading..." placeholder, and that
every internal link points at a file that exists. For product pages it also
checks that the option rows and prices in the HTML match data/products.json.
Exits nonzero if anything fails. Standard library only.
"""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urldefrag, urlparse

ROOT = Path(__file__).resolve().parent.parent


class Scan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.h1 = 0
        self.title = ""
        self.desc = ""
        self.links = []
        self.ld = []
        self.text = []
        self.rows = 0
        self.prices = []
        self._in = None
        self._buf = []
        self._td = 0
        self._tr_cells = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "h1":
            self.h1 += 1
        elif tag == "title":
            self._in = "title"
        elif tag == "meta" and a.get("name") == "description":
            self.desc = a.get("content", "")
        elif tag == "a" and a.get("href"):
            self.links.append(a["href"])
        elif tag == "script" and a.get("type") == "application/ld+json":
            self._in = "ld"
            self._buf = []
        elif tag == "tr":
            self._tr_cells = []
        elif tag == "td":
            self._in = "td"
            self._buf = []

    def handle_endtag(self, tag):
        if tag == "title":
            self._in = None
        elif tag == "script" and self._in == "ld":
            self.ld.append("".join(self._buf))
            self._in = None
        elif tag == "td" and self._in == "td":
            if self._tr_cells is not None:
                self._tr_cells.append("".join(self._buf).strip())
            self._in = None
        elif tag == "tr" and self._tr_cells:
            self.rows += 1
            self.prices.append(self._tr_cells[1] if len(self._tr_cells) > 1 else "")
            self._tr_cells = None

    def handle_data(self, data):
        if self._in == "title":
            self.title += data
        elif self._in in ("ld", "td"):
            self._buf.append(data)
        self.text.append(data)


def main():
    site = (ROOT / (sys.argv[1] if len(sys.argv) > 1 else "_site")).resolve()
    data = json.loads((site / "data" / "products.json").read_text(encoding="utf-8"))
    products = {p["id"]: p for p in data["products"]}
    errors = []
    pages = [site / "index.html"] + sorted(site.glob("[pck]/*/index.html"))
    expect = len(data["products"]) + len(data["collections"]) + len(data["karats"])
    if len(pages) - 1 != expect:
        errors.append(f"expected {expect} generated pages, found {len(pages) - 1}")

    for page in pages:
        rel = page.relative_to(site).as_posix()
        s = Scan()
        s.feed(page.read_text(encoding="utf-8"))
        if s.h1 != 1:
            errors.append(f"{rel}: {s.h1} h1 elements")
        if not s.title.strip():
            errors.append(f"{rel}: empty title")
        if len(s.desc) < 20:
            errors.append(f"{rel}: missing or short meta description")
        if "Loading..." in "".join(s.text):
            errors.append(f"{rel}: contains a Loading placeholder")
        if not s.ld:
            errors.append(f"{rel}: no JSON-LD")
        parsed = []
        for block in s.ld:
            try:
                parsed.append(json.loads(block))
            except ValueError as e:
                errors.append(f"{rel}: invalid JSON-LD ({e})")
        for href in s.links:
            if urlparse(href).scheme in ("http", "https", "mailto"):
                continue
            target = urldefrag(href)[0]
            if not target:
                continue
            path = (page.parent / target).resolve()
            if path.is_dir():
                path = path / "index.html"
            if not path.exists():
                errors.append(f"{rel}: broken link {href}")
        if rel.startswith("p/"):
            p = products[rel.split("/")[1]]
            if s.rows != len(p["variants"]):
                errors.append(f"{rel}: {s.rows} option rows, data has {len(p['variants'])}")
            for row_price, v in zip(s.prices, p["variants"]):
                want = "${:,}".format(int(v["price"])) if v["price"] == int(v["price"]) else "${:,.2f}".format(v["price"])
                if row_price != want:
                    errors.append(f"{rel}: price {row_price} != {want} for {v['sku']}")
            group = next((b for b in parsed if b.get("@type") == "ProductGroup"), None)
            if not group:
                errors.append(f"{rel}: no ProductGroup JSON-LD")
            else:
                offers = [h["offers"] for h in group["hasVariant"]]
                if len(offers) != len(p["variants"]):
                    errors.append(f"{rel}: JSON-LD variant count mismatch")
                for o, v in zip(offers, p["variants"]):
                    if float(o["price"]) != float(v["price"]):
                        errors.append(f"{rel}: JSON-LD price mismatch for {v['sku']}")
                    low = o["availability"].endswith("LimitedAvailability")
                    if low != (v["stock"] == "low"):
                        errors.append(f"{rel}: JSON-LD availability mismatch for {v['sku']}")

    for name in ("sitemap.xml", "robots.txt", "llms.txt", "llms-full.txt"):
        if not (site / name).exists():
            errors.append(f"missing {name}")
    sm = (site / "sitemap.xml").read_text(encoding="utf-8")
    n_urls = len(re.findall(r"<loc>", sm))
    if n_urls != expect + 2:
        errors.append(f"sitemap lists {n_urls} urls, expected {expect + 2}")

    if errors:
        print(f"{len(errors)} problem(s):")
        for e in errors[:50]:
            print(" -", e)
        sys.exit(1)
    print(f"ok: {len(pages)} pages checked, {n_urls} sitemap urls")


if __name__ == "__main__":
    main()
