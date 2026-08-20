import { describe, expect, it } from "vitest";

import {
  type BanquetConfirmationEmailInput,
  banquetConfirmationSubject,
  renderBanquetConfirmationHtml,
  renderBanquetConfirmationText,
} from "@/lib/email/banquet-confirmation.templates";

const EMDASH = "—";

function baseInput(
  overrides: Partial<BanquetConfirmationEmailInput> = {},
): BanquetConfirmationEmailInput {
  return {
    year: 2026,
    name: "Ada Lovelace",
    attending: true,
    banquetDate: "July 9",
    banquetVenue: "the Plaza Hotel",
    allergens: ["Nuts", "Shellfish"],
    ...overrides,
  };
}

describe("banquetConfirmationSubject", () => {
  it("includes the year", () => {
    expect(banquetConfirmationSubject(2026)).toContain("2026");
    expect(banquetConfirmationSubject(2027)).toContain("2027");
  });
});

describe("renderBanquetConfirmationHtml", () => {
  it("includes the recipient name and banquet date and venue", () => {
    const html = renderBanquetConfirmationHtml(baseInput());

    expect(html).toContain("Dear Ada Lovelace");
    expect(html).toContain("July 9");
    expect(html).toContain("the Plaza Hotel");
    expect(html).toContain("EBISION 2026");
  });

  it("escapes injected HTML in attendee-controlled values", () => {
    const html = renderBanquetConfirmationHtml(baseInput({ name: "<script>alert(1)</script>" }));

    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("renders the allergen list when attending with allergens", () => {
    const html = renderBanquetConfirmationHtml(
      baseInput({ attending: true, allergens: ["Nuts", "Shellfish"] }),
    );

    expect(html).toContain("Nuts, Shellfish");
    expect(html).toContain("Yes");
  });

  it("renders the not attending copy when attending is false", () => {
    const html = renderBanquetConfirmationHtml(baseInput({ attending: false, allergens: [] }));

    expect(html).toContain("will not be attending");
    expect(html).toContain("No");
    expect(html).not.toContain("Nuts, Shellfish");
  });

  it("does not contain an emdash character", () => {
    const html = renderBanquetConfirmationHtml(
      baseInput({
        attending: true,
        allergens: ["Nuts"],
        allergenOther: "Sesame seeds",
        message: "Looking forward to the banquet.",
      }),
    );

    expect(html).not.toContain(EMDASH);
  });
});

describe("renderBanquetConfirmationText", () => {
  it("includes the recipient name and banquet date and venue", () => {
    const text = renderBanquetConfirmationText(baseInput());

    expect(text).toContain("Dear Ada Lovelace");
    expect(text).toContain("July 9");
    expect(text).toContain("the Plaza Hotel");
    expect(text).toContain("EBISION 2026");
  });

  it("renders the not attending copy when attending is false", () => {
    const text = renderBanquetConfirmationText(baseInput({ attending: false, allergens: [] }));

    expect(text).toContain("will not be attending");
    expect(text).toContain("Attending: No");
  });

  it("does not contain an emdash character", () => {
    const text = renderBanquetConfirmationText(
      baseInput({
        attending: true,
        allergens: ["Nuts"],
        allergenOther: "Sesame seeds",
        message: "Looking forward to the banquet.",
      }),
    );

    expect(text).not.toContain(EMDASH);
  });
});
