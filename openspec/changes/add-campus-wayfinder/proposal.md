## Why

EBISION 2026 is hosted at Kookmin University, whose campus climbs a hillside. The current venue section only offers macro directions (address, a Google Maps iframe); attendees who reach the campus still have no guidance from the Main Gate to the right building and floor. We want an interactive on-campus wayfinding guide so first-time visitors can confidently reach the paper sessions, keynotes, and lunch.

## What Changes

- Add a **Campus Wayfinder**: an interactive **Mapbox GL** map with a step-by-step guide, routing attendees **Main Gate → venue cluster** along the real walking path.
- Tag each venue building with its role: **Paper Sessions** (International Hall #11, 5F — rooms 501/502/506), **Main Conference Hall / keynotes** (Administration Hall #1, 1F), **Lunch** (College of Law #4, 5F).
- Advancing a step eases the map to the focused building and reveals that leg of the route (animated marching-ants line); the panel and the map markers stay in two-way sync.
- Render the guide inside the existing venue block (`Venue.tsx`), **complementing** — not replacing — the current Google Maps iframe.
- Add a new `Wayfinder` i18n namespace to `messages/en.json` and `messages/kr.json`.
- Drive the map from a single typed geographic config so the coordinates/route are data, not code.

Assumptions baked in (flagged in design.md for confirmation): Mapbox Standard style, kept top-down (no 3D tilt / camera flight); placement inside `Venue.tsx`; a 4-step route breakdown; placeholder step copy to be refined by organizers.

Non-goals: no 3D-tilt / camera fly-through (top-down only, per decision); no GPS/live location; no in-app pin-editing UI; no per-year multi-venue abstraction yet.

## Capabilities

### New Capabilities
- `campus-wayfinder`: An interactive step-by-step wayfinding guide that renders a route, building markers, and a per-step map focus on an interactive Mapbox map, driven by a geographic config and localized step text.

### Modified Capabilities
<!-- None: no existing spec-level behavior changes. Venue.tsx gains one embedded block but its existing requirements are unchanged. -->

## Impact

- **New code:** `constants/wayfinder.ts` (typed geographic config + helpers + validator), a `wayfinder/` component group under `modules/landing/home/components/` (`CampusWayfinder` server wrapper, `WayfinderClient`, `WayfinderMap`, `WayfinderSteps`).
- **Modified code:** `modules/landing/home/components/Venue.tsx` (one import + one embedded block); `messages/en.json` + `messages/kr.json` (new `Wayfinder` namespace).
- **Dependencies:** adds `mapbox-gl` (+ `@types/geojson`). No DB changes; no migrations.
- **Environment:** `NEXT_PUBLIC_MAPBOX_TOKEN` (browser-exposed public token) added to `.env` / `.env.example`.
- **Tests:** vitest coverage for config validity, the step helpers, a mocked-map mount, and i18n key presence.
