/**
 * Award definitions, document-field configuration, and shared limits for the
 * nomination form. Imported by both the client form and the server action so
 * the conditional rules and copy live in one place.
 */

export const AWARD_IDS = [
  "exemplary_lecturer",
  "young_researcher",
  "promising_graduate",
  "industry_pioneer",
] as const;

export type AwardId = (typeof AWARD_IDS)[number];

export interface AwardDef {
  id: AwardId;
  name: string;
  /** Nominator and nominee must be different people. */
  noSelfNomination: boolean;
  /** Reveal degree-program + enrollment-status fields. */
  showsGradFields: boolean;
  /** Supervisor recommendation letter is required. */
  requiresSupervisorLetter: boolean;
  /** Innovation slide deck (PDF, <= MAX_SLIDES pages) is required. */
  requiresSlides: boolean;
  /** Teaching/service record is labeled "Recommended" instead of optional. */
  recommendsTeaching: boolean;
}

export const AWARDS: AwardDef[] = [
  {
    id: "exemplary_lecturer",
    name: "Distinguished Lecturer Award",
    noSelfNomination: true,
    showsGradFields: false,
    requiresSupervisorLetter: false,
    requiresSlides: false,
    recommendsTeaching: true,
  },
  {
    id: "young_researcher",
    name: "Young Researcher Award",
    noSelfNomination: true,
    showsGradFields: false,
    requiresSupervisorLetter: false,
    requiresSlides: false,
    recommendsTeaching: false,
  },
  {
    id: "promising_graduate",
    name: "Promising Graduate Student Award",
    noSelfNomination: false,
    showsGradFields: true,
    requiresSupervisorLetter: true,
    requiresSlides: false,
    recommendsTeaching: false,
  },
  {
    id: "industry_pioneer",
    name: "Industry Pioneer Award",
    noSelfNomination: false,
    showsGradFields: false,
    requiresSupervisorLetter: false,
    requiresSlides: true,
    recommendsTeaching: false,
  },
];

export function getAward(id: string): AwardDef | undefined {
  return AWARDS.find((a) => a.id === id);
}

export function isAwardId(id: string): id is AwardId {
  return (AWARD_IDS as readonly string[]).includes(id);
}

/** Maximum pages allowed in the Industry Pioneer innovation slide deck. */
export const MAX_SLIDES = 5;

/** Per-file upload size cap (30 MB). */
export const MAX_FILE_BYTES = 30 * 1024 * 1024;
export const MAX_FILE_MB = MAX_FILE_BYTES / (1024 * 1024);
export const MAX_FILE_MB_LABEL = `${MAX_FILE_MB} MB`;

export const DEGREE_OPTIONS = [
  { value: "masters", label: "Master's" },
  { value: "phd", label: "Ph.D." },
] as const;

export const ENROLLMENT_OPTIONS = [
  { value: "fulltime", label: "Full-time" },
  { value: "parttime", label: "Part-time" },
] as const;

export function degreeLabel(value: string): string | null {
  return DEGREE_OPTIONS.find((o) => o.value === value)?.label ?? null;
}

export function enrollmentLabel(value: string): string | null {
  return ENROLLMENT_OPTIONS.find((o) => o.value === value)?.label ?? null;
}

/** Accept presets shared by document fields. */
const DOC_EXTENSIONS = ["pdf", "doc", "docx"];
const DOC_ZIP_EXTENSIONS = ["pdf", "doc", "docx", "zip"];
const PDF_EXTENSIONS = ["pdf"];

export const DOC_FIELD_KEYS = [
  "cv",
  "achievements",
  "supporting",
  "teaching",
  "recommendation",
  "slides",
] as const;

export type DocFieldKey = (typeof DOC_FIELD_KEYS)[number];

export interface DocFieldConfig {
  key: DocFieldKey;
  /** `accept` attribute for the file input. */
  accept: string;
  /** Allowed lower-case file extensions (validation allow-list). */
  extensions: string[];
  multiple: boolean;
}

export const DOC_FIELDS: Record<DocFieldKey, DocFieldConfig> = {
  cv: { key: "cv", accept: ".pdf,.doc,.docx", extensions: DOC_EXTENSIONS, multiple: false },
  achievements: {
    key: "achievements",
    accept: ".pdf,.doc,.docx",
    extensions: DOC_EXTENSIONS,
    multiple: false,
  },
  supporting: {
    key: "supporting",
    accept: ".pdf,.doc,.docx,.zip",
    extensions: DOC_ZIP_EXTENSIONS,
    multiple: true,
  },
  teaching: {
    key: "teaching",
    accept: ".pdf,.doc,.docx",
    extensions: DOC_EXTENSIONS,
    multiple: false,
  },
  recommendation: {
    key: "recommendation",
    accept: ".pdf,.doc,.docx",
    extensions: DOC_EXTENSIONS,
    multiple: false,
  },
  slides: { key: "slides", accept: ".pdf", extensions: PDF_EXTENSIONS, multiple: false },
};

/** Human-readable label for each document field (used in success recap + email). */
export const DOC_LABELS: Record<DocFieldKey, string> = {
  cv: "Curriculum Vitae",
  achievements: "Research achievements summary",
  supporting: "Supporting documentation",
  teaching: "Teaching / service record",
  recommendation: "Supervisor recommendation letter",
  slides: "Innovation slides",
};

export function fileExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}
