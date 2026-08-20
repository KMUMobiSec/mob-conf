export function registrationPassPath(registrationId: string): string {
  return `/registration-pass/${encodeURIComponent(registrationId)}`;
}

export function registrationPassUrl(baseUrl: string, registrationId: string): string {
  return `${baseUrl.replace(/\/$/, "")}${registrationPassPath(registrationId)}`;
}
