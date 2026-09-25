# Fable 5 — capability showcase

A single-page, dependency-free demo site that shows off what a frontier AI model can do: streaming code generation, visible reasoning, grounded vision, structured extraction, multilingual output, million-token recall, a prompt-to-UI playground, and a replayable end-to-end agent run.

Everything runs in the browser. There is no build step, no framework, and no API key: the "model output" is scripted client-side so the page works offline and on GitHub Pages.

## Run it

```bash
python3 -m http.server 8080
# open http://localhost:8080/
```

Opening `index.html` directly from disk also works.

## What's on the page

| Section | What it demonstrates | Where |
|---------|----------------------|-------|
| Hero | Pointer-reactive particle field, live task ticker, count-up stats | `js/showcase.js` |
| Skills | Seven looping micro-demos (code stream, reasoning trace, vision, JSON extraction, multilingual, haystack, speed gauge) | `js/skills.js` |
| Playground | Type a prompt → rationale streams → markup streams → a working component mounts (pricing toggle, weather, validated signup form, drag-and-drop kanban, animated sparkline) | `js/playground.js` |
| Agent | Plan → explore → edit → test → ship, with a terminal, live diff, pause/restart/2× controls | `js/agent.js` |
| Benchmarks | Animated grouped bars with a real `<table>` fallback | `js/bench.js` |
| Case study | The previously built **Cyprus Communications** telecom site, embedded live | `cyprus-communications/` |

Press `⌘K` / `Ctrl+K` anywhere for a command palette that jumps to sections and replays demos.

## File map

```
index.html                 the showcase
styles/tokens.css          design tokens (dark theme, aurora accents, type scale)
styles/showcase.css        all layout + component styles
js/showcase.js             shared utils (stream, highlight, run tokens) + chrome, hero canvas, palette
js/skills.js               the seven skill-card demos
js/playground.js           prompt → UI pipeline and component interactivity
js/agent.js                scripted agent timeline player
js/bench.js                benchmark chart + table
cyprus-communications/     the earlier multi-page telecom demo site (unchanged, still self-contained)
```

## Honesty notes

- Benchmark numbers are illustrative and normalised to 0–100. They exist to demonstrate the visualisation, not to report published evaluations.
- Playground and agent transcripts are fixtures. Swapping the fixtures for a real endpoint would leave the UI unchanged.
- User-typed prompts are only ever rendered as text, never as HTML.

## Accessibility

Semantic landmarks and a skip link, keyboard-operable controls, `aria-live` regions for streamed text, a table alternative for the chart, visible focus styles, and full `prefers-reduced-motion` support (every animation collapses to its final state).
