# Campus Wayfinder — Front Gate → Venue Interactive Guide

**Date:** 2026-07-02
**Status:** Draft for review
**Feature:** An interactive, step-by-step wayfinding guide that walks EBISION attendees from Kookmin University's Main Gate to the venue buildings, rendered as an overlay on Kookmin's official campus illustration.

---

## 1. Context & Goal

The EBISION 2026 conference is hosted at Kookmin University (see `data/{year}/{locale}/venue.json`). The existing `modules/landing/home/components/Venue.tsx` gives macro location info (address, transportation blurb, a small Google Maps iframe, "Get Directions" links). What it lacks is **on-campus wayfinding**: once an attendee reaches the campus, how do they get from the Main Gate to the right building and floor?

Kookmin's campus climbs a hillside, which is exactly why the university publishes an **isometric illustrated map** rather than a flat geographic one (`https://english.kookmin.ac.kr/visit/map`). We want a guide that is **super accurate to that official map**, not an approximation.

**Goal:** a step-by-step interactive guide overlaid on Kookmin's real campus illustration that routes attendees Main Gate → venue cluster, tagging each venue building with its role (paper sessions / keynotes / lunch).

## 2. Decisions locked during brainstorming

| Decision | Choice |
|---|---|
| Rendering style | **Illustrated campus guide** (not Mapbox/Leaflet geo map, not a hand-simplified sketch) |
| Interactivity | **Step-by-step** — a side/stacked panel with Back/Next that highlights one leg + spotlights the active building |
| Base artwork | **Self-host Kookmin's official map** in `/public`, credited "Map © Kookmin University" |
| Architecture | **Base-image-agnostic overlay** — the campus picture is a swappable background; route/pins/steps live in a separate SVG layer driven by a coordinate config |
| Custom art | **Ship on official map now; our own illustration swaps in later (v2)** with just an image swap + coordinate recalibration — overlay/route code unchanged. *(Chosen as default while user was away; confirm on review.)* |
| Mapbox token | **Not used by this feature.** `MAPBOX_PUBLIC_TOKEN` in `.env` stays unused unless a real geo map is added elsewhere. (If ever used client-side, must be `NEXT_PUBLIC_`-prefixed and declared in the t3-env schema.) |

### Route anchors (from Kookmin's official building directory)

| Map # | Official name | EBISION role | Pin kind |
|---|---|---|---|
| **25** | Main Gate (Security Office) | 🚶 Route start | `gate` |
| **1** | Administration Hall | 📄 Paper Sessions — 5F, rooms 501/502/506 | `primary` |
| **11** | International Hall | 🎤 Main Conference Hall — 1F (keynotes/plenary) | `venue` |
| **4** | College of Law | 🍽️ Lunch — 5F | `venue` |

## 3. Non-goals (YAGNI)

- No real geographic/tile map (Mapbox/Leaflet/Google) inside the wayfinder. The existing Venue Google Maps iframe already covers "how to reach the campus."
- No turn-by-turn GPS or live location.
- No editing UI for placing pins — coordinates are authored in config.
- No per-year multi-venue abstraction yet (single Kookmin venue). Config is structured so it *can* be promoted to per-year data later, but we don't build that now.
- v2 custom illustration is **out of scope for this spec's implementation**; the architecture only reserves the swap seam.

## 4. Architecture

### 4.1 Layering model

```
┌─────────────────────────────────────────────┐
│ CampusWayfinder (section wrapper, server)    │  loads config + i18n strings
│  ┌────────────────────────┐ ┌─────────────┐  │
│  │ WayfinderStage (client) │ │ Wayfinder   │  │
│  │  <img> base map          │ │ Steps        │  │  Back / Next / step list
│  │  <svg> overlay:          │ │ (client)     │  │  tap step ↔ tap pin sync
│  │   - spotlight dim mask   │ └─────────────┘  │
│  │   - animated route path  │                  │
│  │   - numbered/star pins   │   shared activeStep state (lifted)
│  └────────────────────────┘                    │
│  credit: "Map © Kookmin University"            │
└─────────────────────────────────────────────┘
```

