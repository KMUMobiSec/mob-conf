/**
 * Campus Wayfinder geometry (geographic).
 *
 * Real-world coordinates for the "Main Gate → venue" guide, rendered on a
 * Mapbox GL map. Coordinates are `[lng, lat]` tuples (GeoJSON / Mapbox order).
 * Building coordinates and the walking route come from OpenStreetMap + the
 * Mapbox Directions (walking) API. Human-readable step text lives in the
 * `Wayfinder` i18n namespace, keyed by step id — never in this file.
 */

import type { ValidYear } from "@/constants/config";

export type WayfinderPinKind = "gate" | "primary" | "venue";

/** `[longitude, latitude]`. */
export type LngLat = [number, number];

export interface WayfinderPin {
  /** Stable id; also the i18n key under `Wayfinder.roles` and step focus target. */
  id: string;
  /** Sequential stop number shown on the marker (1, 2, 3, …). */
  stop: number;
  /** Official building name (for reference/config readability). */
  officialName: string;
  kind: WayfinderPinKind;
  lngLat: LngLat;
  /** Marker fill color, matching the building's color on the illustrated venue map. Defaults to a neutral dark. */
  color?: string;
  /** Where the always-visible name label sits relative to the marker. Defaults to Mapbox's automatic placement. */
  labelPosition?: "top" | "bottom" | "left" | "right";
}

export interface WayfinderStep {
  /** Stable id; also the i18n key under `Wayfinder.steps`. */
  id: string;
  /** Pin highlighted while this step is active (the camera stays fixed). */
  focusPinId: string;
  /** Inclusive `[start, end]` index range of `route` (the shared trunk) revealed for this step. */
  segment: [number, number];
  /**
   * Extra coordinates appended after the trunk segment, for a step whose pin
   * sits off a spoke branching from the hub rather than further along the
   * trunk itself. For these steps `segment` is typically just the hub's own
   * index (e.g. `[13, 13]`), so the revealed path is only "hub → this stop",
   * not the full gate → hub trunk. Omit for steps that only reveal trunk points.
   */
  leg?: LngLat[];
}

export interface WayfinderMapView {
  /** Mapbox style URL. */
  styleUrl: string;
  center: LngLat;
  zoom: number;
  minZoom: number;
  maxZoom: number;
}

export interface WayfinderConfig {
  map: WayfinderMapView;
  /** Shared trunk walking path, gate → hub (GeoJSON LineString coordinates). */
  route: LngLat[];
  pins: WayfinderPin[];
  steps: WayfinderStep[];
}

/**
 * MOBISEC 2026 @ Kookmin University.
 * Building coords + walking route from OpenStreetMap's pedestrian network.
 * Hub-and-spoke layout: the shared trunk (`route`) runs from the Main Gate up
 * to the plaza by the University Statue, east along the top walkway, then
 * south to Administration Hall — the registration hub (Main Conference Hall,
 * 1st floor). From that hub, two independent spokes (`steps[].leg`) branch
 * off: one down to the Paper Sessions building (International Hall), one
 * along the walkway and around the building line to the Lunch venue (College
 * of Law), each traced to hug the mapped pedestrian paths rather than
 * cutting across building footprints. Markers show simple sequential stop
 * numbers (1 gate → 2 registration → 3 paper → 4 lunch).
 */
