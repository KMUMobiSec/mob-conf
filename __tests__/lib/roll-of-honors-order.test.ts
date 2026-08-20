import { describe, expect, it } from "vitest";

import { generateMetadata } from "@/app/[year]/(public)/roll-of-honors/page";
import { AWARD_CATEGORY_ORDER } from "@/modules/landing/roll-of-honors/lib/award-order";

describe("roll of honors ordering", () => {
  it("lists Distinguished Lecturer first, followed by Industry Pioneer, Young Researcher, and Promising Graduate Student on the page", () => {
    const categories = AWARD_CATEGORY_ORDER.map((category) => category.key);
    const lecturerIndex = categories.indexOf("Distinguished Lecturer Award");
    const industryIndex = categories.indexOf("Industry Pioneer Award");
    const youngResearcherIndex = categories.indexOf("Young Researcher Award");
    const graduateIndex = categories.indexOf("Promising Graduate Student Award");

    expect(lecturerIndex).toBe(0);
    expect(industryIndex).toBeGreaterThan(-1);
    expect(youngResearcherIndex).toBeGreaterThan(-1);
    expect(graduateIndex).toBeGreaterThan(-1);
    expect(lecturerIndex).toBeLessThan(industryIndex);
    expect(industryIndex).toBeLessThan(youngResearcherIndex);
    expect(youngResearcherIndex).toBeLessThan(graduateIndex);
  });

  it("uses the same award order in roll of honors metadata", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ year: "2026" }) });
    const description = metadata.description;

    expect(typeof description).toBe("string");
    expect(description).toContain(
      "Distinguished Lecturer, Industry Pioneer, Young Researcher, Promising Graduate Student",
    );
  });
});
