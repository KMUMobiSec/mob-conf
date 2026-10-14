import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const batchSend = vi.fn();
const emailSend = vi.fn();
vi.mock("@/lib/email/resend", () => ({
  getResendClient: () => ({ batch: { send: batchSend }, emails: { send: emailSend } }),
}));

const { sendEmailBlastMessages } = await import("@/lib/email/email-blast");

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_EMAIL_FROM_NOREPLY = "noreply@mobisec.test";
});

describe("sendEmailBlastMessages", () => {
  it("uses permissive validation, delivering valid recipients and failing only the rejects", async () => {
    batchSend.mockResolvedValue({
      data: {
        data: [{ id: "1" }, { id: "3" }],
        errors: [{ index: 1, message: "invalid address" }],
      },
      error: null,
    });

    const result = await sendEmailBlastMessages({
      subject: "Hi",
      html: "<p>x</p>",
      recipients: ["a@x.com", "bad@x.com", "c@x.com"],
    });

    expect(batchSend).toHaveBeenCalledWith(expect.any(Array), { batchValidation: "permissive" });
    expect(result.sent).toBe(2);
    expect(result.failed).toEqual([{ email: "bad@x.com", error: "invalid address" }]);
  });

  it("marks the whole chunk failed on a top-level batch error", async () => {
    batchSend.mockResolvedValue({ data: null, error: { message: "rate limited", name: "rate" } });

    const result = await sendEmailBlastMessages({
      subject: "Hi",
      html: "<p>x</p>",
      recipients: ["a@x.com", "b@x.com"],
    });

    expect(result.sent).toBe(0);
    expect(result.failed).toEqual([
      { email: "a@x.com", error: "rate limited" },
      { email: "b@x.com", error: "rate limited" },
    ]);
  });

  it("counts a clean batch as all sent", async () => {
    batchSend.mockResolvedValue({ data: { data: [{ id: "1" }], errors: [] }, error: null });
    const result = await sendEmailBlastMessages({
      subject: "Hi",
      html: "<p>x</p>",
      recipients: ["only@x.com"],
    });
    expect(result.sent).toBe(1);
    expect(result.failed).toEqual([]);
  });
});
