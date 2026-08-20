import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  dbReturning: vi.fn(),
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

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/server", () => ({
  after: mocks.after,
}));

vi.mock("@/db", () => ({
  db: {
    update: mocks.dbUpdate,
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentAdminSession: mocks.getCurrentAdminSession,
}));

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

// server-only module; mock so importing actions.ts doesn't pull in "server-only".
vi.mock("@/modules/admin/settings/lib/queries", () => ({
  getAppSettings: mocks.getAppSettings,
}));

import { checkInRegistration } from "@/modules/admin/qr-check-ins/actions";

const REGISTRATION_ID = "11111111-1111-4111-8111-111111111111";
const QR_NONCE = "qr-nonce";
const CHECKED_IN_AT = new Date("2026-07-08T01:02:03.000Z");

const registration = {
  id: REGISTRATION_ID,
  year: 2026,
  email: "jhury@example.com",
  name: "Jhury Lastre",
  affiliation: null,
  qrNonce: QR_NONCE,
  qrEmailSentAt: null,
  qrEmailSentCount: 0,
  checkedInAt: CHECKED_IN_AT,
  checkedInBy: "admin@example.com",
  welcomeEmailSentAt: null,
  createdAt: new Date("2026-06-01T00:00:00.000Z"),
  updatedAt: CHECKED_IN_AT,
};

describe("checkInRegistration duplicate scans", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getCurrentAdminSession.mockResolvedValue({
      user: { email: "admin@example.com" },
    });
    mocks.getAppSettings.mockResolvedValue({ checkInTestMode: false, testerEmails: [] });
    mocks.requireCheckInQrSecret.mockReturnValue("test-secret");
    mocks.verifyQrPayload.mockReturnValue({
      ok: true,
      id: REGISTRATION_ID,
      qrNonce: QR_NONCE,
    });
    mocks.dbWhere.mockReturnValue({ returning: mocks.dbReturning });
    mocks.dbSet.mockReturnValue({ where: mocks.dbWhere });
    mocks.dbUpdate.mockReturnValue({ set: mocks.dbSet });
  });

  it("returns already checked-in for a rescan without running first-check-in side effects", async () => {
    mocks.getRegistrationByQrParts.mockResolvedValue(registration);

    const result = await checkInRegistration({
      year: 2026,
      qrPayload: "signed-payload",
    });

    expect(result).toEqual({
      ok: true,
      status: "already-checked-in",
      registration: {
        id: REGISTRATION_ID,
        name: "Jhury Lastre",
        email: "jhury@example.com",
        checkedInAt: "2026-07-08T01:02:03.000Z",
      },
    });
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
    expect(mocks.after).not.toHaveBeenCalled();
    expect(mocks.sendCheckInWelcome).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.getSupabaseServiceRoleClient).not.toHaveBeenCalled();
  });

  it("treats a concurrent duplicate scan as already checked-in without side effects", async () => {
    mocks.getRegistrationByQrParts.mockResolvedValue({
      ...registration,
      checkedInAt: null,
      checkedInBy: null,
      updatedAt: new Date("2026-06-01T00:00:00.000Z"),
    });
    mocks.dbReturning.mockResolvedValue([]);
    mocks.getRegistration.mockResolvedValue(registration);

    const result = await checkInRegistration({
      year: 2026,
      qrPayload: "signed-payload",
    });

    expect(result).toMatchObject({
      ok: true,
      status: "already-checked-in",
      registration: {
        id: REGISTRATION_ID,
        checkedInAt: "2026-07-08T01:02:03.000Z",
      },
    });
    expect(mocks.dbUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.after).not.toHaveBeenCalled();
    expect(mocks.sendCheckInWelcome).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.getSupabaseServiceRoleClient).not.toHaveBeenCalled();
  });
});
