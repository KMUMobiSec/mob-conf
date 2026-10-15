import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { type PresentationRosterRow, presentationRoster, presentations } from "@/db/schema";

/** Normalize a paper number for matching (case/whitespace-insensitive). */
function normalizePaperNumber(value: string): string {
  return value.trim().toLowerCase();
}

export interface RosterStatusRow {
  rosterId: string;
  paperNumber: string;
  title: string;
  author: string;
  contactEmail: string;
  /** The matched submission, if the author has already uploaded. */
  presentationId: string | null;
  submittedAt: Date | null;
}

export interface RosterSummary {
  total: number;
  uploaded: number;
  pending: number;
}

/** The roster for a year, each row annotated with whether (and when) it was uploaded. */
export async function listPresentationRosterStatus(year: number): Promise<RosterStatusRow[]> {
  const [roster, submissions] = await Promise.all([
    db.select().from(presentationRoster).where(eq(presentationRoster.year, year)),
    db
      .select({
        id: presentations.id,
        paperNumber: presentations.paperNumber,
        createdAt: presentations.createdAt,
      })
      .from(presentations)
      .where(eq(presentations.year, year)),
  ]);

  const byPaperNumber = new Map<string, { id: string; createdAt: Date }>();
  for (const submission of submissions) {
    byPaperNumber.set(normalizePaperNumber(submission.paperNumber), {
      id: submission.id,
      createdAt: submission.createdAt,
    });
  }

  return roster
    .map((row) => {
      const match = byPaperNumber.get(normalizePaperNumber(row.paperNumber));
      return {
        rosterId: row.id,
        paperNumber: row.paperNumber,
        title: row.title,
        author: row.author,
        contactEmail: row.contactEmail,
        presentationId: match?.id ?? null,
        submittedAt: match?.createdAt ?? null,
      };
    })
    .sort((a, b) => a.paperNumber.localeCompare(b.paperNumber, undefined, { numeric: true }));
}

export function summarizeRoster(rows: RosterStatusRow[]): RosterSummary {
  const uploaded = rows.filter((row) => row.presentationId !== null).length;
  return { total: rows.length, uploaded, pending: rows.length - uploaded };
}

export interface RosterImportRow {
  paperNumber: string;
  title: string;
  author: string;
  contactEmail: string;
}

export interface RosterImportResult {
  created: number;
  updated: number;
}

/** Upsert roster rows for a year by (year, paper number). */
export async function upsertPresentationRoster(
  year: number,
  rows: RosterImportRow[],
): Promise<RosterImportResult> {
  if (rows.length === 0) return { created: 0, updated: 0 };

  const existing = await db
    .select({ paperNumber: presentationRoster.paperNumber })
    .from(presentationRoster)
    .where(eq(presentationRoster.year, year));
  const existingKeys = new Set(existing.map((r) => normalizePaperNumber(r.paperNumber)));

  let created = 0;
  let updated = 0;

  await db.transaction(async (tx) => {
    for (const row of rows) {
      const isUpdate = existingKeys.has(normalizePaperNumber(row.paperNumber));
      await tx
        .insert(presentationRoster)
        .values({
          year,
          paperNumber: row.paperNumber,
          title: row.title,
          author: row.author,
          contactEmail: row.contactEmail,
        })
        .onConflictDoUpdate({
          target: [presentationRoster.year, presentationRoster.paperNumber],
          set: {
            title: row.title,
            author: row.author,
            contactEmail: row.contactEmail,
            updatedAt: new Date(),
          },
        });
      if (isUpdate) updated++;
      else created++;
    }
  });

  return { created, updated };
}

export type { PresentationRosterRow };
