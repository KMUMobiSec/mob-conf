import type { ValidYear } from "@/constants/config";
import { parseAdminYear } from "@/modules/admin/lib/year";

export interface ParsedNominationFilters {
  year: ValidYear;
  award?: string;
  winner: boolean;
  q?: string;
}

type SearchParamValue = string | string[] | undefined;

function first(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Parse and sanitize the nominations list query string into typed filters. */
export function parseNominationListParams(
  sp: Record<string, SearchParamValue>,
): ParsedNominationFilters {
  const year = parseAdminYear(first(sp.year));
  const award = first(sp.award) || undefined;
  const winner = first(sp.winner) === "1";
  const q = first(sp.q)?.trim() || undefined;
  return { year, award, winner, q };
}
