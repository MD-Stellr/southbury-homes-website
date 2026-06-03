# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Multi-page editorial marketing website for Southbury Homes (a Greater Toronto Area luxury homebuilder), built by Stellr Media. Hand-written static site — no build step, no package manager, no framework.

- `index.html` — home: preloader + video hero, then teaser/gateway sections linking to inner pages
- Inner pages (flat at repo root): `communities.html`, `decor-studio.html`, `gallery.html`, `about.html` (Mission + Care + Team), `packages.html` (Harmony + Comfort), `building-your-home.html`, `seasonal-maintenance.html`, `contact.html`
- `partials/_chrome.html` — **reference snippet, never loaded.** The header/footer/mobile-menu markup is duplicated into every page; edit it here first, then copy into each page so the copies don't drift
- `css/style.css` — all styles; design tokens (colors, fonts, spacing) live in `:root`
- `js/main.js` — Lenis smooth-scroll + GSAP scroll animation system (also: dropdown nav, mobile accordion, active-nav-state, preloader)
- `assets/img/`, `assets/video/` — media

### Multi-page conventions

- **Pages live at the repo root** (not a subdir) because asset paths are relative without a leading slash (`css/style.css`, `js/main.js`, `assets/...`). A subdir would 404 them.
- **Shared chrome is duplicated, not injected.** No build/templating — keep header/footer/menu identical across pages by copying from `partials/_chrome.html`.
- **Preloader is home-only.** Inner pages omit the `#preloader` block; `runPreloader()` in `main.js` detects its absence and builds the scene immediately (no replay on navigation).
- **Nav is grouped dropdowns** (Communities ▾ / Design ▾ / Homeowners ▾ / About ▾ / Contact). Cross-page links navigate natively; `data-scroll-link` is only for same-page `#anchors`. Inner-page sections that are dropdown targets carry `id`s (e.g. `#mission`, `#harmony`) and get `scroll-margin-top` so native hash jumps clear the fixed header.
- **Active nav state** is set by JS in `main.js` (matches `location.pathname`) — do not hand-mark it.
- **Inner pages have no video hero;** they use a `.page-hero` title band, and `main.js` keeps the nav `--solid` when no `.hero` is present.

## Commands

- **Preview locally:** `python3 -m http.server 8123`, then open `http://localhost:8123`
- **Deploy:** push to `main` — the site auto-deploys on Vercel as a static site (zero config)

There is no build, test, or lint step.

## Libraries

GSAP 3.12.5 + ScrollTrigger and Lenis 1.0.42 load from CDN `<script>` tags on every page; fonts from Google Fonts. Keep this a zero-dependency static site — do not add `package.json`, npm dependencies, or a bundler.

## Animation system

Scroll animations in `js/main.js` are driven by `data-*` attributes in the HTML. New content must use these attributes or it will not animate:

- `data-reveal` — fade + translate up on scroll
- `data-lines` — heading split into masked lines (handles inline `<em>`)
- `data-stagger` / `data-stagger-item` — staggered children
- `data-img-reveal` — clip-path image reveal
- `data-parallax` + `data-parallax-speed="N"` — scroll parallax
- `data-count` + `data-count-to="N"` — number count-up
- `data-scroll-link` — smooth-scroll for an in-page anchor link

**Critical gotcha:** CSS initial animation states are gated on `html.anim` (added by an inline `<head>` script unless `prefers-reduced-motion`). Never give an element a CSS `transform` with a percentage translate (e.g. `translateY(110%)`) if GSAP later animates its `yPercent` — the browser resolves the `%` to a pixel matrix, GSAP reads it back as a pixel `y`, and the element ends up double-offset (this exact bug hid the hero headline). Set such initial offsets in JS via `gsap.set()`, not CSS.

`js/main.js` includes a full static fallback for `prefers-reduced-motion` — keep it working when adding animations.

## Assets

The hero `<video>` uses `assets/video/hero.mp4` with `assets/img/hero.jpg` as its poster. If the video is replaced, regenerate the poster from a frame of the new video so the two match.

## Git

Commit and push directly to `main` — no branches or PRs. `main` auto-deploys via Vercel.
