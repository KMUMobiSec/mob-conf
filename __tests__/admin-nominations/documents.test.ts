import { describe, expect, it } from "vitest";

import type { NominationDocuments } from "@/db/schema";
import {
  collectDocumentPaths,
  isKnownDocumentPath,
} from "@/modules/admin/nominations/lib/documents";

const documents: NominationDocuments = {
  cv: [{ path: "2026/abc/cv/cv.pdf", name: "cv.pdf", size: 10 }],
  supporting: [
    { path: "2026/abc/supporting/a.pdf", name: "a.pdf", size: 1 },
    { path: "2026/abc/supporting/b.pdf", name: "b.pdf", size: 2 },
  ],
};

describe("isKnownDocumentPath", () => {
  it("returns true for a stored path", () => {
    expect(isKnownDocumentPath(documents, "2026/abc/cv/cv.pdf")).toBe(true);
    expect(isKnownDocumentPath(documents, "2026/abc/supporting/b.pdf")).toBe(true);
  });

  it("returns false for an unknown path", () => {
    expect(isKnownDocumentPath(documents, "2026/abc/cv/evil.pdf")).toBe(false);
    expect(isKnownDocumentPath(documents, "../../secrets")).toBe(false);
  });

  it("returns false for empty input", () => {
    expect(isKnownDocumentPath(documents, "")).toBe(false);
    expect(isKnownDocumentPath(null, "2026/abc/cv/cv.pdf")).toBe(false);
    expect(isKnownDocumentPath({}, "2026/abc/cv/cv.pdf")).toBe(false);
  });
});

describe("collectDocumentPaths", () => {
  it("returns every stored path across fields", () => {
    expect(collectDocumentPaths(documents)).toEqual([
      "2026/abc/cv/cv.pdf",
      "2026/abc/supporting/a.pdf",
      "2026/abc/supporting/b.pdf",
    ]);
  });

  it("returns an empty array for missing documents", () => {
    expect(collectDocumentPaths(null)).toEqual([]);
    expect(collectDocumentPaths({})).toEqual([]);
  });
});