export const kookminWayfinder: WayfinderConfig = {
  map: {
    styleUrl: "mapbox://styles/mapbox/standard",
    center: [126.99611, 37.61139],
    zoom: 15.8,
    minZoom: 14,
    maxZoom: 18,
  },
  route: [
    [126.994688, 37.611148], // 0 · Main Gate
    [126.994792, 37.611269], // 1 · up from the gate
    [126.995227, 37.611781], // 2 · plaza bend by the University Statue
    [126.99537, 37.611836], // 3 · onto the top walkway
    [126.995619, 37.61188], // 4
    [126.995989, 37.611922], // 5
    [126.996109, 37.611914], // 6
    [126.996215, 37.611889], // 7
    [126.996239, 37.611878], // 8 · turn south toward the venues
    [126.996616, 37.61165], // 9
    [126.996762, 37.611566], // 10
    [126.99725, 37.611285], // 11 · walkway junction near the venues
    [126.997471, 37.611519], // 12 · spur toward Administration Hall
    [126.997533, 37.611635], // 13 · Administration Hall — registration hub
  ],
  pins: [
    {
      id: "gate",
      stop: 1,
      officialName: "Main Gate",
      kind: "gate",
      lngLat: [126.994688, 37.611148],
      labelPosition: "bottom",
    },
    {
      id: "registration",
      stop: 2,
      officialName: "Administration Hall",
      kind: "primary",
      lngLat: [126.997533, 37.611635],
      color: "#d1483a", // red — matches Administration Hall on the venue illustration
    },
    {
      id: "paper",
      stop: 3,
      officialName: "International Hall",
      kind: "venue",
      lngLat: [126.997267, 37.611012],
      color: "#4f9d5a", // green — matches International Hall on the venue illustration
      labelPosition: "bottom",
    },
    {
      id: "lunch",
      stop: 4,
      officialName: "College of Law",
      kind: "venue",
      lngLat: [126.998278, 37.611283],
      color: "#3f76c0", // blue — matches College of Law on the venue illustration
      labelPosition: "bottom",
    },
  ],
  steps: [
    // No revealed path at the gate — it's the starting point, shown with a pulse instead.
    { id: "gate", focusPinId: "gate", segment: [0, 0] },
    { id: "registration", focusPinId: "registration", segment: [0, 13] },
    {
      id: "paper",
      focusPinId: "paper",
      // Just the hub point (13) + leg: this step shows only the Administration
      // Hall → International Hall connection, not the gate → Administration Hall trunk.
      segment: [13, 13],
      leg: [
        [126.997471, 37.611519], // back down the spur
        [126.99725, 37.611285], // walkway junction
        [126.997267, 37.611012], // International Hall
      ],
    },
    {
      id: "lunch",
      focusPinId: "lunch",
      // Just the hub point (13) + leg: this step shows only the Administration
      // Hall → College of Law connection, not the gate → Administration Hall trunk.
      segment: [13, 13],
      leg: [
        [126.997471, 37.611519], // back down the spur (shared start with the paper leg)
        [126.997779, 37.611335],
        [126.997645, 37.61119],
        [126.997807, 37.611089],
        [126.998162, 37.611468], // nearest walkway point to the venue
        [126.998278, 37.611283], // College of Law
      ],
    },
  ],
};

/**
 * Years with an on-campus wayfinding guide. Each venue's building layout is
 * bespoke (coordinates, pins, illustrated map image), so a year with no entry
 * here simply doesn't render the Campus Wayfinder rather than showing another
 * year's venue.
 */
export const wayfinderConfigByYear: Partial<Record<ValidYear, WayfinderConfig>> = {};

// ---------------------------------------------------------------------------
// Pure helpers (unit-testable without a map)
// ---------------------------------------------------------------------------

/** Clamp a step index into `[0, total - 1]`. */
export function clampStep(index: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.max(index, 0), total - 1);
}

/** Index of the step that focuses `pinId`, or -1 if none. */
export function stepIndexForPin(config: WayfinderConfig, pinId: string): number {
  return config.steps.findIndex((step) => step.focusPinId === pinId);
}

/** The revealed route coordinates for a step: its trunk segment, plus its spoke leg if any. */
export function segmentPoints(config: WayfinderConfig, step: WayfinderStep): LngLat[] {
  const [start, end] = step.segment;
  const trunk = config.route.slice(start, end + 1);
  return step.leg ? [...trunk, ...step.leg] : trunk;
}

/**
 * Validate internal consistency. Returns human-readable errors; an empty
 * array means valid.
 */
export function validateWayfinderConfig(config: WayfinderConfig): string[] {
  const errors: string[] = [];
  const pinIds = new Set(config.pins.map((pin) => pin.id));
  const validLngLat = ([lng, lat]: LngLat) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;

  for (const pin of config.pins) {
    if (!validLngLat(pin.lngLat)) {
      errors.push(`pin "${pin.id}" has invalid coordinate ${JSON.stringify(pin.lngLat)}`);
    }
  }

  config.route.forEach((point, index) => {
    if (!validLngLat(point)) {
      errors.push(`route point ${index} has invalid coordinate ${JSON.stringify(point)}`);
    }
  });

  for (const step of config.steps) {
    if (!pinIds.has(step.focusPinId)) {
      errors.push(`step "${step.id}" references unknown pin "${step.focusPinId}"`);
    }
    const [start, end] = step.segment;
    if (start < 0 || end >= config.route.length || start > end) {
      errors.push(
        `step "${step.id}" segment [${start}, ${end}] is out of route bounds (0..${config.route.length - 1})`,
      );
    }
    step.leg?.forEach((point, index) => {
      if (!validLngLat(point)) {
        errors.push(
          `step "${step.id}" leg point ${index} has invalid coordinate ${JSON.stringify(point)}`,
        );
      }
    });
  }

  return errors;
}
