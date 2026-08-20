import { describe, expect, it } from "vitest";

import { MAX_MESSAGE_LENGTH } from "@/modules/landing/banquet-survey/lib/constants";
import { type BanquetValues, validateBanquet } from "@/modules/landing/banquet-survey/lib/schema";

function baseValues(overrides: Partial<BanquetValues> = {}): BanquetValues {
  return {
    name: "Ada Lovelace",
    affiliation: "Analytical Engine Lab",
    email: "ada@example.com",
    attending: "yes",
    allergens: [],
    allergenOther: "",
    message: "",
    ...overrides,
  };
}

describe("validateBanquet", () => {
  it("accepts a valid attending yes response with a known allergen id", () => {
    const result = validateBanquet(baseValues({ allergens: ["nuts"] }));

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("requires a name", () => {
    const result = validateBanquet(baseValues({ name: "" }));

    expect(result.valid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  it("requires an affiliation", () => {
    const result = validateBanquet(baseValues({ affiliation: "" }));

    expect(result.valid).toBe(false);
    expect(result.errors.affiliation).toBeDefined();
  });

  it("requires an email", () => {
    const result = validateBanquet(baseValues({ email: "" }));

    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  it("requires a valid email format", () => {
    const result = validateBanquet(baseValues({ email: "not-an-email" }));

    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  it("requires attending to be yes or no", () => {
    const result = validateBanquet(baseValues({ attending: "" }));

    expect(result.valid).toBe(false);
    expect(result.errors.attending).toBeDefined();
  });

  it("does not require dietary fields when attending is no", () => {
    const result = validateBanquet(
      baseValues({
        attending: "no",
        allergens: [],
        allergenOther: "",
        message: "",
      }),
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("ignores an over-length message when attending is no", () => {
    const result = validateBanquet(
      baseValues({
        attending: "no",
        message: "a".repeat(MAX_MESSAGE_LENGTH + 1),
      }),
    );

    expect(result.valid).toBe(true);
  });

  it("rejects an over-length message when attending is yes", () => {
    const result = validateBanquet(
      baseValues({
        attending: "yes",
        message: "a".repeat(MAX_MESSAGE_LENGTH + 1),
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.errors.message).toBeDefined();
  });
});
