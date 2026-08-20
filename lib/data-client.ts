/**
 * Selects the correct data for the current locale in Client Components.
 *
 * Client Components cannot use async imports, so they should import both
 * locale files statically and use this helper to pick the right one.
 *
 * @example
 * ```tsx
 * import { useLocale } from "next-intl";
 * import enData from "@/data/2026/en/venue.json";
 * import krData from "@/data/2026/kr/venue.json";
 * import { selectData } from "@/lib/data-client";
 *
 * const MyComponent = () => {
 *   const locale = useLocale();
 *   const data = selectData(locale, enData, krData);
 * };
 * ```
 */
export function selectData<T>(locale: string, enData: T, krData: T): T {
  return locale === "kr" ? krData : enData;
}
