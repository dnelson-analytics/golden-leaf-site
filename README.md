# Golden Leaf Products - site prototype

A public, work-in-progress prototype of a rebuilt Golden Leaf Products
website. It is not the live store and takes no orders. Planning and
decisions live in a separate private repo.

## Stack

Plain HTML, CSS and JavaScript. No build step and no dependencies.

## Layout

| Path | Contents |
|---|---|
| `index.html` | Home page prototype, "luxury leaf" direction (marked `noindex`) |
| `css/styles.css` | All styling; colors and fonts are CSS variables in `:root` |
| `product.html` | Product page template; `?p=<id>` picks the product from `data/products.json` |
| `cart.html` | Cart page |
| `data/products.json` | Product data: one file, one entry per product (22k gold leaf so far) |
| `js/main.js` | Home page: menu, help desk, scroll reveal |
| `js/cart.js` | Cart held in the browser (`localStorage`), shared by every page |
| `js/layout.js` | Shared header and footer for the product and cart pages |
| `js/product.js`, `js/cart-page.js` | Render the product and cart pages |
| `assets/` | Images and other files (none yet) |

## Product and cart notes

- The 22k page is the reference product: loose and transfer leaf in six pack
  sizes each, price per pack and per leaf, ratings per pack, and the
  bulk-order message above 2,000 leaves. Data was read from the current site.
- The cart lives only in the visitor's browser. Prices come from
  `data/products.json`; nothing checks totals on a server, and checkout, tax,
  and shipping are not built yet.
- To add a product, add an entry to `data/products.json` with the same shape.

## Home page notes

- No photographs yet: the gold foil is an SVG lighting filter, and the
  material and karat swatches are CSS gradients, all marked as illustrations.
- System fonts only, so there is nothing to download or install.
- Facts and prices come from the current site. Shop and learn links open the
  live store until the prototype has its own pages.

## Preview locally

```bash
python -m http.server 8801
```

Then open http://127.0.0.1:8801/.

## Deploying

`.github/workflows/pages.yml` publishes `index.html`, `assets/`, `css/` and
`js/` to GitHub Pages on every push to `main`. One-time setup in the repo's
Settings > Pages: set Source to "GitHub Actions".

Everything in this repo, including its history, is public: no owner details,
credentials, or customer data belong here.
