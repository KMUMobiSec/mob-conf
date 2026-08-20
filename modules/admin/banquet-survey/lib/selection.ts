/** Pure selection helpers for the banquet responses table (client-safe, no imports). */

export function toggleBanquetSelection(
  current: Set<string>,
  id: string,
  checked: boolean,
): Set<string> {
  const next = new Set(current);
  if (checked) next.add(id);
  else next.delete(id);
  return next;
}

export function selectAllBanquetRows(ids: string[], checked: boolean): Set<string> {
  return checked ? new Set(ids) : new Set();
}
