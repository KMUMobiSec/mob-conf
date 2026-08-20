/**
 * Shared limits and file rules for the presentation upload form. Imported by both
 * the client form and the server action so validation is identical on both sides.
 */

/** File category within a submission. */
export type FileKind = "material" | "video";

/** Per-file upload size cap (50 MB) — the storage bucket's hard limit. */
export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_FILE_MB = MAX_FILE_BYTES / (1024 * 1024);
export const MAX_FILE_MB_LABEL = `${MAX_FILE_MB} MB`;

/** Presentation materials (slides/docs). */
export const MATERIAL_EXTENSIONS = ["pdf", "ppt", "pptx"] as const;
export const MATERIAL_ACCEPT = ".pdf,.ppt,.pptx";
/** Maximum number of material files per submission. */
export const MAX_MATERIAL_FILES = 5;

/** Presentation video (an uploaded recording; ≤ 50 MB — larger videos use a link). */
export const VIDEO_EXTENSIONS = ["mp4", "mov", "webm"] as const;
export const VIDEO_ACCEPT = ".mp4,.mov,.webm";

/** Allowed upload extensions by kind. */
export const EXTENSIONS_BY_KIND: Record<FileKind, readonly string[]> = {
  material: MATERIAL_EXTENSIONS,
  video: VIDEO_EXTENSIONS,
};

export function fileExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}
