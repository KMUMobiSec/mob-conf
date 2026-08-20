import { describe, expect, it } from "vitest";
import {
  allergenBreakdown,
  type DietaryRow,
  hasDietaryNeed,
  orderAttendingForReport,
  otherDietaryCount,
} from "@/modules/admin/banquet-survey/lib/summary";

const row = (over: Partial<DietaryRow> = {}): DietaryRow => ({
  attending: true,
  respondedAt: new Date("2026-06-01T00:00:00Z"),
  allergens: [],
  allergenOther: null,
  ...over,
});

describe("allergenBreakdown", () => {
  it("counts allergens only among responded + attending rows", () => {
    const rows = [
      row({ allergens: ["nuts", "dairy"] }),
      row({ allergens: ["nuts"] }),
      row({ attending: false, allergens: ["nuts"] }), // not attending → ignored
      row({ respondedAt: null, allergens: ["nuts"] }), // invited → ignored
    ];
    expect(allergenBreakdown(rows)).toEqual([
      { id: "nuts", label: "Nuts", count: 2 },
      { id: "dairy", label: "Dairy", count: 1 },
    ]);
  });

  it("omits allergens with a zero count and preserves canonical order", () => {
    const rows = [row({ allergens: ["vegan", "shellfish"] })];
    expect(allergenBreakdown(rows).map((a) => a.id)).toEqual(["shellfish", "vegan"]);
  });

  it("appends unknown allergen ids with a fallback label", () => {
    const rows = [row({ allergens: ["mystery"] })];
    expect(allergenBreakdown(rows)).toEqual([{ id: "mystery", label: "mystery", count: 1 }]);
  });

  it("returns an empty list when nobody is attending", () => {
    expect(allergenBreakdown([row({ attending: false, allergens: ["nuts"] })])).toEqual([]);
  });
});

describe("otherDietaryCount", () => {
  it("counts attending rows with a non-empty free-text note", () => {
    const rows = [
      row({ allergenOther: "kosher" }),
      row({ allergenOther: "   " }), // whitespace → not counted
      row({ allergenOther: null }),
      row({ attending: false, allergenOther: "halal" }), // not attending → ignored
    ];
    expect(otherDietaryCount(rows)).toBe(1);
  });
});

const guest = (name: string, over: Partial<DietaryRow> = {}) => ({ ...row(over), name });

describe("hasDietaryNeed", () => {
  it("is true for attending guests with an allergen or a written note", () => {
    expect(hasDietaryNeed(row({ allergens: ["nuts"] }))).toBe(true);
    expect(hasDietaryNeed(row({ allergenOther: "kosher" }))).toBe(true);
  });

  it("is false without any need, or when whitespace-only, not attending, or invited", () => {
    expect(hasDietaryNeed(row())).toBe(false);
    expect(hasDietaryNeed(row({ allergenOther: "  " }))).toBe(false);
    expect(hasDietaryNeed(row({ attending: false, allergens: ["nuts"] }))).toBe(false);
    expect(hasDietaryNeed(row({ respondedAt: null, allergens: ["nuts"] }))).toBe(false);
  });
});

describe("orderAttendingForReport", () => {
  it("keeps only attending guests, dietary needs first, then alphabetical", () => {
    const rows = [
      guest("Zoe"), // attending, no needs
      guest("Alan", { allergens: ["nuts"] }), // dietary
      guest("Grace", { respondedAt: null }), // invited → dropped
      guest("Ada"), // attending, no needs
      guest("Bob", { attending: false }), // not attending → dropped
      guest("Yuki", { allergenOther: "halal" }), // dietary
    ];
    expect(orderAttendingForReport(rows).map((r) => r.name)).toEqual([
      "Alan",
      "Yuki",
      "Ada",
      "Zoe",
    ]);
  });
});
