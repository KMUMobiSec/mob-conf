import { describe, expect, it } from "vitest";
import { formatIdNumber } from "@/modules/admin/qr-check-ins/lib/format";

describe("formatIdNumber", () => {
  it("zero-pads to at least three digits", () => {
    expect(formatIdNumber(1)).toBe("001");
    expect(formatIdNumber(12)).toBe("012");
    expect(formatIdNumber(200)).toBe("200");
  });

  it("leaves four-plus digit numbers intact", () => {
    expect(formatIdNumber(1000)).toBe("1000");
    expect(formatIdNumber(12345)).toBe("12345");
  });
});
