import { describe, expect, it } from "vitest";
import {
  buildAlreadyCheckedInResult,
  buildCheckedInResult,
} from "@/modules/admin/qr-check-ins/lib/check-in-result";

const registration = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Jhury Lastre",
  email: "jhury@example.com",
  idNumber: 12,
};

describe("check-in result helpers", () => {
  it("reports a duplicate scan with the original check-in timestamp and ID number", () => {
    const originalCheckedInAt = new Date("2026-07-08T01:02:03.000Z");

    expect(
      buildAlreadyCheckedInResult({
        ...registration,
        checkedInAt: originalCheckedInAt,
      }),
    ).toEqual({
      ok: true,
      status: "already-checked-in",
      registration: {
        ...registration,
        checkedInAt: "2026-07-08T01:02:03.000Z",
      },
    });
  });

  it("reports a first check-in with the new check-in timestamp and ID number", () => {
    const checkedInAt = new Date("2026-07-08T04:05:06.000Z");

    expect(buildCheckedInResult({ ...registration, checkedInAt })).toEqual({
      ok: true,
      status: "checked-in",
      registration: {
        ...registration,
        checkedInAt: "2026-07-08T04:05:06.000Z",
      },
    });
  });

  it("carries a null ID number for registrations not on the participant list", () => {
    const checkedInAt = new Date("2026-07-08T04:05:06.000Z");

    const result = buildCheckedInResult({
      id: registration.id,
      name: "Walk In",
      email: null,
      idNumber: null,
      checkedInAt,
    });

    expect(result.ok).toBe(true);
    expect(result.registration.idNumber).toBeNull();
  });
});
