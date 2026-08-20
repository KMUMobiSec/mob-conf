/**
 * Render a participant ID number as a zero-padded, at-least-3-digit string (`1` → `001`,
 * `12` → `012`, `200` → `200`). Numbers with 4+ digits are returned intact (never truncated),
 * so the badge number stays readable if the list ever grows past 999.
 */
export function formatIdNumber(idNumber: number): string {
  return String(idNumber).padStart(3, "0");
}
