import type { ValidYear } from "@/constants/config";
import { parseAdminYear } from "@/modules/admin/lib/year";

/** Rows per page for the banquet survey list, matching the other admin lists. */
export const PAGE_SIZE = 20;

/** Status filter as carried in the query string. */
export type BanquetStatusParam = "" | "invited" | "attending" | "not_attending";

const STATUS_VALUES: readonly BanquetStatusParam[] = ["invited", "attending", "not_attending"];

export interface ParsedBanquetFilters {
  year: ValidYear;
  q?: string;
  status: BanquetStatusParam;
  page: number;
}

type SearchParamValue = string | string[] | undefined;

function first(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Parse and sanitize the banquet survey list query string into typed filters. */
export function parseBanquetListParams(sp: Record<string, SearchParamValue>): ParsedBanquetFilters {
  const year = parseAdminYear(first(sp.year));
  const q = first(sp.q)?.trim() || undefined;
  const statusRaw = first(sp.status);
  const status: BanquetStatusParam = STATUS_VALUES.includes(statusRaw as BanquetStatusParam)
    ? (statusRaw as BanquetStatusParam)
    : "";
  const page = Math.max(1, Number(first(sp.page)) || 1);
  return { year, q, status, page };
}
