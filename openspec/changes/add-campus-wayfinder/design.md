## Context

MOBISEC 2026 is at Kookmin University. The existing `Venue.tsx` renders address, transportation, and a small Google Maps iframe — good for reaching the campus, useless once you're at the gate. This change adds on-campus wayfinding: an interactive Mapbox GL map that walks attendees from the Main Gate to the venue cluster.

> Design history: an earlier iteration overlaid a route on Kookmin's static isometric illustration. It was rejected as too static; this design replaces it with a live Mapbox map. The step-by-step structure and config-driven approach carried over. See `docs/superpowers/specs/2026-07-02-campus-wayfinder-design.md` for the original.

Route anchors (coords from OpenStreetMap; route from Mapbox Directions, walking):

| # | Building (OSM) | Role | lng, lat |
|---|---|---|---|
| 25 | Main Gate 정문 | Route start | 126.994688, 37.611148 |
| 11 | International Hall 국제관 | Paper Sessions 5F (501/502/506) | 126.996967, 37.611212 |
| 1 | Administration Hall 본부관 | Main Conf. Hall 1F | 126.997533, 37.611635 |
| 4 | College of Law 법학관 | Lunch 5F | 126.998278, 37.611283 |

> Markers display **simple sequential stop numbers** (1 gate → 2 paper → 3 keynote → 4 lunch), not the official building numbers above. The route ends at the Paper Sessions pin (#11 / stop 2), the primary destination.

## Goals / Non-Goals

**Goals:**
- Interactive on-campus wayfinding, Main Gate → venue cluster, on a real map.
- Step-by-step guided experience: advancing eases the map to the focused building and reveals that leg of the route.
- Accurate real-world coordinates + real walking path.
- Config-driven so coordinates/route are data.

**Non-Goals:**
- No 3D tilt / camera fly-through (top-down only, per decision).
- No GPS/live location, no in-app pin-editing UI, no per-year multi-venue abstraction yet.

## Decisions

**D1 — Mapbox GL, top-down.** Real interactive basemap (pan/zoom) with a walking route and building markers. Mapbox **Standard** style (`mapbox://styles/mapbox/standard`), `pitch: 0`. *Why over the static illustration:* the static overlay read as flat; a live map with an animated route and per-step map focus is genuinely interactive and shows the hillside streets. *Alternative:* full 3D + camera fly-through — deferred by choice (kept top-down for simplicity/legibility).

**D2 — Geographic config, not code.** One typed `WayfinderConfig` holds the map view, the walking `route` (GeoJSON coords from Mapbox Directions), `pins` (lng/lat), and `steps` (focus pin + revealed route segment + zoom). Swapping venues/coords is a data change. *Why:* keeps the component generic and testable via pure helpers + a validator.

**D3 — Geometry in TS, step text in i18n.** Coordinates are locale-independent (`constants/wayfinder.ts`); step titles/bodies + marker labels are localized (`Wayfinder` namespace in `messages/{en,kr}.json`). Matches the repo's `getTranslations`/`useTranslations` split.

**D4 — Thin client island.** `CampusWayfinder` (server) loads config + `getTranslations`; `WayfinderClient` (client) owns `activeStep`; `WayfinderMap` (client) owns the mapbox instance and reacts to `activeIndex` via a ref-held `applyActive` (map created once in a mount effect); `WayfinderSteps` (client) is the list + Back/Next. Two-way sync: selecting a step focuses its marker; clicking a marker selects its step.

**D5 — Token via `NEXT_PUBLIC_MAPBOX_TOKEN`.** Browser map tokens must be `NEXT_PUBLIC_`-prefixed to be inlined into client code. The repo has no central t3-env schema, so it's read directly from `process.env`. Attribution is handled by Mapbox's built-in control.

**D6 — Placement inside `Venue.tsx`, complementing the iframe.** One import + one block; the Google Maps iframe stays for macro directions.

## Risks / Trade-offs

- **[Token exposure]** → A `pk.*` token is public by design; protect with a Mapbox URL restriction for production (documented in `.env.example`).
- **[Map fails to load / no token]** → Component renders a localized "map unavailable" fallback instead of crashing.
- **[WebGL/SSR]** → Map inits client-side only (mount effect); SSR renders just the container. Tests mock `mapbox-gl` (no WebGL in the test env).
- **[Coordinate drift]** → Building coords from OSM, route from Mapbox Directions; config validator asserts referential integrity + coordinate sanity. Easy to nudge (each pin is one line).
- **[Motion/accessibility]** → Marching-ants animation + camera easing gated behind `prefers-reduced-motion` (instant, no animation when reduced); markers are focusable buttons with `aria-label`; steps are keyboard-navigable; container is a labeled `region`.
- **[Assumptions defaulted]** → style/motion (Standard, top-down) chosen by the user; placement, 4-step breakdown, and placeholder copy remain for confirmation (see Open Questions).

## Open Questions

1. Confirm the 4-step breakdown (gate → paper → keynote → lunch) vs. more granular steps.
2. Step copy: organizer-provided real directions vs. the drafted placeholder copy.
3. Pin coordinates are OSM-sourced; confirm each marker sits on the intended building.
4. Add a Mapbox URL restriction to the token before production.
