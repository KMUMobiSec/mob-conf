import { describe, expect, it } from "vitest";
import {
  kookminWayfinder,
  segmentPoints,
  validateWayfinderConfig,
  type WayfinderConfig,
} from "@/constants/wayfinder";

describe("wayfinder config", () => {
  it("the Kookmin config is internally valid", () => {
    expect(validateWayfinderConfig(kookminWayfinder)).toEqual([]);
  });

  it("every step's focus pin exists", () => {
    const pinIds = new Set(kookminWayfinder.pins.map((pin) => pin.id));
    for (const step of kookminWayfinder.steps) {
      expect(pinIds.has(step.focusPinId)).toBe(true);
    }
  });

  it("all pins, route, and leg points are near the Kookmin campus", () => {
    const points = [
      ...kookminWayfinder.pins.map((p) => p.lngLat),
      ...kookminWayfinder.route,
      ...kookminWayfinder.steps.flatMap((step) => step.leg ?? []),
    ];
    for (const [lng, lat] of points) {
      expect(lng).toBeGreaterThan(126.99);
      expect(lng).toBeLessThan(127.0);
      expect(lat).toBeGreaterThan(37.6);
      expect(lat).toBeLessThan(37.62);
    }
  });

  it("every non-gate step's revealed route ends exactly at its focus pin", () => {
    for (const step of kookminWayfinder.steps) {
      const pin = kookminWayfinder.pins.find((p) => p.id === step.focusPinId);
      expect(pin).toBeDefined();
      if (!pin || pin.kind === "gate") continue;
      const points = segmentPoints(kookminWayfinder, step);
      expect(points[points.length - 1]).toEqual(pin.lngLat);
    }
  });

  it("flags invalid coordinates, unknown focus pins, and bad segments", () => {
    const broken: WayfinderConfig = {
      map: {
        styleUrl: "mapbox://styles/mapbox/standard",
        center: [0, 0],
        zoom: 15,
        minZoom: 14,
        maxZoom: 18,
      },
      route: [
        [126.99, 37.61],
        [126.991, 37.611],
      ],
      pins: [{ id: "a", stop: 1, officialName: "A", kind: "gate", lngLat: [999, 5] }],
      steps: [{ id: "s", focusPinId: "missing", segment: [0, 5] }],
    };
    const errors = validateWayfinderConfig(broken);
    expect(errors.some((e) => e.includes("invalid coordinate"))).toBe(true);
    expect(errors.some((e) => e.includes('unknown pin "missing"'))).toBe(true);
    expect(errors.some((e) => e.includes("out of route bounds"))).toBe(true);
  });
});
