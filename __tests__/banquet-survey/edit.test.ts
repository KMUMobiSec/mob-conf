import { describe, expect, it } from "vitest";
import {
  type BanquetEditInput,
  clearedBanquetPatch,
  resolveBanquetUpdate,
} from "@/modules/admin/banquet-survey/lib/edit";

const NOW = new Date("2026-07-01T12:00:00Z");
const RESPONDED = new Date("2026-06-01T08:00:00Z");

const input = (over: Partial<BanquetEditInput> = {}): BanquetEditInput => ({
  name: "Ada Lovelace",
  affiliation: "Analytical Engine Co.",
  email: "Ada@Example.com",
  attending: "yes",
  allergens: ["nuts"],
  allergenOther: "kosher",
  message: "Looking forward to it",
  ...over,
});

function ok(result: ReturnType<typeof resolveBanquetUpdate>) {
  if (!result.ok) throw new Error(`expected ok, got errors: ${JSON.stringify(result.errors)}`);
  return result.patch;
}

describe("resolveBanquetUpdate", () => {
  it("normalizes the email to lowercase and trims text", () => {
    const patch = ok(resolveBanquetUpdate(input({ name: "  Ada  " }), { respondedAt: null }, NOW));
    expect(patch.email).toBe("ada@example.com");
    expect(patch.name).toBe("Ada");
  });

  it("keeps an existing respondedAt when still attending", () => {
    const patch = ok(resolveBanquetUpdate(input(), { respondedAt: RESPONDED }, NOW));
    expect(patch.respondedAt).toBe(RESPONDED);
    expect(patch.attending).toBe(true);
    expect(patch.allergens).toEqual(["nuts"]);
    expect(patch.allergenOther).toBe("kosher");
  });

  it("sets respondedAt to now when a previously-invited person becomes attending", () => {
    const patch = ok(resolveBanquetUpdate(input(), { respondedAt: null }, NOW));
    expect(patch.respondedAt).toBe(NOW);
  });

  it("clears dietary fields and message when not attending", () => {
    const patch = ok(
      resolveBanquetUpdate(input({ attending: "no" }), { respondedAt: RESPONDED }, NOW),
    );
    expect(patch.attending).toBe(false);
    expect(patch.respondedAt).toBe(RESPONDED);
    expect(patch.allergens).toEqual([]);
    expect(patch.allergenOther).toBeNull();
    expect(patch.message).toBeNull();
  });

  it("reverts to the invited state (respondedAt null, all answers cleared)", () => {
    const patch = ok(
      resolveBanquetUpdate(input({ attending: "" }), { respondedAt: RESPONDED }, NOW),
    );
    expect(patch.respondedAt).toBeNull();
    expect(patch.attending).toBe(false);
    expect(patch.allergens).toEqual([]);
    expect(patch.allergenOther).toBeNull();
    expect(patch.message).toBeNull();
  });

  it("stores an empty affiliation as null", () => {
    const patch = ok(
      resolveBanquetUpdate(input({ affiliation: "   " }), { respondedAt: null }, NOW),
    );
    expect(patch.affiliation).toBeNull();
  });

  it("rejects a missing name and an invalid email", () => {
    const result = resolveBanquetUpdate(
      input({ name: "  ", email: "not-an-email" }),
      { respondedAt: null },
      NOW,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBeDefined();
    }
  });

  it("rejects an unknown allergen id only while attending", () => {
    expect(
      resolveBanquetUpdate(input({ allergens: ["bogus"] }), { respondedAt: null }, NOW).ok,
    ).toBe(false);
    // Same bogus id is ignored (cleared) when not attending, so it validates.
    expect(
      resolveBanquetUpdate(
        input({ attending: "no", allergens: ["bogus"] }),
        { respondedAt: null },
        NOW,
      ).ok,
    ).toBe(true);
  });
});

describe("clearedBanquetPatch", () => {
  it("resets answers and respondedAt without touching identity", () => {
    const patch = clearedBanquetPatch(NOW);
    expect(patch).toEqual({
      attending: false,
      allergens: [],
      allergenOther: null,
      message: null,
      respondedAt: null,
      updatedAt: NOW,
    });
  });
});
