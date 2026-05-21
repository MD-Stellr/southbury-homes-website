---
name: preview
description: Serve the Southbury Homes site locally and capture desktop + mobile screenshots in a real browser to verify visual changes. Use after editing index.html, css/style.css, or js/main.js, or when the user asks to preview, screenshot, or visually check the site.
---

# Preview the site

Verify the site visually by serving it locally and screenshotting it in a real browser. The site is animation-heavy (Lenis + GSAP), so static reasoning is not enough — actually render it.

## 1. Serve the site

From the project root, ensure a static server is running:

```bash
curl -s -o /dev/null http://localhost:8123/ && echo "up" || (python3 -m http.server 8123 >/dev/null 2>&1 & sleep 1)
```

## 2. Set up Playwright (temp dir, uses installed Chrome)

Install the Playwright package in a temp directory so the project stays dependency-free. Use `channel: 'chrome'` — this drives the already-installed Google Chrome, so no browser download is needed.

```bash
mkdir -p /tmp/sbh-preview && cd /tmp/sbh-preview && npm ls playwright >/dev/null 2>&1 || npm i playwright >/dev/null 2>&1
```

## 3. Capture screenshots

Write a script to `/tmp/sbh-preview/shot.js` that:

- Launches `chromium.launch({ channel: 'chrome', headless: true })`.
- Collects `console` messages of type `error` and `pageerror` events (ignore the expected favicon 404).
- **Desktop:** context at 1440×900 → `goto('http://localhost:8123')` → `waitForTimeout(5000)` (preloader ~1.7s + hero intro) → screenshot. To inspect lower sections, scroll with `page.mouse.wheel(0, 480)` in a loop with short waits (Lenis intercepts wheel events; `window.scrollTo` does not drive it reliably).
- **Mobile:** context at 390×844, `deviceScaleFactor: 2`, `isMobile: true` → same load wait → screenshot. Test the menu by clicking `#navToggle`.
- Saves PNGs to `/tmp/sbh-shots/`.

Run it, then convert PNGs to JPEG so they are easy to view:

```bash
cd /tmp/sbh-shots && for f in *.png; do sips -s format jpeg -s formatOptions 84 "$f" --out "${f%.png}.jpg" >/dev/null 2>&1; done
```

## 4. Review and report

Read the JPEG screenshots. Report any console/page errors. The page-heavy screenshots may render small in the Read tool — converting to JPEG (above) keeps them legible.

## 5. Clean up

```bash
rm -rf /tmp/sbh-preview /tmp/sbh-shots
```

Leave the `python3 -m http.server` running if the user may want to keep previewing; otherwise stop it.

## Notes

- The preloader covers the screen for ~1.7s — always wait it out before the first screenshot.
- A static screenshot cannot show scroll-triggered motion mid-flight; scroll the page to trigger reveals, then capture.
- To test the reduced-motion fallback, use a context with `reducedMotion: 'reduce'`.
