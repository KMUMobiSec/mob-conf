import { describe, expect, it } from "vitest";

import { countPdfPages } from "@/modules/landing/nomination-form/lib/pdf-pages";

function pdfBlob(content: string): Blob {
  return new Blob([content], { type: "application/pdf" });
}

describe("countPdfPages", () => {
  it("reads the page count from a /Count marker", async () => {
    const blob = pdfBlob("%PDF-1.7\n<< /Type /Pages /Count 3 /Kids [] >>\n");
    expect(await countPdfPages(blob)).toBe(3);
  });

  it("uses the largest /Count when several are present", async () => {
    const blob = pdfBlob("/Count 2 ... /Count 7 ... /Count 1");
    expect(await countPdfPages(blob)).toBe(7);
  });

  it("falls back to counting /Type /Page objects", async () => {
    const blob = pdfBlob("/Type /Page\n...content...\n/Type /Page\n...more...\n/Type /Page\n");
    expect(await countPdfPages(blob)).toBe(3);
  });

  it("returns null when no page information is present", async () => {
    const blob = pdfBlob("just some text without any pdf page markers");
    expect(await countPdfPages(blob)).toBeNull();
  });
});
