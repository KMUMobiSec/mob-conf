import { describe, expect, it } from "vitest";
import { clampStep, kookminWayfinder, segmentPoints, stepIndexForPin } from "@/constants/wayfinder";

describe("wayfinder step helpers", () => {
  it("clampStep clamps an index into range (Back/Next end behavior)", () => {
    expect(clampStep(-1, 4)).toBe(0);
    expect(clampStep(0, 4)).toBe(0);
    expect(clampStep(3, 4)).toBe(3);
    expect(clampStep(9, 4)).toBe(3);
    expect(clampStep(2, 0)).toBe(0);
  });

  it("stepIndexForPin maps a pin click to its step", () => {
    expect(stepIndexForPin(kookminWayfinder, "gate")).toBe(0);
    expect(stepIndexForPin(kookminWayfinder, "registration")).toBe(1);
    expect(stepIndexForPin(kookminWayfinder, "paper")).toBe(2);
    expect(stepIndexForPin(kookminWayfinder, "lunch")).toBe(3);
    expect(stepIndexForPin(kookminWayfinder, "does-not-exist")).toBe(-1);
  });

  it("segmentPoints returns the trunk range for a step, plus its spoke leg if any", () => {
    expect(segmentPoints(kookminWayfinder, kookminWayfinder.steps[0])).toHaveLength(1); // gate: no revealed path, just its own point
    expect(segmentPoints(kookminWayfinder, kookminWayfinder.steps[1])).toHaveLength(
      kookminWayfinder.route.length,
    ); // registration is the hub: the full gate → hub trunk, no leg

    // Spoke steps (paper, lunch) reveal only "hub → this stop" — the hub point
    // plus their own leg — not the full gate → hub trunk.
    for (const step of kookminWayfinder.steps.filter((s) => s.leg)) {
      const [start, end] = step.segment;
      expect(segmentPoints(kookminWayfinder, step)).toHaveLength(
        end - start + 1 + (step.leg?.length ?? 0),
      );
      expect(segmentPoints(kookminWayfinder, step)[0]).toEqual(
        kookminWayfinder.route[kookminWayfinder.route.length - 1],
      );
    }
  });
});
