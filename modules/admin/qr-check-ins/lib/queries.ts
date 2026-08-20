import "server-only";

import { and, count, desc, eq, ilike, inArray, isNotNull, isNull, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { registrations } from "@/db/schema";

export type RegistrationRow = typeof registrations.$inferSelect;

const DEFAULT_PAGE_SIZE = 20;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface RegistrationListFilters {
  year: number;
  q?: string;
  checkedIn?: boolean;
  page?: number;
  pageSize?: number;
}

export interface RegistrationListResult {
  rows: RegistrationRow[];
  total: number;
  checkedInTotal: number;
  page: number;
  pageSize: number;
}

export async function listRegistrations(
  filters: RegistrationListFilters,
): Promise<RegistrationListResult> {
  const conditions: SQL[] = [eq(registrations.year, filters.year)];
  if (typeof filters.checkedIn === "boolean") {
    conditions.push(
      filters.checkedIn ? isNotNull(registrations.checkedInAt) : isNull(registrations.checkedInAt),
    );
  }

  const query = filters.q?.trim();
  if (query) {
    const like = `%${query}%`;
    const search = or(
      ilike(registrations.name, like),
      ilike(registrations.email, like),
      ilike(registrations.affiliation, like),
    );
    if (search) conditions.push(search);
  }

  const whereClause = and(...conditions);
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

  const [{ total }] = await db.select({ total: count() }).from(registrations).where(whereClause);
  const [{ checkedInTotal }] = await db
    .select({ checkedInTotal: count() })
    .from(registrations)
    .where(and(...conditions, isNotNull(registrations.checkedInAt)));

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, filters.page ?? 1), totalPages);

  const rows = await db
    .select()
    .from(registrations)
    .where(whereClause)
    .orderBy(desc(registrations.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { rows, total, checkedInTotal, page, pageSize };
}

export interface CheckInLogRow {
  id: string;
  idNumber: number | null;
  name: string;
  affiliation: string | null;
  checkedInAt: Date;
  checkedInBy: string | null;
}

export interface CheckInLogResult {
  rows: CheckInLogRow[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_LOG_PAGE_SIZE = 50;

/**
 * The check-in log for a year: every checked-in registration, most recent first. Backs the
 * realtime Logs tab, which re-runs this on each `checked-in` broadcast so new arrivals surface at
 * the top (and undone check-ins drop out).
 */
export async function listCheckInLogs(filters: {
  year: number;
  page?: number;
  pageSize?: number;
}): Promise<CheckInLogResult> {
  const whereClause = and(
    eq(registrations.year, filters.year),
    isNotNull(registrations.checkedInAt),
  );
  const pageSize = filters.pageSize ?? DEFAULT_LOG_PAGE_SIZE;

  const [{ total }] = await db.select({ total: count() }).from(registrations).where(whereClause);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, filters.page ?? 1), totalPages);

  const rows = await db
    .select({
      id: registrations.id,
      idNumber: registrations.idNumber,
      name: registrations.name,
      affiliation: registrations.affiliation,
      checkedInAt: registrations.checkedInAt,
      checkedInBy: registrations.checkedInBy,
    })
    .from(registrations)
    .where(whereClause)
    .orderBy(desc(registrations.checkedInAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  // checkedInAt is guaranteed non-null by the where clause; narrow the select's nullable type.
  return {
    rows: rows.map((row) => ({ ...row, checkedInAt: row.checkedInAt as Date })),
    total,
    page,
    pageSize,
  };
}

export async function getRegistration(id: string): Promise<RegistrationRow | null> {
  if (!UUID_RE.test(id)) return null;
  const [row] = await db.select().from(registrations).where(eq(registrations.id, id)).limit(1);
  return row ?? null;
}

export async function getRegistrationByEmail(
  year: number,
  email: string,
): Promise<RegistrationRow | null> {
  const [row] = await db
    .select()
    .from(registrations)
    .where(and(eq(registrations.year, year), eq(registrations.email, email)))
    .limit(1);
  return row ?? null;
}

export async function getRegistrationByQrParts(
  id: string,
  qrNonce: string,
): Promise<RegistrationRow | null> {
  if (!UUID_RE.test(id)) return null;
  const [row] = await db
    .select()
    .from(registrations)
    .where(and(eq(registrations.id, id), eq(registrations.qrNonce, qrNonce)))
    .limit(1);
  return row ?? null;
}

export async function listRegistrationsByEmails(
  year: number,
  emails: string[],
): Promise<RegistrationRow[]> {
  // Null-email registrations are never matched here — only real addresses are looked up.
  const valid = emails.filter((email) => email.length > 0);
  if (valid.length === 0) return [];
  return db
    .select()
    .from(registrations)
    .where(and(eq(registrations.year, year), inArray(registrations.email, valid)));
}

/**
 * Every registration ID for a year, newest first (matching the table's default order). Backs the
 * bulk "Send to all" flow, which sends to the whole year regardless of the active search/filter.
 */
export async function listRegistrationIdsForYear(year: number): Promise<string[]> {
  const rows = await db
    .select({ id: registrations.id })
    .from(registrations)
    .where(eq(registrations.year, year))
    .orderBy(desc(registrations.createdAt));
  return rows.map((row) => row.id);
}

export async function listRegistrationsByIds(
  year: number,
  ids: string[],
): Promise<RegistrationRow[]> {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(registrations)
    .where(and(eq(registrations.year, year), inArray(registrations.id, ids)));
}
