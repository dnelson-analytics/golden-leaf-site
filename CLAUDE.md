# Project: Golden Leaf Products site prototype

House standards and how Doug works: the `myAI` repo (private, local
`E:\Code\Repos\myAI`; start with its `skills/doug-dev-environment`). This file
covers only what is specific to this project and wins where they differ.

Public prototype of a rebuilt Golden Leaf Products website. Planning, decisions
and findings live in the private repo `golden-leaf-products` (see its
`docs/working-notes.md` first). This repo is **public**: no owner details,
credentials, customer data, or copied code from the current cart script.

## Stack
- Plain HTML, CSS, JavaScript. No build step, no dependencies. Ask before
  adding either.
- One data file, `data/products.json`, drives the home page karat guide, the
  listing pages (`karat.html`), product pages (`product.html`), and the cart.
  Its structure is described in `golden-leaf-products/docs/working-notes.md`.
- Preview locally: `python -m http.server 8801`.
- Deploy: `.github/workflows/pages.yml` publishes a **named list of files**. Add
  any new page or folder to it.

## Conventions
- Every page is marked `noindex` and labeled a prototype. The cart takes no
  money and sends nothing; the help desk form sends nothing.
- No phone numbers or "call us" prompts; bulk orders and low-inventory options
  point to the help desk (`index.html#help`). The owner discourages direct
  customer contact.
- Facts and prices come from the current site; never invent claims, awards or
  reviews. Images are drawn illustrations labeled "Illustration. Photography to
  come."
- Fetch the data file with `cache: "no-cache"`.
- A product option with `stock: "low"` is visible but cannot be added to the cart.

## Working style
- Test after every change: all pages render, cart flows work, nothing scrolls
  sideways at 375 px. Check the live site's files after a deploy; do not trust
  the Actions status alone.
- Commit when asked; do not push unless asked. Check both repos.
