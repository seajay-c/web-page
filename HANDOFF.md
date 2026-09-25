# HANDOFF — Fable 5 capability showcase (work in progress)

> Temporary file for model handoff. **Delete before the PR is marked ready.**

## The task (verbatim from CJ)

> rework the website to show off new ai models skills. you are an expert webdesigner running the lattest and greatest fabel 5 model. spare no expense. build a showcase demo web page

## Interpretation and decisions already made

- The repo was a static GitHub Pages site for a fictional telecom brand, **Cyprus Communications** (plain HTML/CSS/JS, no build step).
- Decision: the root of the site becomes a new **single-page "Fable 5" AI-model capability showcase**. The telecom site was **moved intact** to `cyprus-communications/` via `git mv` (all of its links are relative, so nothing inside it needed changing) and is featured on the showcase as a *case study* with a live embedded iframe.
- Constraints kept: no framework, no bundler, no API calls. All "model output" is **scripted client-side simulation** and the page says so explicitly (Benchmarks footnote, "Under the hood" section, footer). Do not add real benchmark claims.
- Branch: `cursor/ai-model-showcase-b334` (base: `cursor/cyprus-communications-site-68d3`).

## What is DONE (committed on the branch)

| File | Status | Notes |
|------|--------|-------|
| `cyprus-communications/**` | done | Old site, moved, untouched. |
| `styles/tokens.css` | done | Dark theme tokens, aurora accents (violet/cyan/magenta), fonts (Inter Tight / Inter / Instrument Serif / JetBrains Mono). |
| `styles/showcase.css` | done | Full stylesheet for every section incl. playground component styles (`.pg-*`), agent terminal/diff, benchmarks, palette, responsive + reduced-motion. |
| `index.html` | done | Complete markup for all sections. IDs/classes below are what the remaining JS must target. |
| `js/showcase.js` | done | `window.Fable` utils (`stream`, `highlight`, `createRun`, `onVisible`, `escapeHtml`, `reducedMotion`, `actions` registry), header/progress/mobile nav/scroll-spy, reveal, hero canvas particle field, ticker, count-up, card spotlight, ⌘K command palette. |
| `js/skills.js` | done | The 7 bento demos (code stream, reasoning trace, vision, JSON extraction, multilingual, haystack, speed gauge). Each registers a replay in `Fable.actions`. |

`node --check` passes on both JS files. **Nothing has been viewed in a browser yet.**

## What is NOT done (in priority order)

### 1. `js/playground.js` — prompt → live UI (section `#playground`)
Referenced by `index.html`, does not exist yet. Expected behaviour:
- Elements: `#chat-log`, `#chips` (buttons with `data-prompt`), `#chat-form`, `#chat-input`, `#chat-send`, stage tabs `[data-stage-tab="preview|code"]` (`aria-selected`), panes `#pane-preview` / `#pane-code` (`hidden` attr), mount target `#pg-preview`, code target `#pg-code`, `#stage-meta`, `#stage-status` (`.tag`, set to `tag--magenta` while building, `tag--live` when mounted).
- Flow on submit/chip: append user `.msg.msg--user` → append AI `.msg.msg--ai` with `.thinking` dots → `Fable.stream` a one-paragraph narration → stream code into `#pg-code` via `Fable.highlight(code, "html")` → mount HTML into `#pg-preview` inside a `<div class="pg-mount">` → status `mounted`. Disable chips/send while running; use `Fable.createRun` so a new prompt cancels the previous.
- Five scripted templates, keyword-matched against the prompt (`pricing|price|plan`, `weather|forecast`, `signup|sign up|form|login|register`, `kanban|board|todo|task`, `chart|revenue|sparkline|graph`). Fallback: `.pg-note` echoing the prompt **as text** (`Fable.escapeHtml`), never as HTML.
- CSS already exists for each template — use these class names:
  - Pricing: `.pg-pricing`, `__top`, `__name`, `__toggle` (two buttons with `aria-pressed`), `__price` (+`<small>`), `__save`, `<ul>` features, `__cta`. Toggle must actually switch monthly/yearly price (€39 vs €31 with "save 20%").
  - Weather: `.pg-weather`, `__head`, `__city`, `__cond`, `__temp`, `__sun`, `__days` (5 `<div>` with `<span>`day, `<b>`temp, `<span>`cond), `__bar > i` with `--w`.
  - Form: `.pg-form`, `.pg-field` (+`.is-invalid`, `<small>` error), `.pg-strength[data-level=0-4] > i×4`, submit button, `.pg-success`. Wire real validation (email regex, password ≥ 8, live strength meter).
  - Kanban: `.pg-kanban > .pg-col×3` (`__head`, `__count`), `.pg-task[draggable]` with `.pg-task__tag--bug|feat|docs`; HTML5 DnD, `.is-over` on column, `.is-dragging` on task, update counts.
  - Chart: `.pg-chart`, `__head`, `__title`, `__value`, `__delta`, inline `<svg>` with `path.area` (fill `url(#pg-area)`, gradient already defined in `index.html`) and `path.line`, `__months`.
