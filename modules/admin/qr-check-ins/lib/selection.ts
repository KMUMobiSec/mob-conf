import type { ValidYear } from "@/constants/config";

export interface SelectableRegistrationRow {
  id: string;
  year: number;
}

export function selectAllRegistrationRows(
  rows: SelectableRegistrationRow[],
  year: ValidYear,
): Set<string> {
  return new Set(rows.filter((row) => row.year === year).map((row) => row.id));
}

export function toggleRegistrationSelection(
  current: ReadonlySet<string>,
  id: string,
  checked: boolean,
): Set<string> {
  const next = new Set(current);
  if (checked) next.add(id);
  else next.delete(id);
  return next;
}
