import type { NominationDocuments } from "@/db/schema";

/**
 * Whether `path` belongs to one of the stored documents. Used to ensure the
 * admin signed-URL action only ever signs paths from real nomination records.
 */
export function isKnownDocumentPath(
  documents: NominationDocuments | null | undefined,
  path: string,
): boolean {
  if (!documents || !path) return false;
  return Object.values(documents)
    .flat()
    .some((doc) => doc.path === path);
}

/** Every stored storage path for a nomination's documents (used when deleting). */
export function collectDocumentPaths(documents: NominationDocuments | null | undefined): string[] {
  if (!documents) return [];
  return Object.values(documents)
    .flat()
    .map((doc) => doc.path);
}
