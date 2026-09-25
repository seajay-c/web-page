# Deploying to GitHub Pages

> **Location note.** This folder is an earlier fiber-retail demo. It is not linked from the managed-services page at the repository root. The folder stays self-contained, with relative paths, at `<pages-url>/cyprus-communications/`.

This site is static and needs no build command.

## One-time setup

1. Push the site to the `main` branch (or your preferred default).
2. On GitHub: **Settings → Pages**.
3. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: `main` (or your default)
   - Folder: `/ (root)`
4. Save. Pages builds within about a minute.

## Why `.nojekyll` exists

GitHub Pages runs Jekyll by default. An empty `.nojekyll` file at the repo root disables Jekyll so files and folders that Jekyll would ignore (for example paths starting with `_`) are published as-is. Safe to keep even if you do not use underscore folders.

## Relative paths

Nested folders (`services/`, `about/`, etc.) use relative URLs (`../styles/...`, `../js/...`). That works for:

- User sites (`username.github.io`)
- Project sites (`username.github.io/repo-name/`)
- Opening files locally via `file://` or a simple static server

Avoid root-absolute asset paths like `/styles/tokens.css` on project Pages — they resolve to the domain root, not the repo.

## Local preview

```bash
# From the repo root — any static server works
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.

## Checklist after deploy

- [ ] Landing hero image loads (Unsplash CDN must be reachable)
- [ ] Nested pages resolve CSS/JS (visit `services/fiber.html`)
- [ ] Mobile menu opens/closes
- [ ] Contact and Apply forms show validation + success (no network call)
- [ ] `sitemap.html` lists every HTML page
