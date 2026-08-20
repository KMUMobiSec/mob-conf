export function rollOfHonorsPath(year: number): string {
  return `/${year}/roll-of-honors`;
}

export function rollOfHonorsUrl(baseUrl: string, year: number): string {
  return `${baseUrl.replace(/\/$/, "")}${rollOfHonorsPath(year)}`;
}
