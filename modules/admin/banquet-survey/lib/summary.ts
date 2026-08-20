import { ALLERGEN_OPTIONS, allergenLabel } from "@/modules/landing/banquet-survey/lib/constants";

/** Minimal shape needed to aggregate dietary figures — a superset of `BanquetResponse`. */
export interface DietaryRow {
  attending: boolean;
  respondedAt: Date | null;
  allergens: string[];
  allergenOther: string | null;
}

export interface AllergenCount {
  id: string;
  label: string;
  count: number;
}

/** A row counts toward dietary figures only when the person responded AND is attending. */
function isAttending(row: DietaryRow): boolean {
  return row.respondedAt !== null && row.attending;
}

/**
 * Per-allergen counts among attending respondents, ordered by the canonical allergen list with
 * any unknown ids appended. Allergens with a zero count are omitted so the caterer report only
 * lists what's actually needed.
 */
export function allergenBreakdown(rows: DietaryRow[]): AllergenCount[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!isAttending(row)) continue;
    for (const id of row.allergens) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const result: AllergenCount[] = [];
  for (const option of ALLERGEN_OPTIONS) {
    const count = counts.get(option.value) ?? 0;
    if (count > 0) result.push({ id: option.value, label: option.label, count });
  }
  for (const [id, count] of counts) {
    if (!ALLERGEN_OPTIONS.some((o) => o.value === id)) {
      result.push({ id, label: allergenLabel(id), count });
    }
  }
  return result;
}

/** Attending respondents who left a free-text dietary note. */
export function otherDietaryCount(rows: DietaryRow[]): number {
  return rows.filter(
    (row) => isAttending(row) && row.allergenOther !== null && row.allergenOther.trim() !== "",
  ).length;
}

/** An attending guest who reported any allergen or a free-text dietary note. */
export function hasDietaryNeed(row: DietaryRow): boolean {
  return isAttending(row) && (row.allergens.length > 0 || (row.allergenOther?.trim() ?? "") !== "");
}

/**
 * The attending guest list for the report: only people who are coming, with dietary-needs guests
 * first (so the caterer sees them at a glance), then alphabetical by name within each group.
 */
export function orderAttendingForReport<T extends DietaryRow & { name: string }>(rows: T[]): T[] {
  const rank = (row: T) => (hasDietaryNeed(row) ? 0 : 1);
  return rows.filter(isAttending).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}
