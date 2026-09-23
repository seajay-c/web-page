# Design system — landing vs traditional

Cyprus Communications ships **one brand**, **two layout modes**. Shared tokens keep color and type families aligned; mode-specific CSS changes hierarchy and density.

## Brand tokens (`styles/tokens.css`)

| Token role | Value idea |
|------------|------------|
| Aegean navy | Authority, telecom trust (`--color-navy`) |
| Signal cyan | Live network / CTAs (`--color-cyan`) |
| Off-white | Calm reading canvas (`--color-offwhite`) |
| Display font | Outfit — expressive landing headlines |
| Body font | Source Sans 3 — UI and long-form |

Change brand identity here first; both modes inherit automatically.

## Landing mode (`index.html` + `landing.css`)

**Intent:** Cinematic, brand-first first viewport.

Rules enforced in the plan and CSS comments:

- Brand wordmark is a **hero-level** signal (not only nav text)
- First viewport budget: brand + one headline + one support line + one CTA group + full-bleed image
- **No** cards, stats strips, overlay badges, or secondary promo blocks in the hero
- Scroll story sections use edge-to-edge imagery with gradient overlays
- Motion: nav blur on scroll, hero fade-in, section reveal; respects `prefers-reduced-motion`

Load order on the landing page:

```
tokens → base → layout → components → landing
```

## Traditional mode (all other pages + `traditional.css`)

**Intent:** Easy to scan and navigate — industry-standard telecom/corporate patterns.

Patterns:

- Sticky header with primary + utility nav
- Breadcrumbs on every subpage
- Page title + short lede
- Optional 2-column shell: content + related links sidebar
- Cards / tables / job lists / timelines where they aid scanning
- Forms with labels, required fields, validation messages, success state
- Footer with contact block, legal stubs, link to Site Directory

Load order on subpages:

```
tokens → base → layout → components → traditional
```

## Components shared by both

Buttons, alerts, and form controls live in `components.css`. The landing page reuses `.btn` styles but intentionally avoids card grids in the first viewport.

## Do not

- Apply Apple-style full-bleed storytelling CSS to About, Services, Careers, or Contact
- Put stats or award chips on the landing hero
- Introduce a build bundler — this demo stays plain HTML/CSS/JS for GitHub Pages
