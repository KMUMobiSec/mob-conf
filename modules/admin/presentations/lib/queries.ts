import "server-only";

import { and, asc, count, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { type PresentationFile, presentationFiles, presentations } from "@/db/schema";

export type PresentationRow = typeof presentations.$inferSelect;

/** A list row enriched with file counts for the admin table. */
export interface PresentationListRow extends PresentationRow {
  materialCount: number;
  hasVideo: boolean;
}

/** A submission with its files split by category, for the detail page. */
export interface PresentationDetail {
  presentation: PresentationRow;
  materials: PresentationFile[];
  video: PresentationFile | null;
}

const DEFAULT_PAGE_SIZE = 20;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PresentationListFilters {
  year?: number;
  reviewed?: boolean;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface PresentationListResult {
  rows: PresentationListRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listPresentations(
  filters: PresentationListFilters,
): Promise<PresentationListResult> {
  const conditions: SQL[] = [];
  if (filters.year) conditions.push(eq(presentations.year, filters.year));
  if (filters.reviewed !== undefined) {
    conditions.push(eq(presentations.isReviewed, filters.reviewed));
  }

  const query = filters.q?.trim();
  if (query) {
    const like = `%${query}%`;
    const search = or(
      ilike(presentations.paperNumber, like),
      ilike(presentations.title, like),
      ilike(presentations.contactEmail, like),
    );
    if (search) conditions.push(search);
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

  const [{ total }] = await db.select({ total: count() }).from(presentations).where(whereClause);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, filters.page ?? 1), totalPages);

  const pageRows = await db
    .select()
    .from(presentations)
    .where(whereClause)
    .orderBy(desc(presentations.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const rows = await enrichWithFileCounts(pageRows);
  return { rows, total, page, pageSize };
}

async function enrichWithFileCounts(pageRows: PresentationRow[]): Promise<PresentationListRow[]> {
  const ids = pageRows.map((r) => r.id);
  const materialCounts = new Map<string, number>();
  const videoIds = new Set<string>();

  if (ids.length) {
    const fileRows = await db
      .select({
        presentationId: presentationFiles.presentationId,
        kind: presentationFiles.kind,
      })
      .from(presentationFiles)
      .where(inArray(presentationFiles.presentationId, ids));

    for (const file of fileRows) {
      if (file.kind === "video") videoIds.add(file.presentationId);
      else
        materialCounts.set(file.presentationId, (materialCounts.get(file.presentationId) ?? 0) + 1);
    }
  }

  return pageRows.map((row) => ({
    ...row,
    materialCount: materialCounts.get(row.id) ?? 0,
    hasVideo: videoIds.has(row.id) || Boolean(row.videoUrl),
  }));
}

/** A submission reduced to what the Program view needs to match + link files. */
export interface MatchablePresentation {
  id: string;
  title: string;
  videoUrl: string | null;
  materials: PresentationFile[];
  video: PresentationFile | null;
}

/** Load a year's submissions with their files, for fuzzy-matching to program talks. */
export async function listPresentationsForMatching(year: number): Promise<MatchablePresentation[]> {
  const rows = await db
    .select({ id: presentations.id, title: presentations.title, videoUrl: presentations.videoUrl })
    .from(presentations)
    .where(eq(presentations.year, year));
  if (rows.length === 0) return [];

  const files = await db
    .select()
    .from(presentationFiles)
    .where(
      inArray(
        presentationFiles.presentationId,
        rows.map((r) => r.id),
      ),
    )
    .orderBy(asc(presentationFiles.sortOrder));

  const byPresentation = new Map<string, PresentationFile[]>();
  for (const file of files) {
    const list = byPresentation.get(file.presentationId) ?? [];
    list.push(file);
    byPresentation.set(file.presentationId, list);
  }

  return rows.map((row) => {
    const owned = byPresentation.get(row.id) ?? [];
    return {
      id: row.id,
      title: row.title,
      videoUrl: row.videoUrl,
      materials: owned.filter((f) => f.kind === "material"),
      video: owned.find((f) => f.kind === "video") ?? null,
    };
  });
}

export async function getPresentation(id: string): Promise<PresentationDetail | null> {
  if (!UUID_RE.test(id)) return null;
  const [presentation] = await db
    .select()
    .from(presentations)
    .where(eq(presentations.id, id))
    .limit(1);
  if (!presentation) return null;

  const files = await db
    .select()
    .from(presentationFiles)
    .where(eq(presentationFiles.presentationId, id))
    .orderBy(asc(presentationFiles.kind), asc(presentationFiles.sortOrder));

  const materials = files.filter((f) => f.kind === "material");
  const video = files.find((f) => f.kind === "video") ?? null;
  return { presentation, materials, video };
}
