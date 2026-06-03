# Southbury Homes — Site Map & Sections

A breakdown of the multi-page site: the shared chrome, then each page top-to-bottom.

---

## Shared chrome (every page)

- **Header / nav** — Southbury wordmark + grouped dropdown nav: **Communities ▾**, **Design ▾**, **Homeowners ▾**, **About ▾**, **Contact**. Phone + Inquire on the right; hamburger on smaller screens. Transparent over the home hero, solid (bone) on inner pages. The current page is auto-highlighted by `main.js`.
- **Mobile overlay menu** — full-screen dark menu; grouped items expand as accordions, Contact is a direct link.
- **Footer** — white logo, newsletter signup, three link columns (Explore / Homeowners / Contact), address, Stellr credit, back-to-top.
- **Scroll progress bar** — thin bronze fill across the top.
- **Preloader** — **home only.** 0 → 100 intro that covers first paint, then reveals the hero. Inner pages skip it and render immediately.

Chrome markup is duplicated into each page from `partials/_chrome.html` (the never-loaded source of truth).

---

## `index.html` — Home

1. **Hero** — full-bleed looping video, headline *"Masterful construction. Exceptional living."*, CTAs *Explore Communities* + *Our Philosophy*.
2. **Philosophy** — editorial statement + three pillars (Craftsmanship, Design, Sustainability).
3. **Craftsmanship feature** — *No. 01 — The Craft*; links to *Building Your Home*.
4. **Parallax quote break** — *The Southbury Standard*.
5. **Communities teaser** — King Oak Estates + Victoria Crown Collection, linking to `communities.html`.
6. **Programs teaser** — Harmony + Comfort+ cards, linking to `packages.html`.
7. **Your Home, Our Care** — *No. 02 — The Care* feature + four animated stats; links to `about.html#care`.
8. **Explore gateways** — six cards routing to Décor Studio, Gallery, Building Your Home, Seasonal Maintenance, Our Team, Contact.
9. **Contact CTA band** — *Begin a conversation* → `contact.html`.

---

## `communities.html` — Communities

- **Page hero** — *Distinguished addresses across the GTA.*
- **`#now-selling`** — King Oak Estates (Richmond Hill) and Victoria Crown Collection (Markham) as `.project` cards → register via Contact.
- **`#coming-soon`** — "imagery coming" state announcing Northern Ridge and further releases → register for first access.
- **`#past`** — roster of past communities (Estates of Oak Ridges, Naughton Meadows, Daniel Estates, The Lakes House).
- Contact CTA band.

> Community names/stages/dates came from the client email with OCR typos — **confirm before publishing.**

## `decor-studio.html` — Décor Studio

Page hero, a statement + three-step process (Consultation / Curation / Realization), a "studio portfolio coming" state, Contact CTA.

## `gallery.html` — Gallery

Page hero + elegant "gallery is being curated" coming-state (no placeholder photos yet) + Contact CTA.

## `about.html` — About

- **Page hero** — *Twenty years of building to a single standard.*
- **`#mission`** — Our Mission statement + prose.
- **`#care`** — Your Home, Our Care feature + stats row.
- **`#team`** — Our Team: sticky intro + seven-person leadership roster.
- Contact CTA band.

## `packages.html` — Homeowner Programs

- **Page hero** — *Comfort and care, built in.*
- **`#harmony`** — Harmony Package feature + inclusions (HRV, low-VOC paints, low-flow fixtures, LED, 96% furnace, ENERGY STAR thermostat).
- **`#comfort`** — Comfort Package feature + inclusions (automation hub, smart lock, lighting, thermostat, water-leak sensor).
- Contact CTA band.

## `building-your-home.html` — Building Your Home

Page hero, a 10-step numbered timeline (foundation → final walk-through), an "after you move in" note (landscaping/paving/fencing), Contact CTA.

## `seasonal-maintenance.html` — Seasonal Maintenance

Page hero + four season blocks (Spring / Summer / Fall / Winter), each with category checklists, Contact CTA.

## `contact.html` — Contact

- **Page hero** — *Begin a conversation.*
- Contact details + inquiry form (name, email, phone, area of interest, message; styled, no backend).
- **Visit us** — static styled map block + *Get Directions* link (no third-party iframe).
