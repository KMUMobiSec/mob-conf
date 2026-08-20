"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { presentationFiles, presentations } from "@/db/schema";
import { getCurrentAdminSession } from "@/lib/auth/session";
import { storageService } from "@/lib/services/storage.server";
import { getPresentation } from "./lib/queries";

const BUCKET = "presentations";
const SIGNED_URL_TTL_SECONDS = 300;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface AdminActionResult {
  ok: boolean;
  error?: string;
  url?: string;
}

export async function setPresentationReviewed(
  id: string,
  isReviewed: boolean,
): Promise<AdminActionResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };

  try {
    await db
      .update(presentations)
      .set({ isReviewed, reviewedAt: isReviewed ? new Date() : null, updatedAt: new Date() })
      .where(eq(presentations.id, id));
  } catch (error) {
    console.error("Failed to update reviewed status", error);
    return { ok: false, error: "Could not update the reviewed status." };
  }

  revalidatePath("/admin/presentations");
  revalidatePath(`/admin/presentations/${id}`);
  return { ok: true };
}

export interface UpdatePresentationInput {
  paperNumber: string;
  title: string;
  contactEmail: string;
  /** External video link; ignored when the submission has an uploaded video. */
  videoUrl: string;
}

export interface UpdatePresentationResult {
  ok: boolean;
  error?: string;
  errors?: Record<string, string>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Edit a submission's text details (paper number, title, contact email, video
 * link). Does not touch uploaded files. The video link is ignored when an
 * uploaded video exists, preserving the upload-XOR-link invariant.
 */
export async function updatePresentation(
  id: string,
  input: UpdatePresentationInput,
): Promise<UpdatePresentationResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };

  const paperNumber = input.paperNumber.trim();
  const title = input.title.trim();
  const contactEmail = input.contactEmail.trim();
  const videoUrl = input.videoUrl.trim();

  const errors: Record<string, string> = {};
  if (!paperNumber) errors.paperNumber = "Paper number is required.";
  if (!title) errors.title = "Title is required.";
  if (!contactEmail) errors.contactEmail = "Contact email is required.";
  else if (!EMAIL_RE.test(contactEmail)) errors.contactEmail = "Enter a valid email address.";
  if (videoUrl && !isHttpsUrl(videoUrl))
    errors.videoUrl = "Enter a valid link that starts with https://";
  if (Object.keys(errors).length) {
    return { ok: false, errors, error: "Please correct the highlighted fields." };
  }

  const detail = await getPresentation(id);
  if (!detail) return { ok: false, error: "Presentation not found." };
  // If a video file was uploaded, the link is not applicable.
  const nextVideoUrl = detail.video ? null : videoUrl || null;

  try {
    await db
      .update(presentations)
      .set({ paperNumber, title, contactEmail, videoUrl: nextVideoUrl, updatedAt: new Date() })
      .where(eq(presentations.id, id));
  } catch (error) {
    console.error(`Failed to update presentation ${id}`, error);
    return { ok: false, error: "Could not save changes. Please try again." };
  }

  revalidatePath("/admin/presentations");
  revalidatePath(`/admin/presentations/${id}`);
  return { ok: true };
}

export async function getPresentationFileSignedUrl(fileId: string): Promise<AdminActionResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };
  if (!UUID_RE.test(fileId)) return { ok: false, error: "File not found." };

  // The path is read from the file record, so there is nothing for a caller to forge.
  const [file] = await db
    .select()
    .from(presentationFiles)
    .where(eq(presentationFiles.id, fileId))
    .limit(1);
  if (!file) return { ok: false, error: "File not found." };

  try {
    const { signedUrl } = await storageService.createSignedUrl({
      bucket: BUCKET,
      path: file.filePath,
      expiresIn: SIGNED_URL_TTL_SECONDS,
      options: { download: file.fileName },
    });
    return { ok: true, url: signedUrl };
  } catch (error) {
    console.error("Failed to create signed URL", error);
    return { ok: false, error: "Could not generate a download link." };
  }
}

/**
 * Permanently delete a presentation submission and all its uploaded files. The
 * files are removed first (best-effort); the record is then deleted, which
 * cascades to the `presentation_files` rows.
 */
export async function deletePresentation(id: string): Promise<AdminActionResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };

  const detail = await getPresentation(id);
  if (!detail) return { ok: false, error: "Presentation not found." };

  const paths = [...detail.materials, ...(detail.video ? [detail.video] : [])].map(
    (f) => f.filePath,
  );

  if (paths.length) {
    try {
      await storageService.deleteFiles({ bucket: BUCKET, paths });
    } catch (error) {
      // Don't strand an undeletable record — log and still remove the row.
      console.error(`Failed to delete files for presentation ${id}`, error);
    }
  }

  try {
    await db.delete(presentations).where(eq(presentations.id, id));
  } catch (error) {
    console.error(`Failed to delete presentation ${id}`, error);
    return { ok: false, error: "Could not delete the presentation." };
  }

  revalidatePath("/admin/presentations");
  return { ok: true };
}
