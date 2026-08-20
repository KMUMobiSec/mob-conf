import {
  isAllergenId,
  MAX_ALLERGEN_OTHER_LENGTH,
  MAX_MESSAGE_LENGTH,
} from "@/modules/landing/banquet-survey/lib/constants";
import { EMAIL_RE } from "@/modules/landing/banquet-survey/lib/schema";

/** Admin edit accepts the invited ("") state in addition to the public yes/no. */
export type EditAttending = "" | "yes" | "no";

export interface BanquetEditInput {
  name: string;
  affiliation: string;
  email: string;
  attending: EditAttending;
  allergens: string[];
  allergenOther: string;
  message: string;
}

/** Column patch applied to a `banquet_responses` row. */
export interface BanquetUpdatePatch {
  name: string;
  affiliation: string | null;
  email: string;
  attending: boolean;
  allergens: string[];
  allergenOther: string | null;
  message: string | null;
  respondedAt: Date | null;
  updatedAt: Date;
}

export type ResolveResult =
  | { ok: true; patch: BanquetUpdatePatch }
  | { ok: false; errors: Record<string, string> };

/**
 * Validate an admin edit and compute the DB patch. Mirrors the public survey's rules but allows
 * reverting to the invited state:
 *  - "yes"      → attending, keeps dietary/message; sets respondedAt (existing timestamp or now).
 *  - "no"       → not attending; clears dietary and message; sets respondedAt (existing or now).
 *  - "" invited → clears every answer and respondedAt, so the person drops back to "Invited".
 *
 * Answers (allergens, notes, message) only persist while attending, matching the storage model.
 * `now` is injected so the result is deterministic and unit-testable.
 */
export function resolveBanquetUpdate(
  input: BanquetEditInput,
  current: { respondedAt: Date | null },
  now: Date,
): ResolveResult {
  const errors: Record<string, string> = {};
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const affiliation = input.affiliation.trim();

  if (!name) errors.name = "Name is required.";
  if (!email) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (input.attending !== "" && input.attending !== "yes" && input.attending !== "no") {
    errors.attending = "Choose a valid attendance option.";
  }

  const attendingYes = input.attending === "yes";
  if (attendingYes) {
    if (input.allergens.some((a) => !isAllergenId(a))) {
      errors.allergens = "Select allergens from the provided list.";
    }
    if (input.allergenOther.trim().length > MAX_ALLERGEN_OTHER_LENGTH) {
      errors.allergenOther = `Please keep this under ${MAX_ALLERGEN_OTHER_LENGTH} characters.`;
    }
    if (input.message.trim().length > MAX_MESSAGE_LENGTH) {
      errors.message = `Please keep this under ${MAX_MESSAGE_LENGTH} characters.`;
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const responded = input.attending === "yes" || input.attending === "no";
  return {
    ok: true,
    patch: {
      name,
      affiliation: affiliation || null,
      email,
      attending: attendingYes,
      allergens: attendingYes ? input.allergens : [],
      allergenOther: attendingYes ? input.allergenOther.trim() || null : null,
      message: attendingYes ? input.message.trim() || null : null,
      respondedAt: responded ? (current.respondedAt ?? now) : null,
      updatedAt: now,
    },
  };
}

/**
 * Patch that clears every answer and reverts a response to the invited state, keeping the
 * person's identity (name/affiliation/email) and email-send history. Used by "Clear answers".
 */
export function clearedBanquetPatch(now: Date): {
  attending: boolean;
  allergens: string[];
  allergenOther: string | null;
  message: string | null;
  respondedAt: Date | null;
  updatedAt: Date;
} {
  return {
    attending: false,
    allergens: [],
    allergenOther: null,
    message: null,
    respondedAt: null,
    updatedAt: now,
  };
}
