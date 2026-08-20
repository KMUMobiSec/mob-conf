import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  dbSet: vi.fn(),
  dbUpdate: vi.fn(),
  dbWhere: vi.fn(),
  generateQrNonce: vi.fn(),
  getAppSettings: vi.fn(),
  getCurrentAdminSession: vi.fn(),
  getRegistration: vi.fn(),
  getRegistrationByEmail: vi.fn(),
  getRegistrationByQrParts: vi.fn(),
  getSupabaseServiceRoleClient: vi.fn(),
  listRegistrationsByEmails: vi.fn(),
  listRegistrationsByIds: vi.fn(),
  requireCheckInQrSecret: vi.fn(),
  revalidatePath: vi.fn(),
  sendCheckInWelcome: vi.fn(),
  sendRegistrationPass: vi.fn(),
  verifyQrPayload: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/server", () => ({ after: mocks.after }));
vi.mock("@/db", () => ({ db: { update: mocks.dbUpdate } }));
vi.mock("@/lib/auth/session", () => ({ getCurrentAdminSession: mocks.getCurrentAdminSession }));
vi.mock("@/lib/email/registration-check-in", () => ({
  sendCheckInWelcome: mocks.sendCheckInWelcome,
  sendRegistrationPass: mocks.sendRegistrationPass,
}));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServiceRoleClient: mocks.getSupabaseServiceRoleClient,
}));
vi.mock("@/modules/admin/qr-check-ins/lib/env", () => ({
  requireCheckInQrSecret: mocks.requireCheckInQrSecret,
}));
vi.mock("@/modules/admin/qr-check-ins/lib/qr", () => ({
  generateQrNonce: mocks.generateQrNonce,
  verifyQrPayload: mocks.verifyQrPayload,
}));
vi.mock("@/modules/admin/qr-check-ins/lib/queries", () => ({
  getRegistration: mocks.getRegistration,
  getRegistrationByEmail: mocks.getRegistrationByEmail,
  getRegistrationByQrParts: mocks.getRegistrationByQrParts,
  listRegistrationsByEmails: mocks.listRegistrationsByEmails,
  listRegistrationsByIds: mocks.listRegistrationsByIds,
}));
vi.mock("@/modules/admin/settings/lib/queries", () => ({ getAppSettings: mocks.getAppSettings }));

import { setRegistrationCheckIn } from "@/modules/admin/qr-check-ins/actions";

const REG_ID = "11111111-1111-4111-8111-111111111111";
const ADMIN_EMAIL = "admin@example.com";

function makeReg(overrides: Record<string, unknown> = {}) {
  return {
    id: REG_ID,
    year: 2026,
    email: "real@attendee.com",
    name: "Jhury Lastre",
    affiliation: "IFIP",
    qrNonce: "nonce",
    qrEmailSentAt: null,
    qrEmailSentCount: 0,
    checkedInAt: null,
    checkedInBy: null,
    welcomeEmailSentAt: null,
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-01T00:00:00.000Z"),
    ...overrides,
  };
}

function setValues() {
  return mocks.dbSet.mock.calls[0]?.[0] as {
    checkedInAt: unknown;
    checkedInBy: unknown;
  };
}

describe("setRegistrationCheckIn (manual override)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentAdminSession.mockResolvedValue({ user: { email: ADMIN_EMAIL } });
    mocks.dbWhere.mockResolvedValue(undefined);
    mocks.dbSet.mockReturnValue({ where: mocks.dbWhere });
    mocks.dbUpdate.mockReturnValue({ set: mocks.dbSet });
  });

  it("marks a registration checked in — records the acting admin, no email side effect", async () => {
    mocks.getRegistration.mockResolvedValue(makeReg({ checkedInAt: null }));

    const result = await setRegistrationCheckIn({ year: 2026, id: REG_ID, checkedIn: true });

    expect(result).toEqual({ ok: true });
    const values = setValues();
    expect(values.checkedInAt).toBeInstanceOf(Date);
    expect(values.checkedInBy).toBe(ADMIN_EMAIL);
    // Manual check-in has no deferred work — realtime is driven by the DB write (Postgres changes).
    expect(mocks.after).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalled();
    // No welcome email on a manual check-in.
    expect(mocks.sendCheckInWelcome).not.toHaveBeenCalled();
  });

  it("clears a check-in — nulls both the time and the recorder", async () => {
    mocks.getRegistration.mockResolvedValue(
      makeReg({ checkedInAt: new Date("2026-07-08T00:00:00.000Z"), checkedInBy: ADMIN_EMAIL }),
    );

    const result = await setRegistrationCheckIn({ year: 2026, id: REG_ID, checkedIn: false });

    expect(result).toEqual({ ok: true });
    const values = setValues();
    expect(values.checkedInAt).toBeNull();
    expect(values.checkedInBy).toBeNull();
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated caller without touching the row", async () => {
    mocks.getCurrentAdminSession.mockResolvedValue(null);

    const result = await setRegistrationCheckIn({ year: 2026, id: REG_ID, checkedIn: true });

    expect(result).toEqual({ ok: false, error: "Not authorized." });
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("rejects when the registration is missing or from another year", async () => {
    mocks.getRegistration.mockResolvedValue(null);

    const result = await setRegistrationCheckIn({ year: 2026, id: REG_ID, checkedIn: true });

    expect(result.ok).toBe(false);
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
    expect(mocks.after).not.toHaveBeenCalled();
  });
});
