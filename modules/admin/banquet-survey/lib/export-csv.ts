import { allergenLabel } from "@/modules/landing/banquet-survey/lib/constants";

/** Fields needed for a CSV row — a structural subset of `BanquetResponse`. */
export interface BanquetCsvRow {
  name: string;
  affiliation: string | null;
  email: string;
  attending: boolean;
  respondedAt: Date | null;
  allergens: string[];
  allergenOther: string | null;
  message: string | null;
  invitationsSentCount: number;
  invitationSentAt: Date | null;
  emailsSentCount: number;
  confirmationSentAt: Date | null;
}

const HEADERS = [
  "Name",
  "Affiliation",
  "Email",
  "Status",
  "Attending",
  "Allergens",
  "Other dietary",
  "Message",
  "Responded at",
  "Invitations sent",
  "Invitation last sent",
  "Confirmations sent",
  "Confirmation last sent",
] as const;

/** Quote a cell only when it contains a comma, quote, or newline (RFC 4180). */
function cell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function iso(date: Date | null): string {
  return date ? date.toISOString() : "";
}

/** Human status matching the admin table's badge: Invited / Attending / Not attending. */
export function csvStatus(row: Pick<BanquetCsvRow, "attending" | "respondedAt">): string {
  if (!row.respondedAt) return "Invited";
  return row.attending ? "Attending" : "Not attending";
}

/**
 * Serialize banquet responses to a CRLF-delimited CSV table (header + one row each). Pure and
 * spreadsheet-safe; the download route prepends a UTF-8 BOM so Excel reads accents correctly.
 */
export function toBanquetCsv(rows: BanquetCsvRow[]): string {
  const lines = [HEADERS.map(cell).join(",")];
  for (const row of rows) {
    const cols = [
      row.name,
      row.affiliation ?? "",
      row.email,
      csvStatus(row),
      row.respondedAt ? (row.attending ? "Yes" : "No") : "",
      row.allergens.map(allergenLabel).join("; "),
      row.allergenOther ?? "",
      row.message ?? "",
      iso(row.respondedAt),
      String(row.invitationsSentCount),
      iso(row.invitationSentAt),
      String(row.emailsSentCount),
      iso(row.confirmationSentAt),
    ];
    lines.push(cols.map(cell).join(","));
  }
  return lines.join("\r\n");
}
