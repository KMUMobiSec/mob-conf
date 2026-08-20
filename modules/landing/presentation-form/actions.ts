"use server";

import { VALID_YEARS, type ValidYear } from "@/constants/config";
import { db } from "@/db";
import { presentationFiles, presentations } from "@/db/schema";
import { sendPresentationConfirmation } from "@/lib/email/presentation-confirmation";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { storageService } from "@/lib/services/storage.server";
import type { FileKind } from "./lib/constants";
import {
  type FileLike,
  type PresentationFileSelection,
  type PresentationValues,
  validatePresentation,
} from "./lib/schema";
import {
  createUploadSessionPayload,
  getUploadSessionSecret,
  parseUploadSession,
  signUploadSession,
  type UploadSessionFile,
} from "./lib/upload-session";

const BUCKET = "presentations";

export interface SubmitPresentationResult {
  ok: boolean;
  /** Field-keyed validation errors (defensive; the client validates first). */
  errors?: Record<string, string>;
  /** A human-readable summary error for non-field failures. */
  message?: string;
}

export interface PresentationFileManifest {
  name: string;
  size: number;
  type?: string;
  kind: FileKind;
}

export interface PreparedPresentationUpload extends PresentationFileManifest {
  path: string;
  signedUrl: string;
}

export interface PreparePresentationUploadResult extends SubmitPresentationResult {
  uploadSession?: string;
  uploads?: PreparedPresentationUpload[];
}

function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  return cleaned.slice(-180) || "file";
}

function readValues(formData: FormData): PresentationValues {
  const str = (key: string) => String(formData.get(key) ?? "");
  return {
    paperNumber: str("paper_number"),
    title: str("title"),
    contactEmail: str("contact_email"),
    videoUrl: str("video_url"),
  };
}

function readManifests(formData: FormData): PresentationFileManifest[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(formData.get("file_manifest") ?? "null"));
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const manifests: PresentationFileManifest[] = [];
  for (const entry of parsed) {
    if (!isFileManifest(entry)) return null;
    manifests.push(entry);
  }
  return manifests;
}

function isFileManifest(value: unknown): value is PresentationFileManifest {
  if (!value || typeof value !== "object") return false;
  const entry = value as PresentationFileManifest;
  return (
    typeof entry.name === "string" &&
    entry.name.length > 0 &&
    typeof entry.size === "number" &&
    Number.isFinite(entry.size) &&
    entry.size > 0 &&
    (entry.type === undefined || typeof entry.type === "string") &&
    (entry.kind === "material" || entry.kind === "video")
  );
}

function toFileLike(entry: { name: string; size: number; type?: string }): FileLike {
  return { name: entry.name, size: entry.size, type: entry.type };
}

/** Split a flat file list (manifests or session files) into the validation shape. */
function toSelection<T extends { kind: FileKind; name: string; size: number; type?: string }>(
  files: T[],
): PresentationFileSelection {
  const materials = files.filter((f) => f.kind === "material").map(toFileLike);
  const videoEntry = files.find((f) => f.kind === "video");
  return { materials, video: videoEntry ? toFileLike(videoEntry) : null };
}

function buildStoragePath(
  year: ValidYear,
  presentationId: string,
  manifest: PresentationFileManifest,
  materialIndex: number,
): string {
  const safe = sanitizeFileName(manifest.name);
  return manifest.kind === "video"
    ? `${year}/${presentationId}/video/${safe}`
    : `${year}/${presentationId}/materials/${materialIndex}-${safe}`;
}

