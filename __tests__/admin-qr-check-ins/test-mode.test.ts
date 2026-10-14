import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  afterCbs: [] as Array<() => unknown>,
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

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
// Queue after() callbacks (as Next defers them); tests flush them explicitly.
vi.mock("next/server", () => ({ after: (cb: () => unknown) => mocks.afterCbs.push(cb) }));
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

import {
  checkInRegistration,
  sendRegistrationQrPasses,
} from "@/modules/admin/qr-check-ins/actions";

const REG_ID = "11111111-1111-4111-8111-111111111111";
const QR_NONCE = "qr-nonce";
const TESTERS = ["tester@mobisec.test", "qa@mobisec.test"];
const FALLBACK = "cyberchair.mobisec@gmail.com";

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: REG_ID,
    year: 2026,
    email: "real@attendee.com",
    name: "Jhury Lastre",
    affiliation: "IFIP",
    qrNonce: QR_NONCE,
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

async function flushAfter() {
  const cbs = [...mocks.afterCbs];
  mocks.afterCbs.length = 0;
  await Promise.all(cbs.map((cb) => cb()));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.afterCbs.length = 0;
  mocks.getCurrentAdminSession.mockResolvedValue({ user: { email: "admin@example.com" } });
  mocks.requireCheckInQrSecret.mockReturnValue("test-secret");
  mocks.dbWhere.mockReturnValue({ returning: mocks.dbReturning });
  mocks.dbSet.mockReturnValue({ where: mocks.dbWhere });
  mocks.dbUpdate.mockReturnValue({ set: mocks.dbSet });
  mocks.getSupabaseServiceRoleClient.mockReturnValue({
    channel: () => ({
      httpSend: vi.fn().mockResolvedValue({ success: true }),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
    }),
  });
});

describe("sendRegistrationQrPasses recipient redirect", () => {
  it("normal mode sends to the real attendee and bumps send tracking", async () => {
    mocks.getAppSettings.mockResolvedValue({ checkInTestMode: false, testerEmails: TESTERS });
    mocks.listRegistrationsByIds.mockResolvedValue([makeRow()]);

    const result = await sendRegistrationQrPasses({ year: 2026, ids: [REG_ID] });

    expect(result).toMatchObject({ ok: true, sent: 1, failures: [] });
    expect(mocks.sendRegistrationPass).toHaveBeenCalledTimes(1);
    expect(mocks.sendRegistrationPass.mock.calls[0][0].to).toEqual(["real@attendee.com"]);
    // tracking updated in normal mode
    expect(mocks.dbUpdate).toHaveBeenCalledTimes(1);
  });

  it("test mode redirects to the tester list and does NOT touch the real attendee or send tracking", async () => {
    mocks.getAppSettings.mockResolvedValue({ checkInTestMode: true, testerEmails: TESTERS });
    mocks.listRegistrationsByIds.mockResolvedValue([makeRow()]);

    const result = await sendRegistrationQrPasses({ year: 2026, ids: [REG_ID] });

    expect(result).toMatchObject({ ok: true, sent: 1 });
    expect(mocks.sendRegistrationPass.mock.calls[0][0].to).toEqual(TESTERS);
    expect(mocks.sendRegistrationPass.mock.calls[0][0].to).not.toContain("real@attendee.com");
    // send tracking NOT bumped in test mode
    expect(mocks.dbUpdate).not.toHaveBeenCalled();
  });

  it("test mode with an empty tester list falls back to the fixed address", async () => {
    mocks.getAppSettings.mockResolvedValue({ checkInTestMode: true, testerEmails: [] });
    mocks.listRegistrationsByIds.mockResolvedValue([makeRow()]);

    await sendRegistrationQrPasses({ year: 2026, ids: [REG_ID] });

    expect(mocks.sendRegistrationPass.mock.calls[0][0].to).toEqual([FALLBACK]);
  });

  it("test mode can send a null-email registration (redirected to testers)", async () => {
    mocks.getAppSettings.mockResolvedValue({ checkInTestMode: true, testerEmails: TESTERS });
    mocks.listRegistrationsByIds.mockResolvedValue([makeRow({ email: null })]);

    const result = await sendRegistrationQrPasses({ year: 2026, ids: [REG_ID] });

    expect(result).toMatchObject({ ok: true, sent: 1, failures: [] });
    expect(mocks.sendRegistrationPass.mock.calls[0][0].to).toEqual(TESTERS);
  });

  it("normal mode reports a null-email registration as a failure without sending", async () => {
    mocks.getAppSettings.mockResolvedValue({ checkInTestMode: false, testerEmails: TESTERS });
    mocks.listRegistrationsByIds.mockResolvedValue([makeRow({ email: null })]);

    const result = await sendRegistrationQrPasses({ year: 2026, ids: [REG_ID] });

    expect(result.sent).toBe(0);
    expect(result.failures[0]?.error).toBe("No email on file.");
    expect(mocks.sendRegistrationPass).not.toHaveBeenCalled();
  });
});

describe("checkInRegistration welcome redirect", () => {
  beforeEach(() => {
    mocks.verifyQrPayload.mockReturnValue({ ok: true, id: REG_ID, qrNonce: QR_NONCE });
    // fresh (not yet checked-in) registration, and the conditional update succeeds
    mocks.getRegistrationByQrParts.mockResolvedValue(makeRow());
    mocks.dbReturning.mockResolvedValue([makeRow({ checkedInAt: new Date() })]);
  });

  it("normal mode welcomes the real attendee and records welcomeEmailSentAt", async () => {
    mocks.getAppSettings.mockResolvedValue({ checkInTestMode: false, testerEmails: TESTERS });

    const result = await checkInRegistration({ year: 2026, qrPayload: "signed" });
    await flushAfter();

    expect(result.ok).toBe(true);
    expect(mocks.sendCheckInWelcome).toHaveBeenCalledTimes(1);
    expect(mocks.sendCheckInWelcome.mock.calls[0][0].to).toEqual(["real@attendee.com"]);
    // checkedInAt write + welcomeEmailSentAt write = 2 updates
    expect(mocks.dbUpdate).toHaveBeenCalledTimes(2);
  });

  it("test mode redirects the welcome and does not record welcomeEmailSentAt", async () => {
    mocks.getAppSettings.mockResolvedValue({ checkInTestMode: true, testerEmails: TESTERS });

    const result = await checkInRegistration({ year: 2026, qrPayload: "signed" });
    await flushAfter();

    expect(result.ok).toBe(true);
    expect(mocks.sendCheckInWelcome.mock.calls[0][0].to).toEqual(TESTERS);
    // only the checkedInAt write; welcomeEmailSentAt skipped in test mode
    expect(mocks.dbUpdate).toHaveBeenCalledTimes(1);
  });
});
