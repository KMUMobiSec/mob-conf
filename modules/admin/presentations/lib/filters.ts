import type { ValidYear } from "@/constants/config";
import { parseAdminYear } from "@/modules/admin/lib/year";

export interface ParsedPresentationFilters {
  year: ValidYear;
  /** undefined = all, true = reviewed only, false = not reviewed. */
  reviewed?: boolean;
  q?: string;
}

type SearchParamValue = string | string[] | undefined;

function first(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Parse and sanitize the presentations list query string into typed filters. */
export function parsePresentationListParams(
  sp: Record<string, SearchParamValue>,
): ParsedPresentationFilters {
  const year = parseAdminYear(first(sp.year));
  const reviewedRaw = first(sp.reviewed);
  const reviewed = reviewedRaw === "1" ? true : reviewedRaw === "0" ? false : undefined;
  const q = first(sp.q)?.trim() || undefined;
  return { year, reviewed, q };
}
