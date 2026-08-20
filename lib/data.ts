import { getLocale } from "next-intl/server";
import type { ValidYear } from "@/constants/config";

/**
 * Dynamically loads a locale-specific JSON data file for Server Components.
 *
 * @example
 * ```ts
 * const data = await loadData<VenueData>("venue", 2026);
 * ```
 */
export async function loadData<T>(filename: string, year: ValidYear): Promise<T> {
  const locale = await getLocale();
  try {
    const mod = await import(`@/data/${year}/${locale}/${filename}.json`);
    return mod.default as T;
  } catch {
    // Fallback to English if locale file doesn't exist
    const mod = await import(`@/data/${year}/en/${filename}.json`);
    return mod.default as T;
  }
}
