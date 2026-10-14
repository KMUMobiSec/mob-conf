import { describe, expect, it } from "vitest";
import { CURRENT_YEAR } from "@/constants/config";
import { buildAdminYearHref, parseAdminYear } from "@/modules/admin/lib/year";

describe("admin year helpers", () => {
  it("defaults missing or invalid year values to the current year", () => {
    expect(parseAdminYear(undefined)).toBe(CURRENT_YEAR);
    expect(parseAdminYear("abc")).toBe(CURRENT_YEAR);
    expect(parseAdminYear("1999")).toBe(CURRENT_YEAR);
  });

  it("accepts configured MOBISEC years from strings or repeated params", () => {
    expect(parseAdminYear("2025")).toBe(2025);
    expect(parseAdminYear(["2026", "2025"])).toBe(2026);
  });

  it("builds admin links that preserve the selected year and existing query values", () => {
    expect(buildAdminYearHref("/admin/qr-check-ins", 2026)).toBe("/admin/qr-check-ins?year=2026");
    expect(buildAdminYearHref("/admin/qr-check-ins?tab=check-in", 2025)).toBe(
      "/admin/qr-check-ins?tab=check-in&year=2025",
    );
  });
});
