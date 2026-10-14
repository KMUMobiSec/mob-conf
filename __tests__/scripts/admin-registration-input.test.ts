import { describe, expect, it } from "vitest";
import { collectAdminRegistrationInput } from "@/scripts/admin-registration-input";

describe("collectAdminRegistrationInput", () => {
  it("prompts for email and password when env values are missing", async () => {
    const prompts: Array<{ question: string; hidden?: boolean }> = [];

    const input = await collectAdminRegistrationInput({}, async (question, options) => {
      prompts.push({ question, hidden: options?.hidden });

      if (question === "Email: ") return "Admin@Example.COM";
      if (question === "Password: ") return "correct horse battery staple";

      throw new Error(`Unexpected prompt: ${question}`);
    });

    expect(input).toEqual({
      email: "admin@example.com",
      password: "correct horse battery staple",
      name: "MOBISEC Admin",
    });
    expect(prompts).toEqual([{ question: "Email: " }, { question: "Password: ", hidden: true }]);
  });

  it("uses env values without prompting for non-interactive runs", async () => {
    const input = await collectAdminRegistrationInput(
      {
        ADMIN_EMAIL: "ops@example.com",
        ADMIN_PASSWORD: "long-enough-password",
        ADMIN_NAME: "Ops Admin",
      },
      async () => {
        throw new Error("Prompt should not be called");
      },
    );

    expect(input).toEqual({
      email: "ops@example.com",
      password: "long-enough-password",
      name: "Ops Admin",
    });
  });

  it("rejects short passwords", async () => {
    await expect(
      collectAdminRegistrationInput({}, async (question) => {
        if (question === "Email: ") return "admin@example.com";
        if (question === "Password: ") return "short";
        throw new Error(`Unexpected prompt: ${question}`);
      }),
    ).rejects.toThrow("Admin password must be at least 8 characters.");
  });
});
