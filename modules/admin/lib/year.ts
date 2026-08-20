import { CURRENT_YEAR, VALID_YEARS, type ValidYear } from "@/constants/config";

export type AdminYearParam = string | string[] | number | undefined;

function first(value: AdminYearParam): string | number | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseAdminYear(value: AdminYearParam): ValidYear {
  const raw = first(value);
  const year = typeof raw === "number" ? raw : Number(raw);
  return VALID_YEARS.includes(year as ValidYear) ? (year as ValidYear) : CURRENT_YEAR;
}

export function buildAdminYearHref(href: string, year: ValidYear): string {
  const [pathname, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("year", String(year));
  const paramString = params.toString();
  return paramString ? `${pathname}?${paramString}` : pathname;
}
