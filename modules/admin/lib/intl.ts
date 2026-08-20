export function adminLocale(locale: string): string {
  return locale === "kr" ? "ko-KR" : "en-US";
}

export function formatAdminDate(locale: string, value: Date): string {
  return new Intl.DateTimeFormat(adminLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

export function formatAdminDateTime(locale: string, value: Date): string {
  return new Intl.DateTimeFormat(adminLocale(locale), {
    dateStyle: "long",
    timeStyle: "short",
  }).format(value);
}
