import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface AdminMessages {
  Admin: {
    common: Record<string, string>;
    login: Record<string, string>;
    sidebar: {
      nav: Record<string, string>;
      groups: Record<string, string>;
      year: Record<string, string>;
      theme: Record<string, string>;
      account: Record<string, string>;
      language: Record<string, string>;
    };
    header: {
      sections: Record<string, string>;
    };
    qrCheckIns: {
      page: Record<string, unknown>;
      registrations: {
        searchPlaceholder: string;
        searchAriaLabel: string;
        filterStatusAriaLabel: string;
        allRegistrations: string;
        checkedIn: string;
        notCheckedIn: string;
        clearFilters: string;
        empty: string;
        selectedSummary: string;
        sendSelected: string;
        sendSuccess: string;
        undoSuccess: string;
        summary: string;
        columns: Record<string, string>;
      };
      dialogs: {
        addTitle: string;
        editTitle: string;
        importTitle: string;
      };
      testMode: {
        label: string;
        compact: string;
        full: string;
      };
    };
  };
}

function loadMessages(locale: string): AdminMessages {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), `messages/${locale}.json`), "utf8"),
  ) as AdminMessages;
}

const LOCALES = ["en", "kr"] as const;

describe("Admin i18n", () => {
  for (const locale of LOCALES) {
    it(`${locale}.json exposes the core Admin namespace`, () => {
      const admin = loadMessages(locale).Admin;
      expect(admin).toBeTruthy();

      for (const key of [
        "search",
        "clear",
        "save",
        "cancel",
        "loading",
        "previous",
        "next",
        "selectYear",
      ]) {
        expect(typeof admin.common[key]).toBe("string");
      }

      for (const key of ["title", "description", "email", "password", "submit", "submitting"]) {
        expect(typeof admin.login[key]).toBe("string");
      }

      for (const key of ["management", "system"]) {
        expect(typeof admin.sidebar.groups[key]).toBe("string");
      }

      for (const key of [
        "nominations",
        "presentations",
        "qrCheckIns",
        "emailBlast",
        "forms",
        "setup",
      ]) {
        expect(typeof admin.sidebar.nav[key]).toBe("string");
        expect(typeof admin.header.sections[key]).toBe("string");
      }

      for (const key of ["label", "tooltip"]) {
        expect(typeof admin.sidebar.year[key]).toBe("string");
      }

      for (const key of ["light", "dark", "system"]) {
        expect(typeof admin.sidebar.theme[key]).toBe("string");
      }

      for (const key of ["signOut", "signingOut"]) {
        expect(typeof admin.sidebar.account[key]).toBe("string");
      }

      for (const key of ["label", "english", "korean"]) {
        expect(typeof admin.sidebar.language[key]).toBe("string");
      }

      expect(typeof admin.qrCheckIns.registrations.searchPlaceholder).toBe("string");
      expect(typeof admin.qrCheckIns.registrations.searchAriaLabel).toBe("string");
      expect(typeof admin.qrCheckIns.registrations.filterStatusAriaLabel).toBe("string");
      expect(typeof admin.qrCheckIns.registrations.allRegistrations).toBe("string");
      expect(typeof admin.qrCheckIns.registrations.checkedIn).toBe("string");
      expect(typeof admin.qrCheckIns.registrations.notCheckedIn).toBe("string");
      expect(typeof admin.qrCheckIns.registrations.clearFilters).toBe("string");
      expect(typeof admin.qrCheckIns.registrations.empty).toBe("string");
      expect(typeof admin.qrCheckIns.registrations.selectedSummary).toBe("string");
      expect(typeof admin.qrCheckIns.registrations.sendSelected).toBe("string");
      expect(typeof admin.qrCheckIns.registrations.sendSuccess).toBe("string");
      expect(typeof admin.qrCheckIns.registrations.undoSuccess).toBe("string");
      expect(typeof admin.qrCheckIns.registrations.summary).toBe("string");

      for (const key of ["attendee", "email", "affiliation", "qrEmail", "checkIn"]) {
        expect(typeof admin.qrCheckIns.registrations.columns[key]).toBe("string");
      }

      for (const key of ["addTitle", "editTitle", "importTitle"] as const) {
        expect(typeof admin.qrCheckIns.dialogs[key]).toBe("string");
      }

      for (const key of ["label", "compact", "full"] as const) {
        expect(typeof admin.qrCheckIns.testMode[key]).toBe("string");
      }
    });
  }
});
