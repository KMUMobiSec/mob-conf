import { describe, expect, it } from "vitest";

import {
  MAX_FILE_BYTES,
  MAX_MATERIAL_FILES,
} from "@/modules/landing/presentation-form/lib/constants";
import {
  EMPTY_VALUES,
  type FileLike,
  type PresentationFileSelection,
  type PresentationValues,
  validateMaterials,
  validatePresentation,
  validateVideoFile,
  validateVideoUrl,
} from "@/modules/landing/presentation-form/lib/schema";

const validValues: PresentationValues = {
  paperNumber: "PN-42",
  title: "A Study of Things",
  contactEmail: "author@example.com",
  videoUrl: "",
};

const pdf: FileLike = { name: "deck.pdf", size: 1024, type: "application/pdf" };
const materialsOnly: PresentationFileSelection = { materials: [pdf], video: null };

describe("validateMaterials", () => {
  it("accepts PDF / PPT / PPTX within the size limit", () => {
    expect(validateMaterials([{ name: "a.pdf", size: 10 }])).toBeUndefined();
    expect(validateMaterials([{ name: "a.ppt", size: 10 }])).toBeUndefined();
    expect(validateMaterials([{ name: "a.pptx", size: 10 }])).toBeUndefined();
  });

  it("requires at least one file", () => {
    expect(validateMaterials([])).toMatch(/at least one/i);
  });

  it("rejects disallowed extensions", () => {
    expect(validateMaterials([{ name: "a.docx", size: 10 }])).toMatch(/Unsupported file type/);
    expect(validateMaterials([{ name: "noext", size: 10 }])).toMatch(/Unsupported file type/);
  });

  it("rejects files over the size limit", () => {
    expect(validateMaterials([{ name: "a.pdf", size: MAX_FILE_BYTES + 1 }])).toMatch(
      /maximum upload size/,
    );
  });

  it("rejects more than the max number of files", () => {
    const many = Array.from({ length: MAX_MATERIAL_FILES + 1 }, (_, i) => ({
      name: `d${i}.pdf`,
      size: 10,
    }));
    expect(validateMaterials(many)).toMatch(/at most/i);
  });
});

describe("validateVideoFile", () => {
  it("accepts MP4 / MOV / WEBM within the size limit", () => {
    expect(validateVideoFile({ name: "talk.mp4", size: 10 })).toBeUndefined();
    expect(validateVideoFile({ name: "talk.mov", size: 10 })).toBeUndefined();
    expect(validateVideoFile({ name: "talk.webm", size: 10 })).toBeUndefined();
  });

  it("is optional (no file is valid)", () => {
    expect(validateVideoFile(null)).toBeUndefined();
    expect(validateVideoFile(undefined)).toBeUndefined();
  });

  it("rejects non-video extensions", () => {
    expect(validateVideoFile({ name: "talk.pdf", size: 10 })).toMatch(/Unsupported video type/);
  });

  it("suggests a link when the video is too large", () => {
    expect(validateVideoFile({ name: "talk.mp4", size: MAX_FILE_BYTES + 1 })).toMatch(
      /share a link/i,
    );
  });
});

describe("validateVideoUrl", () => {
  it("accepts an https URL", () => {
    expect(validateVideoUrl("https://drive.google.com/file/d/abc")).toBeUndefined();
  });

  it("is optional when empty", () => {
    expect(validateVideoUrl("")).toBeUndefined();
    expect(validateVideoUrl("   ")).toBeUndefined();
  });

  it("rejects non-https links", () => {
    expect(validateVideoUrl("http://example.com/x")).toMatch(/https/);
    expect(validateVideoUrl("not a url")).toMatch(/https/);
  });
});

describe("validatePresentation", () => {
  it("passes with valid values and at least one material file, no video", () => {
    const { valid, errors } = validatePresentation(validValues, materialsOnly);
    expect(valid).toBe(true);
    expect(errors).toEqual({});
  });

  it("passes with a valid external video link", () => {
    const { valid } = validatePresentation(
      { ...validValues, videoUrl: "https://drive.google.com/x" },
      materialsOnly,
    );
    expect(valid).toBe(true);
  });

  it("flags every missing required field and the missing materials", () => {
    const { valid, errors } = validatePresentation(EMPTY_VALUES, { materials: [], video: null });
    expect(valid).toBe(false);
    expect(errors.paperNumber).toBeDefined();
    expect(errors.title).toBeDefined();
    expect(errors.contactEmail).toBeDefined();
    expect(errors.materials).toBeDefined();
  });

  it("rejects providing both a video file and a link", () => {
    const { valid, errors } = validatePresentation(
      { ...validValues, videoUrl: "https://drive.google.com/x" },
      { materials: [pdf], video: { name: "talk.mp4", size: 10 } },
    );
    expect(valid).toBe(false);
    expect(errors.video).toMatch(/either/i);
  });

  it("rejects an invalid contact email", () => {
    const { valid, errors } = validatePresentation(
      { ...validValues, contactEmail: "not-an-email" },
      materialsOnly,
    );
    expect(valid).toBe(false);
    expect(errors.contactEmail).toMatch(/valid email/);
  });
});
