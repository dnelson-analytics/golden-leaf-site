# Golden Leaf Products - site prototype

A public, work-in-progress prototype of a rebuilt Golden Leaf Products
website. It is not the live store and takes no orders. Planning and
decisions live in a separate private repo.

## Stack

Plain HTML, CSS and JavaScript. No build step and no dependencies.

## Layout

| Path | Contents |
|---|---|
| `index.html` | Placeholder home page (marked `noindex`) |
| `css/` | Styles |
| `js/` | Scripts |
| `assets/` | Images and other files |

## Deploying

`.github/workflows/pages.yml` publishes `index.html`, `assets/`, `css/` and
`js/` to GitHub Pages on every push to `main`. One-time setup in the repo's
Settings > Pages: set Source to "GitHub Actions".

Everything in this repo, including its history, is public: no owner details,
credentials, or customer data belong here.
