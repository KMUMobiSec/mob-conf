import { describe, expect, it } from "vitest";
import {
  selectAllRegistrationRows,
  toggleRegistrationSelection,
} from "@/modules/admin/qr-check-ins/lib/selection";

const rows = [
  { id: "a", year: 2026 },
  { id: "b", year: 2026 },
  { id: "old", year: 2025 },
];

describe("registration selection helpers", () => {
  it("selects only rows from the current year result", () => {
    expect(Array.from(selectAllRegistrationRows(rows, 2026))).toEqual(["a", "b"]);
  });

  it("toggles individual rows without mutating the original set", () => {
    const initial = new Set(["a"]);
    const next = toggleRegistrationSelection(initial, "b", true);
    const removed = toggleRegistrationSelection(next, "a", false);

    expect(Array.from(initial)).toEqual(["a"]);
    expect(Array.from(next)).toEqual(["a", "b"]);
    expect(Array.from(removed)).toEqual(["b"]);
  });
});
