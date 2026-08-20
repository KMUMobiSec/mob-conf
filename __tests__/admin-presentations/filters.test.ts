import { describe, expect, it } from "vitest";

import { CURRENT_YEAR } from "@/constants/config";
import { parsePresentationListParams } from "@/modules/admin/presentations/lib/filters";

describe("parsePresentationListParams", () => {
  it("defaults to the current year and no filters", () => {
    expect(parsePresentationListParams({})).toEqual({
      year: CURRENT_YEAR,
      reviewed: undefined,
      q: undefined,
    });
  });

  it("parses a valid year", () => {
    expect(parsePresentationListParams({ year: "2025" }).year).toBe(2025);
  });

  it("falls back to the current year for an invalid year", () => {
    expect(parsePresentationListParams({ year: "1999" }).year).toBe(CURRENT_YEAR);
  });

  it("maps the reviewed tri-state", () => {
    expect(parsePresentationListParams({ reviewed: "1" }).reviewed).toBe(true);
    expect(parsePresentationListParams({ reviewed: "0" }).reviewed).toBe(false);
    expect(parsePresentationListParams({ reviewed: "x" }).reviewed).toBeUndefined();
  });

  it("trims the search query and drops empty values", () => {
    expect(parsePresentationListParams({ q: "  paper  " }).q).toBe("paper");
    expect(parsePresentationListParams({ q: "   " }).q).toBeUndefined();
  });
});