export async function preparePresentationUpload(
  formData: FormData,
): Promise<PreparePresentationUploadResult> {
  // 1. Honeypot — silently reject obvious bots.
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { ok: false, message: "Your submission could not be processed." };
  }

  // 2. CAPTCHA — verify before any upload/DB/email work.
  const captchaOk = await verifyTurnstile(String(formData.get("cf-turnstile-response") ?? ""));
  if (!captchaOk) {
    return { ok: false, message: "CAPTCHA verification failed. Please try again." };
  }

  // 3. Year from the route.
  const year = Number(formData.get("year"));
  if (!VALID_YEARS.includes(year as ValidYear)) {
    return { ok: false, message: "This presentation form is not available for the selected year." };
  }

  const values = readValues(formData);
  const manifests = readManifests(formData);
  if (!manifests) {
    return {
      ok: false,
      errors: { materials: "At least one presentation material file is required." },
      message: "Please correct the highlighted fields and try again.",
    };
  }

  // At most one video file may be uploaded.
  if (manifests.filter((m) => m.kind === "video").length > 1) {
    return { ok: false, message: "Only one presentation video can be uploaded." };
  }

  // 4. Re-validate fields + file metadata before issuing signed URLs.
  const { valid, errors } = validatePresentation(values, toSelection(manifests));
  if (!valid) {
    return { ok: false, errors, message: "Please correct the highlighted fields and try again." };
  }

  // 5. Prepare a signed URL for each file's browser-to-storage upload.
  const presentationId = crypto.randomUUID();
  let materialIndex = 0;
  const plan = manifests.map((manifest) => {
    const path = buildStoragePath(
      year as ValidYear,
      presentationId,
      manifest,
      manifest.kind === "material" ? materialIndex++ : 0,
    );
    return { manifest, path };
  });

  let uploads: PreparedPresentationUpload[];
  try {
    uploads = await Promise.all(
      plan.map(async ({ manifest, path }) => {
        const { signedUrl } = await storageService.createSignedUploadUrl({
          bucket: BUCKET,
          path,
          options: { upsert: false },
        });
        return { ...manifest, path, signedUrl };
      }),
    );
  } catch (error) {
    console.error("Presentation signed upload preparation failed", error);
    return {
      ok: false,
      message:
        "We couldn't prepare a secure upload link for your files. Please try again in a moment.",
    };
  }

  const sessionFiles: UploadSessionFile[] = uploads.map((u) => ({
    path: u.path,
    name: u.name,
    size: u.size,
    type: u.type,
    kind: u.kind,
  }));
  const uploadSession = signUploadSession(
    createUploadSessionPayload({ presentationId, year: year as ValidYear, files: sessionFiles }),
    getUploadSessionSecret(),
  );

  return { ok: true, uploadSession, uploads };
}

export async function submitPresentation(formData: FormData): Promise<SubmitPresentationResult> {
  // 1. Honeypot — silently reject obvious bots.
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { ok: false, message: "Your submission could not be processed." };
  }

  // 2. Year from the route.
  const year = Number(formData.get("year"));
  if (!VALID_YEARS.includes(year as ValidYear)) {
    return { ok: false, message: "This presentation form is not available for the selected year." };
  }

  const uploadSession = parseUploadSession(
    String(formData.get("upload_session") ?? ""),
    getUploadSessionSecret(),
  );
  if (!uploadSession || uploadSession.year !== year) {
    return {
      ok: false,
      message:
        "Your secure upload session expired or could not be verified. Please choose your files again and resubmit.",
    };
  }

  const allPaths = uploadSession.files.map((f) => f.path);
  const values = readValues(formData);

  // 3. Re-validate using the server-approved upload metadata + submitted video link.
  const { valid, errors } = validatePresentation(values, toSelection(uploadSession.files));
  if (!valid) {
    await cleanupUpload(allPaths);
    return { ok: false, errors, message: "Please correct the highlighted fields and try again." };
  }

  const videoUrl = values.videoUrl.trim() || null;
  const materialSortIndex = new Map<UploadSessionFile, number>();
  let nextMaterialOrder = 0;
  for (const file of uploadSession.files) {
    materialSortIndex.set(file, file.kind === "material" ? nextMaterialOrder++ : 0);
  }

  // 4. Persist the submission (row + file rows + optional video link) atomically.
  try {
    await db.transaction(async (tx) => {
      await tx.insert(presentations).values({
        id: uploadSession.presentationId,
        year,
        paperNumber: values.paperNumber.trim(),
        title: values.title.trim(),
        contactEmail: values.contactEmail.trim(),
        videoUrl,
      });
      await tx.insert(presentationFiles).values(
        uploadSession.files.map((file) => ({
          presentationId: uploadSession.presentationId,
          kind: file.kind,
          fileName: file.name,
          filePath: file.path,
          fileSize: file.size,
          contentType: file.type ?? null,
          sortOrder: materialSortIndex.get(file) ?? 0,
        })),
      );
    });
  } catch (error) {
    console.error("Presentation persistence failed", error);
    await cleanupUpload(allPaths);
    return { ok: false, message: "We couldn't save your submission. Please try again." };
  }

  // 5. Confirmation email (non-fatal).
  try {
    const selection = toSelection(uploadSession.files);
    await sendPresentationConfirmation({
      to: values.contactEmail.trim(),
      year,
      paperNumber: values.paperNumber.trim(),
      title: values.title.trim(),
      materialFileNames: selection.materials.map((f) => f.name),
      videoFileName: selection.video?.name ?? null,
      videoUrl,
    });
  } catch (error) {
    console.error("Presentation confirmation email failed", error);
  }

  return { ok: true };
}

export async function discardPresentationUpload(uploadSessionToken: string): Promise<void> {
  const uploadSession = parseUploadSession(uploadSessionToken, getUploadSessionSecret());
  if (!uploadSession) return;
  await cleanupUpload(uploadSession.files.map((f) => f.path));
}

async function cleanupUpload(paths: string[]): Promise<void> {
  if (!paths.length) return;
  try {
    await storageService.deleteFiles({ bucket: BUCKET, paths });
  } catch (error) {
    console.error("Failed to clean up uploaded presentation files", error);
  }
}
