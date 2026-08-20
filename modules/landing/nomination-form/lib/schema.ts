import { z } from "zod";

import {
  type AwardDef,
  DOC_FIELDS,
  type DocFieldKey,
  fileExtension,
  getAward,
  isAwardId,
  MAX_FILE_BYTES,
  MAX_FILE_MB_LABEL,
  MAX_SLIDES,
} from "./constants";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export interface NominationValues {
  award: string;
  nom_name: string;
  nom_email: string;
  nom_aff: string;
  nom_rel: string;
  nominee_name: string;
  nominee_email: string;
  nominee_aff: string;
  nominee_pos: string;
  nominee_country: string;
  degree: string;
  enrollment: string;
  statement: string;
  consent: boolean;
}

export const EMPTY_VALUES: NominationValues = {
  award: "",
  nom_name: "",
  nom_email: "",
  nom_aff: "",
  nom_rel: "",
  nominee_name: "",
  nominee_email: "",
  nominee_aff: "",
  nominee_pos: "",
  nominee_country: "",
  degree: "",
  enrollment: "",
  statement: "",
  consent: false,
};

const baseSchema = z.object({
  award: z.string(),
  nom_name: z.string(),
  nom_email: z.string(),
  nom_aff: z.string(),
  nom_rel: z.string(),
  nominee_name: z.string(),
  nominee_email: z.string(),
  nominee_aff: z.string(),
  nominee_pos: z.string(),
  nominee_country: z.string(),
  degree: z.string(),
  enrollment: z.string(),
  statement: z.string(),
  consent: z.boolean(),
});

/**
 * Shared value schema. Conditional, cross-field rules live in a single
 * `superRefine` so client and server validate identically. Per-field issues are
 * added in priority order (required/format before cross-field), so taking the
 * first issue per field yields the most relevant message.
 */
export const nominationSchema = baseSchema.superRefine((v, ctx) => {
  const add = (path: keyof NominationValues, message: string) =>
    ctx.addIssue({ code: "custom", path: [path], message });

  if (!isAwardId(v.award)) add("award", "Please select an award to nominate for.");

  // Nominator (always required)
  if (!v.nom_name.trim()) add("nom_name", "Nominator name is required.");
  if (!v.nom_email.trim()) add("nom_email", "Nominator email is required.");
  else if (!EMAIL_RE.test(v.nom_email.trim())) add("nom_email", "Enter a valid email address.");
  if (!v.nom_aff.trim()) add("nom_aff", "Affiliation is required.");
  if (!v.nom_rel.trim()) add("nom_rel", "Relationship to nominee is required.");

  // Nominee
  if (!v.nominee_name.trim()) add("nominee_name", "Nominee name is required.");
  if (!v.nominee_email.trim()) add("nominee_email", "Nominee email is required.");
  else if (!EMAIL_RE.test(v.nominee_email.trim()))
    add("nominee_email", "Enter a valid email address.");
  if (!v.nominee_aff.trim()) add("nominee_aff", "Affiliation is required.");
  if (!v.nominee_pos.trim()) add("nominee_pos", "Position / title is required.");
  if (!v.nominee_country.trim()) add("nominee_country", "Country is required.");

  const award = getAward(v.award);

  // Self-nomination rule (only when both emails are present and valid)
  if (
    award?.noSelfNomination &&
    EMAIL_RE.test(v.nom_email.trim()) &&
    EMAIL_RE.test(v.nominee_email.trim()) &&
    v.nom_email.trim().toLowerCase() === v.nominee_email.trim().toLowerCase()
  ) {
    add(
      "nominee_email",
      `Self-nomination is not permitted for the ${award.name}. The nominator and nominee must be different people.`,
    );
  }

  // Grad-only conditional fields
  if (award?.showsGradFields) {
    if (!v.degree) add("degree", "Select the nominee's current degree program.");
    if (!v.enrollment) add("enrollment", "Select the nominee's enrollment status.");
  }

  // Statement
  if (!v.statement.trim()) add("statement", "A nomination statement is required.");
  else if (v.statement.trim().length < 40)
    add("statement", "Please provide a fuller justification (at least 40 characters).");

  // Consent
  if (!v.consent) add("consent", "Please confirm the nominee is aware of this nomination.");
});

function firstIssuePerPath(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !(key in out)) out[key] = issue.message;
  }
  return out;
}

export function getValueErrors(values: NominationValues): Record<string, string> {
  const result = nominationSchema.safeParse(values);
  if (result.success) return {};
  return firstIssuePerPath(result.error.issues);
}

export interface FileLike {
  name: string;
  size: number;
  type?: string;
}

export type FilesByKey = Partial<Record<DocFieldKey, FileLike[]>>;

/** Validate uploads: per-file size/type, then required + conditional documents. */
export function validateFiles(
  award: AwardDef | undefined,
  files: FilesByKey,
  slidePages: number | null,
): Record<string, string> {
  const e: Record<string, string> = {};

  for (const key of Object.keys(files) as DocFieldKey[]) {
    const cfg = DOC_FIELDS[key];
    for (const f of files[key] ?? []) {
      if (f.size > MAX_FILE_BYTES) {
        e[key] =
          `${f.name} is ${formatFileSize(f.size)}. ` +
          `The maximum upload size is ${MAX_FILE_MB_LABEL} per file.`;
        break;
      }
      if (!cfg.extensions.includes(fileExtension(f.name))) {
        e[key] = `Unsupported file type. Allowed: ${cfg.extensions
          .map((x) => x.toUpperCase())
          .join(", ")}.`;
        break;
      }
    }
  }

  if (!e.cv && !files.cv?.length) e.cv = "Curriculum Vitae is required.";
  if (!e.achievements && !files.achievements?.length)
    e.achievements = "A summary of research achievements is required.";
  if (!e.supporting && !files.supporting?.length)
    e.supporting = "At least one supporting document is required.";

  if (award?.requiresSupervisorLetter && !e.recommendation && !files.recommendation?.length) {
    e.recommendation = "A letter of recommendation from the supervisor is required for this award.";
  }

  if (award?.requiresSlides) {
    if (!e.slides && !files.slides?.length) {
      e.slides = "An innovation slide deck (PDF) is required for this award.";
    } else if (!e.slides && slidePages != null && slidePages > MAX_SLIDES) {
      e.slides = `The deck has ${slidePages} pages — the maximum is ${MAX_SLIDES}. Please trim it before submitting.`;
    }
  }

  return e;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/** Full validation used by both the client form and the server action. */
export function validateNomination(
  values: NominationValues,
  files: FilesByKey,
  slidePages: number | null,
): ValidationResult {
  const errors = {
    ...getValueErrors(values),
    ...validateFiles(getAward(values.award), files, slidePages),
  };
  return { valid: Object.keys(errors).length === 0, errors };
}
