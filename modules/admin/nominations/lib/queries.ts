import "server-only";

import { and, count, desc, eq, ilike, isNull, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { nominations } from "@/db/schema";

export type NominationRow = typeof nominations.$inferSelect;

const DEFAULT_PAGE_SIZE = 20;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface NominationListFilters {
  year?: number;
  award?: string;
  winner?: boolean;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface NominationListResult {
  rows: NominationRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listNominations(
  filters: NominationListFilters,
): Promise<NominationListResult> {
  const conditions: SQL[] = [];
  if (filters.year) conditions.push(eq(nominations.year, filters.year));
  if (filters.award) conditions.push(eq(nominations.award, filters.award));
  if (filters.winner) conditions.push(eq(nominations.isWinner, true));

  const query = filters.q?.trim();
  if (query) {
    const like = `%${query}%`;
    const search = or(
      ilike(nominations.nomineeName, like),
      ilike(nominations.nomineeEmail, like),
      ilike(nominations.nominatorName, like),
      ilike(nominations.nominatorEmail, like),
    );
    if (search) conditions.push(search);
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

  const [{ total }] = await db.select({ total: count() }).from(nominations).where(whereClause);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, filters.page ?? 1), totalPages);

  const rows = await db
    .select()
    .from(nominations)
    .where(whereClause)
    .orderBy(desc(nominations.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { rows, total, page, pageSize };
}

export async function getNomination(id: string): Promise<NominationRow | null> {
  if (!UUID_RE.test(id)) return null;
  const [row] = await db.select().from(nominations).where(eq(nominations.id, id)).limit(1);
  return row ?? null;
}

/** Winners that have not yet been notified, optionally scoped to a year. */
export async function listPendingWinners(year?: number): Promise<NominationRow[]> {
  const conditions: SQL[] = [eq(nominations.isWinner, true), isNull(nominations.winnerNotifiedAt)];
  if (year) conditions.push(eq(nominations.year, year));
  return db
    .select()
    .from(nominations)
    .where(and(...conditions))
    .orderBy(desc(nominations.createdAt));
}