- **Base layer:** `<img src="/assets/venue/kookmin-campus.png">` sized responsively (`width:100%; height:auto`).
- **Overlay layer:** an absolutely-positioned `<svg>` with `viewBox="0 0 {imgW} {imgH}"` and `preserveAspectRatio="none"`, so every pin coordinate is expressed in **image-pixel space** and scales exactly with the image at any width (including mobile). This is the crux of "super accurate": pins are pinned to the artwork, not to screen pixels.
- **Swap seam (v2):** replacing `kookmin-campus.png` with `our-campus.svg` requires only (a) a new image, (b) new `imageW/imageH`, and (c) recalibrated pin/waypoint coords in config. No component code changes.

### 4.2 Interaction model (step-by-step)

- Component holds `activeStep` state (0-indexed). Default = step 0 (Main Gate).
- Each step: highlights its **route segment** (the path drawn brighter/animated up to that leg) and **spotlights** its focus pin (dim mask over the rest, pulse ring on the pin).
- Controls: **Back / Next** buttons; clicking a **step row** jumps to it; clicking a **pin** on the map selects its step (two-way sync).
- Accessibility: steps are a keyboard-navigable list (`role="list"`, arrow-key / Tab support), Back/Next are real `<button>`s, pins are focusable with `aria-label`. Respect `prefers-reduced-motion` (disable path animation + pulse, keep static highlight).
- Mobile: image on top, steps stacked below; pins remain tappable.

### 4.3 Coordinate calibration (the "accurate" work)

Coordinates are authored **once** against the shipped image's intrinsic size (currently 767×505 for the shared asset; re-measure if a higher-res official file is obtained).

Calibration method, in priority order:
1. **Extract from Kookmin's image-map** — their page uses `<area coords="…">` hotspots per building. Fetch the raw HTML (not markdown-converted) and read the polygon/rect coords for buildings 25, 1, 11, 4, then scale to our image's dimensions. This yields pixel-exact centers.
2. **Direct measurement fallback** — if raw `<area>` coords are unavailable, measure pin centers on the image directly and record them.

Route **waypoints** (the walking path) are authored by hand as a small ordered list of `{x,y}` following the campus roads on the illustration; steps reference sub-ranges of it.

### 4.4 Config shape

Geometry is **locale-independent** → authored as a typed TS module. Step **text** is **localized** → lives in i18n messages. This keeps coordinates out of translation files and translations out of geometry.

`constants/wayfinder.ts` (or `modules/landing/home/components/wayfinder/wayfinder.config.ts`):

```ts
export interface WayfinderPin {
  id: string;              // "gate" | "paper" | "keynote" | "lunch"
  building: number;        // Kookmin map number (25, 1, 11, 4)
  officialName: string;    // "Administration Hall"
  kind: "gate" | "primary" | "venue";
  x: number; y: number;    // image-pixel coords
}

export interface WayfinderStep {
  id: string;              // matches an i18n key under "Wayfinder.steps"
  focusPinId: string;      // pin to spotlight
  segment: [number, number]; // waypoint index range to draw for this leg
}

export interface WayfinderConfig {
  image: { src: string; width: number; height: number; creditKey: string };
  waypoints: { x: number; y: number }[]; // full path, gate → primary venue
  pins: WayfinderPin[];
  steps: WayfinderStep[];
}
```

i18n (`messages/en.json` + `messages/kr.json`) new namespace:

