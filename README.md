# Cyprus Communications LLC

A static marketing page for a fictional managed-service provider. The firm runs a retained IT desk for businesses and designs telecom routes in the public right-of-way, including 3D drawings and permit packages.

The company, staff, addresses, phone numbers, and statistics are invented for this demo.

## Run it

```bash
python3 -m http.server 8080
# open http://localhost:8080/
```

Opening `index.html` from disk also works. Paths are relative, so the same files deploy on GitHub Pages from the repository root.

## What is on the page

| Section | What it shows |
|---------|----------------|
| Services | Managed IT retainer, and right-of-way design and permitting |
| Support | Scripted desk work: runbook, incident trace, survey markup, ticket from email, status line, knowledge-base search, time to first response |
| Desk | Scripted replies that mount a plan card, portal sign-in, ticket board, ticket chart, or permit status |
| Incident | Replay of ticket 1842, with pause, restart, and 2× |
| Proof | Illustrative service levels, as bars or a table |
| Consult | A form that stays in the browser and does not send anything |

`cyprus-communications/` is an earlier fiber-retail demo. It is not linked from this page.

## File map

```
index.html            the page
styles/tokens.css     colour, type, spacing
styles/showcase.css   layout
js/showcase.js        header, hero field, command palette, consult form
js/skills.js          support panels
js/playground.js      desk tools
js/agent.js           incident replay
js/bench.js           service-level chart
```
