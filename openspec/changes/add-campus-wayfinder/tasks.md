## 1. Dependencies & environment

- [x] 1.1 Add `mapbox-gl` (and `@types/geojson`) dependencies
- [x] 1.2 Add `NEXT_PUBLIC_MAPBOX_TOKEN` to `.env` and document it in `.env.example`

## 2. Geographic config

- [x] 2.1 Define `WayfinderConfig` (map view, route, pins, steps) + `LngLat` types in `constants/wayfinder.ts`
- [x] 2.2 Author the Kookmin config: Standard style, campus center/zoom, pins for #25/#1/#11/#4 (OSM coords), 4 steps
- [x] 2.3 Fetch the real walking route (Mapbox Directions, ~321 m, 14 points) and embed as the route
- [x] 2.4 Add pure helpers (clampStep, stepIndexForPin, segmentPoints) + a config validator (pins/steps/segments/coords)

## 3. i18n

- [x] 3.1 Add a `Wayfinder` namespace to `messages/en.json` (labels, controls, per-step title/body, roles, pinAriaLabel, mapUnavailable)
- [x] 3.2 Mirror the namespace in `messages/kr.json` (Korean copy incl. Korean building names)
- [x] 3.3 Draft placeholder walking-direction copy for each step (for organizer refinement)

## 4. Components

- [x] 4.1 `WayfinderMap` (client): Mapbox map (Standard, top-down), route layers (base + marching-ants active), building markers; emits marker-select; token fallback
- [x] 4.2 `WayfinderSteps` (client): step list + Back/Next; emits step-select; clamps at ends
- [x] 4.3 `WayfinderClient` (client): owns `activeStep`; wires two-way sync between map and steps
- [x] 4.4 `CampusWayfinder` (server): loads config + `getTranslations("Wayfinder")`; renders chrome; hands props to client

## 5. Interaction, accessibility & motion

- [x] 5.1 Advancing a step eases the map to the focused building and reveals that route leg
- [x] 5.2 Clicking a marker selects its step; selecting a step focuses its marker (two-way sync)
- [x] 5.3 Markers are focusable buttons with `aria-label`; step list keyboard-navigable; container is a labeled `region`
- [x] 5.4 Respect `prefers-reduced-motion` (no marching-ants, instant camera easing)

## 6. Integration

- [x] 6.1 Embed `<CampusWayfinder />` in `Venue.tsx` as a new block below "Getting There"; keep the Google Maps iframe
- [x] 6.2 Responsive layout (map then steps on mobile; side-by-side `lg:` grid on desktop)

## 7. Tests (vitest)

- [x] 7.1 Config-validity test (pins referenced by steps exist; coords valid; segments in bounds)
- [x] 7.2 Step-helper tests (clamp; pin→step mapping; segment slicing)
- [x] 7.3 `WayfinderMap` mount test (mapbox-gl mocked: one map + one marker per pin)
- [x] 7.4 i18n presence test (`Wayfinder` keys exist in both `en.json` and `kr.json`)

## 8. Verify

- [x] 8.1 `pnpm typecheck` and `pnpm biome check` clean
- [x] 8.2 `pnpm test:ci` green (35 files / 147 tests)
- [x] 8.3 Live probe (`/2026`): map container renders (not fallback), `NEXT_PUBLIC_MAPBOX_TOKEN` inlined in client JS, `mapbox-gl` JS+CSS bundled, no `MISSING_MESSAGE`/`IntlError`
- [ ] 8.4 Visual browser check: confirm tiles paint + camera eases + markers/route (needs a GPU browser — not run here)
