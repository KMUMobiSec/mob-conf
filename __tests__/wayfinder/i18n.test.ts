import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface Messages {
  Wayfinder: {
    roles: Record<string, string>;
    steps: Record<string, { title: string; body: string }>;
  } & Record<string, unknown>;
}

function loadMessages(locale: string): Messages {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), `messages/${locale}.json`), "utf8"),
  ) as Messages;
}

const LOCALES = ["en", "kr"] as const;
const TOP_LEVEL_KEYS = [
  "sectionLabel",
  "title",
  "description",
  "mapUnavailable",
  "back",
  "next",
  "stepLabel",
  "pinAriaLabel",
];
const STEP_IDS = ["gate", "registration", "paper", "lunch"];

describe("Wayfinder i18n", () => {
  for (const locale of LOCALES) {
    it(`${locale}.json exposes the full Wayfinder namespace`, () => {
      const wayfinder = loadMessages(locale).Wayfinder;
      expect(wayfinder).toBeTruthy();

      for (const key of TOP_LEVEL_KEYS) {
        expect(typeof wayfinder[key]).toBe("string");
      }

      for (const id of STEP_IDS) {
        expect(typeof wayfinder.roles[id]).toBe("string");
        expect(typeof wayfinder.steps[id]?.title).toBe("string");
        expect(typeof wayfinder.steps[id]?.body).toBe("string");
      }
    });
  }
});
