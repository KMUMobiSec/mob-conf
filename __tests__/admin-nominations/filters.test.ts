import { describe, expect, it } from "vitest";
import { CURRENT_YEAR } from "@/constants/config";

import { parseNominationListParams } from "@/modules/admin/nominations/lib/filters";

describe("parseNominationListParams", () => {
  it("defaults to the current year and no secondary filters", () => {
    expect(parseNominationListParams({})).toEqual({
      year: CURRENT_YEAR,
      award: undefined,
      winner: false,
      q: undefined,
    });
  });

  it("accepts a valid year and rejects an invalid one", () => {
    expect(parseNominationListParams({ year: "2026" }).year).toBe(2026);
    expect(parseNominationListParams({ year: "1999" }).year).toBe(CURRENT_YEAR);
    expect(parseNominationListParams({ year: "abc" }).year).toBe(CURRENT_YEAR);
  });

  it("passes through award and winner flag", () => {
    expect(parseNominationListParams({ award: "young_researcher" }).award).toBe("young_researcher");
    expect(parseNominationListParams({ winner: "1" }).winner).toBe(true);
    expect(parseNominationListParams({ winner: "0" }).winner).toBe(false);
    expect(parseNominationListParams({ winner: "true" }).winner).toBe(false);
  });

  it("trims search and drops empty", () => {
    expect(parseNominationListParams({ q: "  Turing  " }).q).toBe("Turing");
    expect(parseNominationListParams({ q: "   " }).q).toBeUndefined();
  });

  it("takes the first value when a param repeats", () => {
    expect(parseNominationListParams({ award: ["a", "b"] }).award).toBe("a");
  });
});
