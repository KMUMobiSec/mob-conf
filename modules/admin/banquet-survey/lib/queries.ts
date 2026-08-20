import "server-only";

import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { type BanquetResponse, banquetResponses, registrations } from "@/db/schema";
import { personDedupeKey } from "@/modules/admin/lib/person-identity";
import { type BanquetStatusParam, PAGE_SIZE } from "./filters";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface BanquetListFilters {
  year: number;
  q?: string;
  status?: BanquetStatusParam;
  page?: number;
  pageSize?: number;
}

/** Translate a status filter into a where-condition, or null for "all". */
function statusCondition(status: BanquetStatusParam | undefined): SQL | null {
  switch (status) {
    case "invited":
      return isNull(banquetResponses.respondedAt);
    case "attending":
      return (
        and(isNotNull(banquetResponses.respondedAt), eq(banquetResponses.attending, true)) ?? null
      );
    case "not_attending":
      return (
        and(isNotNull(banquetResponses.respondedAt), eq(banquetResponses.attending, false)) ?? null
      );
    default:
      return null;
  }
}

export interface BanquetListResult {
  rows: BanquetResponse[];
  total: number;
}

export async function listBanquetResponses(
  filters: BanquetListFilters,
): Promise<BanquetListResult> {
  const conditions: SQL[] = [eq(banquetResponses.year, filters.year)];
  const status = statusCondition(filters.status);
  if (status) conditions.push(status);

  const query = filters.q?.trim();
  if (query) {
    const like = `%${query}%`;
    const search = or(
      ilike(banquetResponses.name, like),
      ilike(banquetResponses.email, like),
      ilike(banquetResponses.affiliation, like),
    );
    if (search) conditions.push(search);
  }

  const whereClause = and(...conditions);
  const pageSize = filters.pageSize ?? PAGE_SIZE;

  const [{ total }] = await db.select({ total: count() }).from(banquetResponses).where(whereClause);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, filters.page ?? 1), totalPages);

  const rows = await db
    .select()
    .from(banquetResponses)
    .where(whereClause)
    .orderBy(desc(banquetResponses.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { rows, total };
}

export interface BanquetStats {
  /** All banquet rows for the year (invited + responded). */
  total: number;
  /** Rows with a submitted response (respondedAt not null). */
  responded: number;
  /** Responded and attending — the banquet headcount. */
  attending: number;
  /** Responded and not attending. */
  notAttending: number;
  /** Invited but not yet responded. */
  awaiting: number;
  /** Attendees who listed allergens or a dietary note. */
  dietaryNeeds: number;
  /** Responded / total, as a whole-number percent (0 when there are no invitees). */
  responseRate: number;
}

/**
 * Whole-year aggregate counts for the statistics cards. Keyed on the year only — never the
 * search/status filters — so the cards stay a stable overview independent of the table view.
 */
export async function getBanquetStats(year: number): Promise<BanquetStats> {
  const responded = sql`(${banquetResponses.respondedAt} is not null)`;
  const [row] = await db
    .select({
      total: count(),
      responded: sql<number>`count(*) filter (where ${responded})`,
      attending: sql<number>`count(*) filter (where ${responded} and ${banquetResponses.attending})`,
      notAttending: sql<number>`count(*) filter (where ${responded} and not ${banquetResponses.attending})`,
      awaiting: sql<number>`count(*) filter (where ${banquetResponses.respondedAt} is null)`,
      dietaryNeeds: sql<number>`count(*) filter (where ${responded} and ${banquetResponses.attending} and (jsonb_array_length(${banquetResponses.allergens}) > 0 or ${banquetResponses.allergenOther} is not null))`,
    })
    .from(banquetResponses)
    .where(eq(banquetResponses.year, year));

  const total = Number(row?.total ?? 0);
  const respondedCount = Number(row?.responded ?? 0);
  return {
    total,
    responded: respondedCount,
    attending: Number(row?.attending ?? 0),
    notAttending: Number(row?.notAttending ?? 0),
    awaiting: Number(row?.awaiting ?? 0),
    dietaryNeeds: Number(row?.dietaryNeeds ?? 0),
    responseRate: total === 0 ? 0 : Math.round((respondedCount / total) * 100),
  };
}

export async function getBanquetResponse(id: string): Promise<BanquetResponse | null> {
  if (!UUID_RE.test(id)) return null;
  const [row] = await db
    .select()
    .from(banquetResponses)
    .where(eq(banquetResponses.id, id))
    .limit(1);
  return row ?? null;
}

export async function listBanquetResponsesByIds(
  year: number,
  ids: string[],
): Promise<BanquetResponse[]> {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(banquetResponses)
    .where(and(eq(banquetResponses.year, year), inArray(banquetResponses.id, ids)));
}

export async function listAllBanquetResponses(year: number): Promise<BanquetResponse[]> {
  return db
    .select()
    .from(banquetResponses)
    .where(eq(banquetResponses.year, year))
    .orderBy(desc(banquetResponses.createdAt));
}

/** Ids of invited rows (imported, not yet responded) for "send invitation to all invited". */
export async function listInvitedBanquetResponseIds(year: number): Promise<string[]> {
  const rows = await db
    .select({ id: banquetResponses.id })
    .from(banquetResponses)
    .where(and(eq(banquetResponses.year, year), isNull(banquetResponses.respondedAt)));
  return rows.map((row) => row.id);
}

/** Ids of responded rows for "send confirmation to all responded". */
export async function listRespondedBanquetResponseIds(year: number): Promise<string[]> {
  const rows = await db
    .select({ id: banquetResponses.id })
    .from(banquetResponses)
    .where(and(eq(banquetResponses.year, year), isNotNull(banquetResponses.respondedAt)));
  return rows.map((row) => row.id);
}

export interface RegistrationInvitee {
  email: string;
  name: string;
  affiliation: string | null;
}

/** Registrations for the year that have an email, as import candidates. */
export async function listRegistrationInvitees(year: number): Promise<RegistrationInvitee[]> {
  const rows = await db
    .select({
      email: registrations.email,
      name: registrations.name,
      affiliation: registrations.affiliation,
    })
    .from(registrations)
    .where(and(eq(registrations.year, year), isNotNull(registrations.email)));
  return rows
    .filter((row): row is RegistrationInvitee => row.email !== null)
    .map((row) => ({ ...row, email: row.email.trim().toLowerCase() }));
}

/** Total registrations for the year (any email state), for accurate skip reporting. */
export async function countRegistrationsForYear(year: number): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(registrations)
    .where(eq(registrations.year, year));
  return row?.total ?? 0;
}

/** Identity keys (email + name) already present in the banquet responses for the year, for dedupe. */
export async function listBanquetResponseKeys(year: number): Promise<Set<string>> {
  const rows = await db
    .select({ email: banquetResponses.email, name: banquetResponses.name })
    .from(banquetResponses)
    .where(eq(banquetResponses.year, year));
  return new Set(rows.map((row) => personDedupeKey(row.email, row.name)));
}
