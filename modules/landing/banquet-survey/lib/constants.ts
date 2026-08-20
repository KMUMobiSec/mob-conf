/**
 * Shared, side-effect-free constants for the banquet survey. Imported by the
 * client form, the shared schema, the submit action, the confirmation email, and
 * the admin dashboard, so everything agrees on allergen ids and copy fallbacks.
 */

/** Fallback banquet date label used when the admin setting is unset. */
export const BANQUET_DATE_FALLBACK = "July 9";
/** Fallback banquet venue label used when the admin setting is unset. */
export const BANQUET_VENUE_FALLBACK = "the Plaza Hotel";

export const ALLERGEN_OPTIONS = [
  { value: "nuts", label: "Nuts" },
  { value: "shellfish", label: "Shellfish" },
  { value: "dairy", label: "Dairy" },
  { value: "gluten", label: "Gluten" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
] as const;

export type AllergenId = (typeof ALLERGEN_OPTIONS)[number]["value"];

const ALLERGEN_IDS = new Set<string>(ALLERGEN_OPTIONS.map((o) => o.value));

export function isAllergenId(value: string): value is AllergenId {
  return ALLERGEN_IDS.has(value);
}

/** Human label for an allergen id (falls back to the raw id if unknown). */
export function allergenLabel(value: string): string {
  return ALLERGEN_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export const MAX_ALLERGEN_OTHER_LENGTH = 300;
export const MAX_MESSAGE_LENGTH = 1000;
