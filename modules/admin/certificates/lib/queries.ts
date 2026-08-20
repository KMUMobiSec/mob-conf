import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { presentations, registrations } from "@/db/schema";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CertificateRecipient {
  id: string;
  name: string;
  email: string | null;
  affiliation: string | null;
  /** True when this registrant is the contact author of at least one submitted paper. */
  isAuthor: boolean;
  /** Titles of papers this registrant is the contact author of (0..n). */
  paperTitles: string[];
  certificateEmailSentAt: Date | null;
}

/**
 * Map a year's paper titles onto registrations by matching the registrant's email to a
 * presentation's contact email (case-insensitive). This is a contact-author link, not a full
 * co-author list — `presentations` only records the designated contact per paper.
 */
async function paperTitlesByEmail(year: number): Promise<Map<string, string[]>> {
  const rows = await db
    .select({ contactEmail: presentations.contactEmail, title: presentations.title })
    .from(presentations)
    .where(eq(presentations.year, year));

  const byEmail = new Map<string, string[]>();
  for (const row of rows) {
    const key = row.contactEmail.trim().toLowerCase();
    if (!key) continue;
    const list = byEmail.get(key) ?? [];
    // Dedupe identical titles: a repeated title (e.g. a resubmission) is one paper for certificate
    // purposes, and identical entries would otherwise collide as React keys / Select values.
    if (!list.includes(row.title)) list.push(row.title);
    byEmail.set(key, list);
  }
  return byEmail;
}

/** Every registration for a year, ordered by name, annotated with author status + paper titles. */
export async function listCertificateRecipients(year: number): Promise<CertificateRecipient[]> {
  const [rows, titlesByEmail] = await Promise.all([
    db
      .select({
        id: registrations.id,
        name: registrations.name,
        email: registrations.email,
        affiliation: registrations.affiliation,
        certificateEmailSentAt: registrations.certificateEmailSentAt,
      })
      .from(registrations)
      .where(eq(registrations.year, year))
      .orderBy(asc(registrations.name)),
    paperTitlesByEmail(year),
  ]);

  return rows.map((row) => {
    const paperTitles = row.email ? (titlesByEmail.get(row.email.trim().toLowerCase()) ?? []) : [];
    return { ...row, isAuthor: paperTitles.length > 0, paperTitles };
  });
}

/** A single recipient (for the send action) resolved and annotated the same way as the list. */
export async function getCertificateRecipient(
  year: number,
  id: string,
): Promise<CertificateRecipient | null> {
  if (!UUID_RE.test(id)) return null;
  const [row] = await db
    .select({
      id: registrations.id,
      name: registrations.name,
      email: registrations.email,
      affiliation: registrations.affiliation,
      certificateEmailSentAt: registrations.certificateEmailSentAt,
    })
    .from(registrations)
    .where(and(eq(registrations.year, year), eq(registrations.id, id)))
    .limit(1);
  if (!row) return null;

  const titlesByEmail = await paperTitlesByEmail(year);
  const paperTitles = row.email ? (titlesByEmail.get(row.email.trim().toLowerCase()) ?? []) : [];
  return { ...row, isAuthor: paperTitles.length > 0, paperTitles };
}

/** Record that a certificate was emailed to this registrant (bumps the send counter). */
export async function markCertificateEmailed(id: string): Promise<void> {
  await db
    .update(registrations)
    .set({
      certificateEmailSentAt: new Date(),
      certificateEmailSentCount: sql`${registrations.certificateEmailSentCount} + 1`,
    })
    .where(eq(registrations.id, id));
}