- Use event delegation on `#pg-preview` for component interactivity.

### 2. `js/agent.js` — replayable agent run (section `#agent`)
- Elements: steps `#agent-steps .step[data-step=plan|explore|edit|test|ship]` (classes `.is-active` / `.is-done`), `#agent-toggle` (Pause/Resume), `#agent-restart`, `#agent-speed` (1×/2×, `aria-pressed`), `#agent-status`, `#terminal` (append `.tl` lines: `tl--cmd`, `tl--head`, `tl--out`(default), `tl--ok`, `tl--warn`, `tl--dim`, `tl--link`, `tl--done`), `#agent-tools` counter, `#diff-file`, `#diff-stats` (`<span class="add">+14</span> <span class="del">−2</span>`), `#diff` (rows `.dl.dl--hunk|ctx|add|del` with `<span class="dl__n">` + `<span>`).
- Scenario (matches the case-study repo): ticket *"Contact form accepts an empty email — add validation and a test."* Plan → `rg` for the form → read `js/forms.js` → edit (diff appears line by line) → run tests (one fails first, then passes after a fix) → `git commit` + `gh pr create` → `tl--done` summary. Auto-start via `Fable.onVisible`, respect pause/speed, reduced motion = render everything instantly. Register `Fable.actions.agent = { label: "Replay agent run", run }`.

### 3. `js/bench.js` — animated bars + table fallback (section `#benchmarks`)
- Elements: `#bench-legend`, `#bench-rows` (`.bench-row` → `__label` (+`<small>`) and `.bars` → `.bar > .bar__fill[style="--v:..;--c:..;--i:.."] + .bar__val`), `#bench-toggle` (`aria-pressed`, toggles `#bench-table[hidden]` vs rows), `#bench-table-head`, `#bench-table-body`.
- Series: Fable 5 (`--c: var(--violet)`), Fable 4 (`var(--cyan)`), Prior gen (`var(--text-3)`). Rows (illustrative, 0–100): Graduate-level reasoning 91/78/64 · Repository-scale coding 87/69/52 · Multimodal understanding 84/71/58 · Agentic tool use 89/66/41 · 1M-token recall 96/80/49. Add `.is-in` to `.bars` on visibility to animate.

### 4. Root `README.md`
Short: what the page is, how to run (`python3 -m http.server 8080`), file map, honesty note about simulated output, link to `cyprus-communications/`.

### 5. Update moved docs
`cyprus-communications/docs/github-pages.md` says the site deploys from repo root — add a note that it now lives under `cyprus-communications/`. Optionally mention in `cyprus-communications/docs/README.md`.

### 6. Browser verification (not started)
`python3 -m http.server 8080` in tmux, then check with the computerUse subagent / screenshots: hero canvas, all 7 demos, playground templates, agent replay controls, benchmark toggle, iframe case study, ⌘K palette, mobile width (≤800px), `prefers-reduced-motion`. Fix layout issues. Take walkthrough screenshots for the PR.

### 7. Finish
Delete this file, commit, push, update the draft PR (`ManagePullRequest`, branch `cursor/ai-model-showcase-b334`).

## Conventions to keep
- IIFE + `"use strict"`, ES5-ish style, no modules, no external libs.
- Never inject user text as HTML.
- Every demo: start on visibility, cancellable via `Fable.createRun`, instant under reduced motion, replay hook in `Fable.actions`.
- No emojis in content; no narrating comments.
