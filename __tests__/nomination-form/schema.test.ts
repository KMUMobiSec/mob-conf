import { describe, expect, it } from "vitest";

import { MAX_FILE_BYTES, MAX_FILE_MB_LABEL } from "@/modules/landing/nomination-form/lib/constants";
import {
  type FileLike,
  type FilesByKey,
  type NominationValues,
  validateNomination,
} from "@/modules/landing/nomination-form/lib/schema";

function baseValues(award: string): NominationValues {
  return {
    award,
    nom_name: "Ada Lovelace",
    nom_email: "ada@example.com",
    nom_aff: "Analytical Engine Lab",
    nom_rel: "colleague",
    nominee_name: "Alan Turing",
    nominee_email: "alan@example.com",
    nominee_aff: "Bletchley Park",
    nominee_pos: "Researcher",
    nominee_country: "United Kingdom",
    degree: award === "promising_graduate" ? "phd" : "",
    enrollment: award === "promising_graduate" ? "fulltime" : "",
    statement:
      "This nominee has demonstrated outstanding and sustained contributions to the field over many years.",
    consent: true,
  };
}

function file(name: string, size = 1024): FileLike {
  return { name, size, type: "application/pdf" };
}

function baseFiles(award: string): FilesByKey {
  const files: FilesByKey = {
    cv: [file("cv.pdf")],
    achievements: [file("achievements.pdf")],
    supporting: [file("publications.pdf")],
  };
  if (award === "promising_graduate") files.recommendation = [file("recommendation.pdf")];
  if (award === "industry_pioneer") files.slides = [file("slides.pdf")];
  return files;
}

describe("validateNomination", () => {
  it("accepts a complete graduate nomination", () => {
    const result = validateNomination(
      baseValues("promising_graduate"),
      baseFiles("promising_graduate"),
      3,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("accepts a complete young researcher nomination", () => {
    const result = validateNomination(
      baseValues("young_researcher"),
      baseFiles("young_researcher"),
      null,
    );
    expect(result.valid).toBe(true);
  });

  it("flags a missing required field", () => {
    const values = { ...baseValues("young_researcher"), nominee_country: "" };
    const result = validateNomination(values, baseFiles("young_researcher"), null);
    expect(result.valid).toBe(false);
    expect(result.errors.nominee_country).toBe("Country is required.");
  });

  it("flags an invalid email format", () => {
    const values = { ...baseValues("young_researcher"), nom_email: "not-an-email" };
    const result = validateNomination(values, baseFiles("young_researcher"), null);
    expect(result.errors.nom_email).toBe("Enter a valid email address.");
  });

  it("blocks self-nomination for Young Researcher", () => {
    const values = {
      ...baseValues("young_researcher"),
      nominee_email: baseValues("young_researcher").nom_email.toUpperCase(),
    };
    const result = validateNomination(values, baseFiles("young_researcher"), null);
    expect(result.valid).toBe(false);
    expect(result.errors.nominee_email).toContain("Self-nomination is not permitted");
  });

  it("blocks self-nomination for Distinguished Lecturer", () => {
    const values = {
      ...baseValues("exemplary_lecturer"),
      nominee_email: baseValues("exemplary_lecturer").nom_email,
    };
    const result = validateNomination(values, baseFiles("exemplary_lecturer"), null);
    expect(result.errors.nominee_email).toContain("Self-nomination is not permitted");
  });

  it("allows matching emails for awards without the restriction", () => {
    const values = {
      ...baseValues("industry_pioneer"),
      nominee_email: baseValues("industry_pioneer").nom_email,
    };
    const result = validateNomination(values, baseFiles("industry_pioneer"), 3);
    expect(result.errors.nominee_email).toBeUndefined();
  });

  it("requires degree and enrollment for Promising Graduate Student", () => {
    const values = { ...baseValues("promising_graduate"), degree: "", enrollment: "" };
    const result = validateNomination(values, baseFiles("promising_graduate"), null);
    expect(result.errors.degree).toBeDefined();
    expect(result.errors.enrollment).toBeDefined();
  });

  it("requires the supervisor letter for Promising Graduate Student", () => {
    const files = baseFiles("promising_graduate");
    delete files.recommendation;
    const result = validateNomination(baseValues("promising_graduate"), files, null);
    expect(result.errors.recommendation).toBeDefined();
  });

  it("does not require graduate fields for other awards", () => {
    const result = validateNomination(
      baseValues("young_researcher"),
      baseFiles("young_researcher"),
      null,
    );
    expect(result.errors.degree).toBeUndefined();
    expect(result.errors.recommendation).toBeUndefined();
  });

  it("requires slides for Industry Pioneer", () => {
    const files = baseFiles("industry_pioneer");
    delete files.slides;
    const result = validateNomination(baseValues("industry_pioneer"), files, null);
    expect(result.errors.slides).toContain("required");
  });

  it("rejects an over-length slide deck", () => {
    const result = validateNomination(
      baseValues("industry_pioneer"),
      baseFiles("industry_pioneer"),
      6,
    );
    expect(result.errors.slides).toContain("maximum is 5");
  });

  it("does not block when the slide page count is unknown", () => {
    const result = validateNomination(
      baseValues("industry_pioneer"),
      baseFiles("industry_pioneer"),
      null,
    );
    expect(result.valid).toBe(true);
  });

  it("requires a statement of at least 40 characters", () => {
    const values = { ...baseValues("young_researcher"), statement: "Too short." };
    const result = validateNomination(values, baseFiles("young_researcher"), null);
    expect(result.errors.statement).toContain("at least 40 characters");
  });

  it("requires consent", () => {
    const values = { ...baseValues("young_researcher"), consent: false };
    const result = validateNomination(values, baseFiles("young_researcher"), null);
    expect(result.errors.consent).toBeDefined();
  });

  it("requires an award to be selected", () => {
    const values = { ...baseValues("young_researcher"), award: "" };
    const result = validateNomination(values, baseFiles("young_researcher"), null);
    expect(result.errors.award).toBe("Please select an award to nominate for.");
  });

  it("accepts a file at the 30 MB per-file limit", () => {
    const files = baseFiles("young_researcher");
    files.cv = [file("cv.pdf", MAX_FILE_BYTES)];
    const result = validateNomination(baseValues("young_researcher"), files, null);
    expect(result.errors.cv).toBeUndefined();
  });

  it("rejects an oversized file with the file name, actual size, and limit", () => {
    const files = baseFiles("young_researcher");
    files.cv = [file("large-cv.pdf", MAX_FILE_BYTES + 1024 * 1024)];
    const result = validateNomination(baseValues("young_researcher"), files, null);
    expect(result.errors.cv).toBe(
      `large-cv.pdf is 31.0 MB. The maximum upload size is ${MAX_FILE_MB_LABEL} per file.`,
    );
  });

  it("rejects a disallowed file type", () => {
    const files = baseFiles("young_researcher");
    files.cv = [file("cv.exe")];
    const result = validateNomination(baseValues("young_researcher"), files, null);
    expect(result.errors.cv).toContain("Unsupported file type");
  });

  it("accepts a zip in supporting documents but not in the CV", () => {
    const okFiles = baseFiles("young_researcher");
    okFiles.supporting = [file("bundle.zip")];
    expect(
      validateNomination(baseValues("young_researcher"), okFiles, null).errors.supporting,
    ).toBeUndefined();

    const badFiles = baseFiles("young_researcher");
    badFiles.cv = [file("cv.zip")];
    expect(
      validateNomination(baseValues("young_researcher"), badFiles, null).errors.cv,
    ).toBeDefined();
  });
});
