/**
 * DOM id of the campus "Getting Around" wayfinder section on the year home page.
 * Shared so the anchor on the page and the email deep-link can never drift apart.
 */
export const GETTING_AROUND_ANCHOR = "getting-around";

/** Absolute URL to the campus wayfinder section for a given year, e.g. https://…/2026#getting-around */
export function gettingAroundUrl(baseUrl: string, year: number): string {
  return `${baseUrl.replace(/\/$/, "")}/${year}#${GETTING_AROUND_ANCHOR}`;
}
