import { z } from "zod";

import {
  EXTENSIONS_BY_KIND,
  type FileKind,
  fileExtension,
  MAX_FILE_BYTES,
  MAX_FILE_MB_LABEL,
  MAX_MATERIAL_FILES,
  VIDEO_EXTENSIONS,
} from "./constants";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export interface PresentationValues {
  paperNumber: string;
  title: string;
  contactEmail: string;
  /** External video link (empty when none / when a video file is uploaded). */
  videoUrl: string;
}

export const EMPTY_VALUES: PresentationValues = {
  paperNumber: "",
  title: "",
  contactEmail: "",
  videoUrl: "",
};

export interface FileLike {
  name: string;
  size: number;
  type?: string;
}

/** The files chosen for a submission, split by category. */
export interface PresentationFileSelection {
  materials: FileLike[];
  video: FileLike | null;
}

const baseSchema = z.object({
  paperNumber: z.string(),
  title: z.string(),
  contactEmail: z.string(),
});

/**
 * Shared value schema for the text fields. Per-field issues are added in priority
 * order (required before format), so taking the first issue per field yields the
 * most relevant message — identical on the client and the server.
 */
export const presentationSchema = baseSchema.superRefine((v, ctx) => {
  const add = (path: keyof PresentationValues, message: string) =>
    ctx.addIssue({ code: "custom", path: [path], message });

  if (!v.paperNumber.trim()) add("paperNumber", "Paper number is required.");
  if (!v.title.trim()) add("title", "Title is required.");
  if (!v.contactEmail.trim()) add("contactEmail", "Contact email is required.");
  else if (!EMAIL_RE.test(v.contactEmail.trim()))
    add("contactEmail", "Enter a valid email address.");
});

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

export function getValueErrors(values: PresentationValues): Record<string, string> {
  const result = presentationSchema.safeParse(values);
  if (result.success) return {};
  return firstIssuePerPath(result.error.issues);
}

/** Validate one uploaded file against its category's size and extension rules. */
export function validateFileForKind(file: FileLike, kind: FileKind): string | undefined {
  if (file.size > MAX_FILE_BYTES) {
    return `${file.name} is ${formatFileSize(file.size)}. The maximum upload size is ${MAX_FILE_MB_LABEL}.`;
  }
  const allowed = EXTENSIONS_BY_KIND[kind];
  if (!(allowed as readonly string[]).includes(fileExtension(file.name))) {
    return `Unsupported file type for ${file.name}. Allowed: ${allowed.map((x) => x.toUpperCase()).join(", ")}.`;
  }
  return undefined;
}

/** Validate the material files: presence, count, then per-file rules. */
export function validateMaterials(files: FileLike[]): string | undefined {
  if (files.length === 0) return "At least one presentation material file is required.";
  if (files.length > MAX_MATERIAL_FILES) {
    return `You can upload at most ${MAX_MATERIAL_FILES} material files.`;
  }
  for (const file of files) {
    const error = validateFileForKind(file, "material");
    if (error) return error;
  }
  return undefined;
}

/** Validate an uploaded video file: size (with a link hint) then extension. */
export function validateVideoFile(file: FileLike | null | undefined): string | undefined {
  if (!file) return undefined;
  if (file.size > MAX_FILE_BYTES) {
    return `${file.name} is ${formatFileSize(file.size)}, larger than the ${MAX_FILE_MB_LABEL} upload limit. Please share a link to the video instead.`;
  }
  if (!(VIDEO_EXTENSIONS as readonly string[]).includes(fileExtension(file.name))) {
    return `Unsupported video type. Allowed: ${VIDEO_EXTENSIONS.map((x) => x.toUpperCase()).join(", ")}.`;
  }
  return undefined;
}

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** Validate the optional external video link (only when provided). */
export function validateVideoUrl(url: string): string | undefined {
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (!isHttpsUrl(trimmed)) return "Enter a valid link that starts with https://";
  return undefined;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Full validation used by both the client form and the server action. The video
 * is optional and must be EITHER an uploaded file OR an external link, never both.
 */
export function validatePresentation(
  values: PresentationValues,
  files: PresentationFileSelection,
): ValidationResult {
  const errors: Record<string, string> = { ...getValueErrors(values) };

  const materialsError = validateMaterials(files.materials);
  if (materialsError) errors.materials = materialsError;

  const hasVideoFile = Boolean(files.video);
  const hasVideoUrl = values.videoUrl.trim().length > 0;

  if (hasVideoFile && hasVideoUrl) {
    errors.video = "Provide either a video file or a link to your video, not both.";
  } else if (hasVideoFile) {
    const videoError = validateVideoFile(files.video);
    if (videoError) errors.video = videoError;
  } else if (hasVideoUrl) {
    const urlError = validateVideoUrl(values.videoUrl);
    if (urlError) errors.videoUrl = urlError;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