```jsonc
"Wayfinder": {
  "sectionLabel": "Getting Around",
  "title": "From the Main Gate to the Venue",
  "credit": "Map © Kookmin University",
  "back": "Back", "next": "Next",
  "steps": {
    "gate":    { "title": "Enter the Main Gate", "body": "…" },
    "climb":   { "title": "Head uphill into campus", "body": "…" },
    "paper":   { "title": "Paper Sessions", "body": "Administration Hall (Bldg 1), 5th floor — rooms 501 / 502 / 506." },
    "nearby":  { "title": "Nearby venues", "body": "Keynotes at International Hall (Bldg 11); lunch at College of Law (Bldg 4), 5F." }
  }
}
```

Building **official names** are English/Korean → keep the Korean names in `kr.json` bodies; the numeric `building` + `officialName` in config are the English canonical.

## 5. Component breakdown

| Unit | Type | Responsibility | Depends on |
|---|---|---|---|
| `CampusWayfinder` | Server | Load config + `getTranslations("Wayfinder")`, pass plain props down | config, next-intl |
| `WayfinderClient` | Client | Own `activeStep` state; compose Stage + Steps | props only |
| `WayfinderStage` | Client | Render `<img>` + `<svg>` overlay (mask, route, pins); emit pin clicks | activeStep, config |
| `WayfinderSteps` | Client | Step list + Back/Next; emit step selection | activeStep, strings |
| `wayfinder.config.ts` | Data | Kookmin 2026 geometry (pins, waypoints, steps) | none |

Each is independently testable: the stage is a pure function of `(config, activeStep)`; the step controls are a pure function of `(strings, activeStep)`; state lives only in `WayfinderClient`.

## 6. Placement / integration

- Render `<CampusWayfinder year={year} />` **within the venue area**, as a new block below the "Getting There" transportation text in `Venue.tsx` (or as a sibling section on the venue/overview page). It complements — does not replace — the existing Google Maps iframe, which stays for macro/geo directions.
- Keep it in its own component + config so `Venue.tsx` stays focused; `Venue.tsx` only adds one import + one element.

## 7. Accessibility & responsive

- SVG pins: `role="button"`, `aria-label` (e.g. "Paper Sessions, Administration Hall, building 1"), focus ring, Enter/Space activate.
- Steps: keyboard list; Back/Next disabled at ends.
- `prefers-reduced-motion`: no path-draw animation, no pulse; static highlight instead.
- Contrast: pins use dark fill + white text + white stroke for legibility over the light map.
- Mobile: single column (map then steps); tap targets ≥ 40px.

## 8. Licensing / attribution

- Self-host the map; always render the "Map © Kookmin University" credit near the component.
- **Action for user:** confirm the EBISION organizers have permission (as host venue) to reuse Kookmin's campus illustration, or obtain the official high-res asset with an OK. The v2 custom-illustration path exists to remove this dependency entirely.

## 9. Testing (vitest)

- **Config validity:** every `step.focusPinId` exists in `pins`; every `pin` coord is within `[0,width]×[0,height]`; `segment` ranges are within `waypoints` bounds.
- **Step reducer:** next/prev clamp at ends; pin-click selects the correct step.
- **Render smoke test:** `WayfinderStage` renders one `<img>`, N pins, and a route `<path>`; active pin gets the spotlight/pulse markup.
- **i18n presence:** `Wayfinder` keys exist in both `en.json` and `kr.json`.

## 10. Open questions to confirm on review

1. **Sequencing** (asked while you were away, defaulted to "ship official now, custom later") — confirm, or switch to "custom required at launch" / "trace theirs into owned art now."
2. **Placement** — inside `Venue.tsx` as a new block (proposed) vs. its own section on the overview page vs. a dedicated route page.
3. **Higher-res asset** — is the shared 767×505 image the final base, or will you get Kookmin's full-res `map_img` file? (Affects crispness on large screens.)
4. **Route granularity** — the 4-step breakdown (gate → climb → paper sessions → nearby venues), or split keynotes/lunch into their own steps (6 steps)?
5. **Step copy** — provide real walking directions ("past the library, bear right at the statue…"), or I draft placeholder copy for you to refine?
