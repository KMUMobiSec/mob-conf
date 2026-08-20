import { z } from "zod";

import { isAllergenId, MAX_ALLERGEN_OTHER_LENGTH, MAX_MESSAGE_LENGTH } from "./constants";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Attending = "" | "yes" | "no";

export interface BanquetValues {
  name: string;
  affiliation: string;
  email: string;
  attending: Attending;
  allergens: string[];
  allergenOther: string;
  message: string;
}

export const EMPTY_VALUES: BanquetValues = {
  name: "",
  affiliation: "",
  email: "",
  attending: "",
  allergens: [],
  allergenOther: "",
  message: "",
};

const baseSchema = z.object({
  name: z.string(),
  affiliation: z.string(),
  email: z.string(),
  attending: z.enum(["", "yes", "no"]),
  allergens: z.array(z.string()),
  allergenOther: z.string(),
  message: z.string(),
});

/**
 * Shared value schema. Conditional, cross-field rules live in a single
 * `superRefine` so the client form and the server action validate identically.
 * Per-field issues are added in priority order, so taking the first issue per
 * field yields the most relevant message.
 */
export const banquetSchema = baseSchema.superRefine((v, ctx) => {
  const add = (path: keyof BanquetValues, message: string) =>
    ctx.addIssue({ code: "custom", path: [path], message });

  if (!v.name.trim()) add("name", "Name is required.");
  if (!v.affiliation.trim()) add("affiliation", "Affiliation is required.");

  if (!v.email.trim()) add("email", "Email is required.");
  else if (!EMAIL_RE.test(v.email.trim())) add("email", "Enter a valid email address.");

  if (v.attending !== "yes" && v.attending !== "no") {
    add("attending", "Please let us know if you will attend.");
  }

  // Dietary fields only apply when attending.
  if (v.attending === "yes") {
    for (const a of v.allergens) {
      if (!isAllergenId(a)) {
        add("allergens", "Select allergens from the provided list.");
        break;
      }
    }
    if (v.allergenOther.trim().length > MAX_ALLERGEN_OTHER_LENGTH) {
      add("allergenOther", `Please keep this under ${MAX_ALLERGEN_OTHER_LENGTH} characters.`);
    }
    if (v.message.trim().length > MAX_MESSAGE_LENGTH) {
      add("message", `Please keep your message under ${MAX_MESSAGE_LENGTH} characters.`);
    }
  }
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

export function getValueErrors(values: BanquetValues): Record<string, string> {
  const result = banquetSchema.safeParse(values);
  if (result.success) return {};
  return firstIssuePerPath(result.error.issues);
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/** Full validation used by both the client form and the server action. */
export function validateBanquet(values: BanquetValues): ValidationResult {
  const errors = getValueErrors(values);
  return { valid: Object.keys(errors).length === 0, errors };
}
