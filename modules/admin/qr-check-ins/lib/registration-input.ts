import { parse } from "csv-parse/sync";
import { z } from "zod";
import { normalizePersonName, personDedupeKey } from "@/modules/admin/lib/person-identity";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface RegistrationInput {
  email: string | null;
  name: string;
  affiliation: string | null;
  /** Participant/badge number from the list's `No.` column; null when absent. */
  idNumber: number | null;
}

export interface RegistrationCsvRow extends RegistrationInput {
  rowNumber: number;
}

export interface InvalidRegistrationCsvRow {
  rowNumber: number;
  error: string;
}

export interface RegistrationCsvParseResult {
  validRows: RegistrationCsvRow[];
  invalidRows: InvalidRegistrationCsvRow[];
}

type ManualRegistrationResult =
  | { ok: true; data: RegistrationInput }
  | { ok: false; errors: Record<string, string> };

const registrationSchema = z.object({
  // Email is optional: a blank, whitespace-only, or absent value becomes null
  // (walk-ins with no email on file). A present value must be a valid address.
  email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() ? value.trim() : null),
    z
      .string()
      .refine((value) => EMAIL_RE.test(value), "Invalid email address.")
      .transform(normalizeRegistrationEmail)
      .nullable(),
  ),
  name: z.string().trim().min(1, "Name is required."),
  affiliation: z.preprocess(
    (value) => (typeof value === "string" && value.trim() ? value.trim() : null),
    z.string().nullable(),
  ),
  // Participant number: blank/absent → null; a present value must be a positive whole number.
  // Coercion + validation happen in the transform so an invalid value surfaces a clean row error.
  idNumber: z
    .preprocess(
      (value) => (value == null || String(value).trim() === "" ? null : String(value).trim()),
      z.union([z.null(), z.string()]),
    )
    .transform((value, ctx) => {
      if (value === null) return null;
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ID number must be a positive whole number.",
        });
        return z.NEVER;
      }
      return parsed;
    }),
});

export function normalizeRegistrationEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Registration identity helpers delegate to the shared person-identity rules (email + name). */
export function normalizeRegistrationName(name: string): string {
  return normalizePersonName(name);
}

export function registrationDedupeKey(email: string, name: string): string {
  return personDedupeKey(email, name);
}

export function parseManualRegistrationInput(input: unknown): ManualRegistrationResult {
  const result = registrationSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };

  return {
    ok: false,
    errors: firstIssuePerPath(result.error.issues),
  };
}

export function parseRegistrationCsv(csv: string): RegistrationCsvParseResult {
  let records: Record<string, string>[];
  try {
    records = parse(csv, {
      // Fold headers to lowercase and drop a trailing period so the list's "No." column is
      // reachable as `no`. ("E-mail" folds to `e-mail`, read alongside `email` below.)
      columns: (headers: string[]) =>
        headers.map((header) => header.trim().toLowerCase().replace(/\.+$/, "")),
      skip_empty_lines: true,
      trim: true,
    });
  } catch (error) {
    return {
      validRows: [],
      invalidRows: [{ rowNumber: 1, error: getErrorMessage(error) }],
    };
  }

  const validRows: RegistrationCsvRow[] = [];
  const invalidRows: InvalidRegistrationCsvRow[] = [];

  records.forEach((record, index) => {
    const rowNumber = index + 2;
    const result = parseManualRegistrationInput({
      // The official participant list heads its address column "E-mail" (folds to `e-mail`), while
      // other exports use "Email"; accept either so importing the reference list upserts by
      // (email, name) instead of dropping every address and inserting anonymous duplicates.
      email: record.email ?? record["e-mail"],
      name: record.name,
      affiliation: record.affiliation,
      idNumber: record.no ?? record.id ?? record["id number"],
    });

    if (result.ok) {
      validRows.push({ rowNumber, ...result.data });
    } else {
      invalidRows.push({ rowNumber, error: Object.values(result.errors)[0] ?? "Invalid row." });
    }
  });

  return { validRows, invalidRows };
}

export function dedupeRegistrationCsvRows(rows: RegistrationCsvRow[]): RegistrationCsvRow[] {
  // Collapse rows that share the same email AND name to a single upsert, keeping the last
  // occurrence. Rows with a shared email but different names are distinct people and all pass
  // through. Rows without an email are always distinct and pass through untouched.
  const byKey = new Map<string, RegistrationCsvRow>();
  const withoutEmail: RegistrationCsvRow[] = [];
  for (const row of rows) {
    if (row.email === null) {
      withoutEmail.push(row);
    } else {
      byKey.set(registrationDedupeKey(row.email, row.name), row);
    }
  }
  return [...byKey.values(), ...withoutEmail];
}

function firstIssuePerPath(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !(key in out)) out[key] = issue.message;
  }
  return out;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Could not parse CSV.";
}
