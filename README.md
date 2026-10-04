# Golden Leaf Products - site prototype

A public, work-in-progress prototype of a rebuilt Golden Leaf Products
website. It is not the live store and takes no orders. Planning and
decisions live in a separate private repo.

## Stack

Plain HTML, CSS and JavaScript, plus one small Python script (standard library only) that
pre-renders the product, collection and karat pages from `data/products.json`, so every page
reads fully without JavaScript (see "AI readability" below).

## Layout

| Path | Contents |
|---|---|
| `index.html` | Home page prototype, "luxury leaf" direction (marked `noindex`) |
| `css/styles.css` | All styling; colors and fonts are CSS variables in `:root` |
| `product.html`, `karat.html` | Redirect shims for the old `?p=`, `?k=`, `?c=` links; they forward to the static pages |
| `p/<id>/`, `c/<id>/`, `k/<id>/` | Generated (not in git): 184 product, 24 collection and 6 karat pages, with schema.org JSON-LD |
| `tools/build_static.py` | Generator: writes the site folder `_site/` and `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt` |
| `tools/check_static.py` | Reads the built pages as a crawler would and checks them against the data |
| `cart.html` | Cart page |
| `data/products.json` | Product data: one file with the karats, the collections (with hubs for tools and supplies), and 184 products (595 options): leaf in every metal, rolls, specialty gold, tools, supplies and kits |
| `js/main.js` | Home page: menu, help desk, scroll reveal |
| `js/cart.js` | Cart held in the browser (`localStorage`), shared by every page |
| `js/layout.js` | Shared header and footer for the product and cart pages |
| `js/product.js` | Adds the option picker and add-to-cart on top of the pre-rendered product page |
| `js/cart-page.js` | Renders the cart page |
| `assets/` | Images and other files (none yet) |

## Product and cart notes

- The 22k page is the reference product: loose and transfer leaf in six pack
  sizes each, price per pack and per leaf, ratings per pack, and the
  bulk-order message above 2,000 leaves. Data was read from the current site.
- The cart lives only in the visitor's browser. Prices come from
  `data/products.json`; nothing checks totals on a server, and checkout, tax,
  and shipping are not built yet.
- To add a product, add an entry to `data/products.json` with the same shape.
- A pack marked `"stock": "low"` shows as low inventory and cannot be added to
  the cart; the page points to the help desk instead of "please call".

## Home page notes

- No photographs yet: the gold foil is an SVG lighting filter, and the
  material and karat swatches are CSS gradients, all marked as illustrations.
- System fonts only, so there is nothing to download or install.
- Facts and prices come from the current site. Shop and learn links open the
  live store until the prototype has its own pages.

## AI readability

Each generated page carries its full text, headings, an options table with
prices and availability, specifications, and schema.org JSON-LD (`ProductGroup`
with `hasVariant`, offers, ratings, availability; `BreadcrumbList`) in the HTML
itself, so a reader that does not run JavaScript sees everything. The home page
has `Organization` and `WebSite` data. `sitemap.xml`, `robots.txt`, `llms.txt`
and `llms-full.txt` describe the catalog. The prototype is `noindex`; build with
`--indexable` for the production variant (drops `noindex`).

## Build and preview locally

```bash
python tools/build_static.py          # writes _site/
python tools/check_static.py          # checks the generated pages
cd _site && python -m http.server 8801
```

Then open http://127.0.0.1:8801/. Page addresses are `p/<id>/`, `c/<id>/`,
`k/<id>/`.

## Deploying

`.github/workflows/pages.yml` runs the build and the check, then publishes
`_site/` to GitHub Pages on every push to `main`. One-time setup in the repo's
Settings > Pages: set Source to "GitHub Actions".

Everything in this repo, including its history, is public: no owner details,
credentials, or customer data belong here.
