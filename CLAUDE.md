# Project: Golden Leaf Products site prototype

House standards and how Doug works: the `myAI` repo (private, local
`E:\Code\Repos\myAI`; start with its `skills/doug-dev-environment`). This file
covers only what is specific to this project and wins where they differ.

Public prototype of a rebuilt Golden Leaf Products website. Planning, decisions
and findings live in the private repo `golden-leaf-products` (see its
`docs/working-notes.md` first). This repo is **public**: no owner details,
credentials, customer data, or copied code from the current cart script.

## Stack
- Plain HTML, CSS, JavaScript, plus `tools/build_static.py` (Python standard
  library only). Ask before adding any other dependency.
- One data file, `data/products.json`, is the single source. The generator
  pre-renders product (`p/<id>/`), collection (`c/<id>/`) and karat (`k/<id>/`)
  pages from it into `_site/`; `js/product.js` only enhances the product page
  (option picker, cart). `index.html` and `cart.html` are hand-written. Its
  structure is described in `golden-leaf-products/docs/working-notes.md`.
- Build and check: `python tools/build_static.py` then
  `python tools/check_static.py`; preview with
  `cd _site && python -m http.server 8801`.
- Deploy: `.github/workflows/pages.yml` runs both scripts and publishes
  `_site/`. A new hand-written page or folder must be added to `COPY_FILES` /
  `COPY_DIRS` in the generator.

## Conventions
- Every page is labeled a prototype. The cart takes no
  money and sends nothing; the help desk form sends nothing.
- No phone numbers or "call us" prompts; bulk orders and low-inventory options
  point to the help desk (`index.html#help`). The owner discourages direct
  customer contact.
- Facts and prices come from the current site; never invent claims, awards or
  reviews. Images are drawn illustrations labeled "Illustration. Photography to
  come."
- Fetch the data file with `cache: "no-cache"`.
- A product option with `stock: "low"` is visible but cannot be added to the cart.
- **Design requirement: optimized for AI reading and understanding.** Real
  content, headings and schema.org JSON-LD must be in the HTML a reader gets
  **without running JavaScript**. Met by the generator; do not add content that
  exists only in script-rendered pages, and keep `check_static.py` passing.
  Prices must stay accurate (the data has a read date).
- Every page is `noindex` until the production variant (`--indexable`).

## Working style
- Test after every change: all pages render, cart flows work, nothing scrolls
  sideways at 375 px. Check the live site's files after a deploy; do not trust
  the Actions status alone.
- Commit when asked; do not push unless asked. Check both repos.
