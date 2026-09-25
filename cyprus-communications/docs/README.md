# Cyprus Communications — documentation

Static multi-page showcase for a fictional telecom brand. No build step; open any HTML file or deploy to GitHub Pages.

This site lives under `cyprus-communications/` in the repository. The repository root is the [Fable 5 capability showcase](../../index.html), which features this site as a case study of an end-to-end build.

## Dual design modes

| Mode | Where | Feel |
|------|--------|------|
| **Cinematic landing** | `index.html` only | Apple-inspired storytelling, full-bleed media, landing motion |
| **Traditional corporate** | Every other page | Breadcrumbs, catalogs, forms, side related-nav |

Read [design-system.md](design-system.md) for tokens, typography, and what *not* to put on the landing page.

## Site map

See [information-architecture.md](information-architecture.md) or the live [Site Directory](../sitemap.html).

## Customize quickly

1. **Brand colors / type** — edit `styles/tokens.css`
2. **Chrome (nav/footer)** — `styles/layout.css` + shared markup in each HTML file
3. **Landing look/motion** — `styles/landing.css` + `js/landing-motion.js`
4. **Forms** — pages with `data-validate="demo"` + `js/forms.js`
5. **Copy & invent data** — edit the HTML under `services/`, `about/`, `careers/`, `contact/`

## Which JS loads where

| File | Pages |
|------|--------|
| `js/main.js` | All pages (mobile nav, active states, header scroll) |
| `js/forms.js` | `contact/index.html`, `careers/apply.html` |
| `js/landing-motion.js` | `index.html` only |

## Deploy

Follow [github-pages.md](github-pages.md). The empty `.nojekyll` file at the repo root tells GitHub Pages to skip Jekyll processing.

## Accessibility baselines

- Skip link on every page
- Semantic landmarks (`header`, `nav`, `main`, `footer`, `aside`)
- Visible focus styles via `base.css`
- Keyboard-friendly mobile menu (`aria-expanded`, Escape to close)
- Forms: labels, required markers, client-side error text, success alerts

All names, addresses, phones, jobs, and awards are **invented for demo purposes**.
