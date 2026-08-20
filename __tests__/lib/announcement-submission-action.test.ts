import { describe, expect, it } from "vitest";
import { CURRENT_YEAR } from "@/constants/config";
import { getAnnouncementSubmissionAction } from "@/lib/routes/announcement";

describe("getAnnouncementSubmissionAction", () => {
  it("uses the nomination form for the current year", () => {
    expect(getAnnouncementSubmissionAction(CURRENT_YEAR)).toEqual({
      href: `/${CURRENT_YEAR}/nomination-form`,
      labelKey: "nominateSomeoneForAward",
      opensInNewTab: true,
    });
  });

  it("keeps the portal link for previous years", () => {
    expect(getAnnouncementSubmissionAction(2025)).toEqual({
      href: "/2025/portal",
      labelKey: "goToPortal",
      opensInNewTab: true,
    });
  });
});
