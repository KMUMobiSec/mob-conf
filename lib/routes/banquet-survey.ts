export interface BanquetSurveyLinkParams {
  email?: string;
  name?: string;
  affiliation?: string;
}

export function banquetSurveyPath(year: number, params?: BanquetSurveyLinkParams): string {
  const path = `/${year}/banquet-survey`;
  const query = new URLSearchParams();
  if (params?.email) query.set("email", params.email);
  if (params?.name) query.set("name", params.name);
  if (params?.affiliation) query.set("affiliation", params.affiliation);
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}

export function banquetSurveyUrl(
  baseUrl: string,
  year: number,
  params?: BanquetSurveyLinkParams,
): string {
  return `${baseUrl.replace(/\/$/, "")}${banquetSurveyPath(year, params)}`;
}
