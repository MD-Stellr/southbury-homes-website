# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page editorial marketing website for Southbury Homes (a Greater Toronto Area luxury homebuilder), built by Stellr Media. Hand-written static site — no build step, no package manager, no framework.

- `index.html` — all markup, one page
- `css/style.css` — all styles; design tokens (colors, fonts, spacing) live in `:root`
- `js/main.js` — Lenis smooth-scroll + GSAP scroll animation system
- `assets/img/`, `assets/video/` — media

## Commands

- **Preview locally:** `python3 -m http.server 8123`, then open `http://localhost:8123`
- **Deploy:** push to `main` — the site auto-deploys on Vercel as a static site (zero config)

There is no build, test, or lint step.

## Libraries

GSAP 3.12.5 + ScrollTrigger and Lenis 1.0.42 load from CDN `<script>` tags in `index.html`; fonts from Google Fonts. Keep this a zero-dependency static site — do not add `package.json`, npm dependencies, or a bundler.

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

## Preview mode

`<body class="preview">` gates the public site to Hero → Philosophy → Craftsmanship → Break, plus the Footer. All other sections — and any nav/footer link pointing to them — stay in the markup but are hidden via the `PREVIEW MODE` block in `css/style.css`. Remove `class="preview"` from the `<body>` tag to publish the full site.

## Assets

The hero `<video>` uses `assets/video/hero.mp4` with `assets/img/hero.jpg` as its poster. If the video is replaced, regenerate the poster from a frame of the new video so the two match.

## Git

Commit and push directly to `main` — no branches or PRs. `main` auto-deploys via Vercel.
