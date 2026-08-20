"use server";

import { VALID_YEARS, type ValidYear } from "@/constants/config";
import { db } from "@/db";
import { type NominationDocuments, nominations } from "@/db/schema";
import { sendNominationConfirmation } from "@/lib/email/nomination-confirmation";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { storageService } from "@/lib/services/storage.server";
import { DOC_FIELD_KEYS, type DocFieldKey, getAward, isAwardId } from "./lib/constants";
import { countPdfPages } from "./lib/pdf-pages";
import {
  type FileLike,
  type FilesByKey,
  type NominationValues,
  validateNomination,
} from "./lib/schema";
import {
  createUploadSessionPayload,
  getUploadSessionSecret,
  parseUploadSession,
  signUploadSession,
  type UploadSessionFile,
} from "./lib/upload-session";

const BUCKET = "nominations";

export interface SubmitNominationResult {
  ok: boolean;
  /** Field-keyed validation errors (defensive; the client validates first). */
  errors?: Record<string, string>;
  /** A human-readable summary error for non-field failures. */
  message?: string;
}

export interface NominationFileManifestEntry {
  key: DocFieldKey;
  index: number;
  name: string;
  size: number;
  type?: string;
}

export interface PreparedNominationUpload extends NominationFileManifestEntry {
  path: string;
  signedUrl: string;
}

export interface PrepareNominationUploadsResult extends SubmitNominationResult {
  uploadSession?: string;
  uploads?: PreparedNominationUpload[];
}

function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  return cleaned.slice(-180) || "file";
}

function readValues(formData: FormData): NominationValues {
  const str = (key: string) => String(formData.get(key) ?? "");
  return {
    award: str("award"),
    nom_name: str("nom_name"),
    nom_email: str("nom_email"),
    nom_aff: str("nom_aff"),
    nom_rel: str("nom_rel"),
    nominee_name: str("nominee_name"),
    nominee_email: str("nominee_email"),
    nominee_aff: str("nominee_aff"),
    nominee_pos: str("nominee_pos"),
    nominee_country: str("nominee_country"),
    degree: str("degree"),
    enrollment: str("enrollment"),
    statement: str("statement"),
    consent: str("consent") === "true",
  };
}

function readFileManifest(
  formData: FormData,
): Partial<Record<DocFieldKey, NominationFileManifestEntry[]>> {
  const files: Partial<Record<DocFieldKey, NominationFileManifestEntry[]>> = {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(formData.get("file_manifest") ?? "[]"));
  } catch {
    return files;
  }

  if (!Array.isArray(parsed)) return files;

  for (const entry of parsed) {
    if (!isFileManifestEntry(entry)) continue;
    files[entry.key] ??= [];
    files[entry.key]?.push(entry);
  }

  for (const key of DOC_FIELD_KEYS) {
    files[key]?.sort((a, b) => a.index - b.index);
  }

  return files;
}

function isFileManifestEntry(value: unknown): value is NominationFileManifestEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as NominationFileManifestEntry;
  return (
    isAwardDocumentKey(entry.key) &&
    Number.isInteger(entry.index) &&
    entry.index >= 0 &&
    typeof entry.name === "string" &&
    entry.name.length > 0 &&
    typeof entry.size === "number" &&
    Number.isFinite(entry.size) &&
    entry.size > 0 &&
    (entry.type === undefined || typeof entry.type === "string")
  );
}

function isAwardDocumentKey(key: unknown): key is DocFieldKey {
  return typeof key === "string" && (DOC_FIELD_KEYS as readonly string[]).includes(key);
}

function manifestToFilesByKey(
  manifest: Partial<Record<DocFieldKey, NominationFileManifestEntry[]>>,
): FilesByKey {
  const files: FilesByKey = {};
  for (const key of DOC_FIELD_KEYS) {
    const list = manifest[key]?.map(fileMetaToFileLike);
    if (list?.length) files[key] = list;
  }
  return files;
}

function sessionFilesToFilesByKey(files: UploadSessionFile[]): FilesByKey {
  const grouped: Partial<Record<DocFieldKey, FileLike[]>> = {};
  for (const file of files) {
    grouped[file.key] ??= [];
    grouped[file.key]?.push(fileMetaToFileLike(file));
  }
  return grouped;
}

function fileMetaToFileLike(file: { name: string; size: number; type?: string }): FileLike {
  return { name: file.name, size: file.size, type: file.type };
}

function sessionFilesToDocuments(files: UploadSessionFile[]): NominationDocuments {
  const documents: NominationDocuments = {};
  for (const key of DOC_FIELD_KEYS) {
    const list = files.filter((file) => file.key === key);
    if (list.length) {
      documents[key] = list.map((file) => ({
        path: file.path,
        name: file.name,
        size: file.size,
      }));
    }
  }
  return documents;
}

export async function prepareNominationUploads(
  formData: FormData,
): Promise<PrepareNominationUploadsResult> {
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
    return { ok: false, message: "This nomination form is not available for the selected year." };
  }

  const values = readValues(formData);
  const manifest = readFileManifest(formData);
  const files = manifestToFilesByKey(manifest);
  const award = getAward(values.award);

  // 4. Re-validate metadata. Slide page count is verified after direct upload.
  const { valid, errors } = validateNomination(values, files, null);
  if (!valid || !award) {
    return { ok: false, errors, message: "Please correct the highlighted fields and try again." };
  }

  // 5. Prepare signed URLs for browser-to-storage uploads.
  const nominationId = crypto.randomUUID();
  const sessionFiles: UploadSessionFile[] = [];
  const uploads: PreparedNominationUpload[] = [];

  try {
    for (const key of DOC_FIELD_KEYS) {
      const list = manifest[key];
      if (!list?.length) continue;
      for (const [position, file] of list.entries()) {
        const path = `${year}/${nominationId}/${key}/${position + 1}-${sanitizeFileName(file.name)}`;
        const { signedUrl } = await storageService.createSignedUploadUrl({
          bucket: BUCKET,
          path,
          options: { upsert: false },
        });
        const sessionFile = { ...file, path };
        sessionFiles.push(sessionFile);
        uploads.push({ ...sessionFile, signedUrl });
      }
    }
  } catch (error) {
    console.error("Nomination signed upload preparation failed", error);
    return {
      ok: false,
      message:
        "We couldn't prepare secure upload links for your documents. Please try again in a moment.",
    };
  }

  const uploadSession = signUploadSession(
    createUploadSessionPayload({ nominationId, year: year as ValidYear, files: sessionFiles }),
    getUploadSessionSecret(),
  );

  return { ok: true, uploadSession, uploads };
}

export async function submitNomination(formData: FormData): Promise<SubmitNominationResult> {
  // 1. Honeypot — silently reject obvious bots.
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { ok: false, message: "Your submission could not be processed." };
  }

  // 2. Year from the route.
  const year = Number(formData.get("year"));
  if (!VALID_YEARS.includes(year as ValidYear)) {
    return { ok: false, message: "This nomination form is not available for the selected year." };
  }

  const uploadSession = parseUploadSession(
    String(formData.get("upload_session") ?? ""),
    getUploadSessionSecret(),
  );
  if (!uploadSession || uploadSession.year !== year) {
    return {
      ok: false,
      message:
        "Your secure upload session expired or could not be verified. Please choose the files again and resubmit.",
    };
  }

  const values = readValues(formData);
  const award = getAward(values.award);
  const files = sessionFilesToFilesByKey(uploadSession.files);
  const uploadedPaths = uploadSession.files.map((file) => file.path);

  // 3. Best-effort slide page count after direct upload.
  let slidePages: number | null = null;
  if (award?.requiresSlides) {
    const slidesFile = uploadSession.files.find((file) => file.key === "slides");
    if (slidesFile) {
      try {
        const uploadedSlides = await storageService.downloadFile({
          bucket: BUCKET,
          path: slidesFile.path,
        });
        slidePages = await countPdfPages(uploadedSlides);
      } catch (error) {
        console.error("Nomination slide verification failed", error);
        await cleanupUploads(uploadedPaths);
        return {
          ok: false,
          errors: {
            slides:
              "We couldn't verify the uploaded slide deck. Please remove it, choose the PDF again, and resubmit.",
          },
          message: "Please correct the highlighted fields and try again.",
        };
      }
    }
  }

  // 4. Re-validate everything using server-approved upload metadata.
  const { valid, errors } = validateNomination(values, files, slidePages);
  if (!valid || !award || !isAwardId(values.award)) {
    await cleanupUploads(uploadedPaths);
    return { ok: false, errors, message: "Please correct the highlighted fields and try again." };
  }

  const nominationId = uploadSession.nominationId;
  const documents = sessionFilesToDocuments(uploadSession.files);

  // 7. Persist the nomination row (answers + file paths + route year).
  try {
    await db.insert(nominations).values({
      id: nominationId,
      year,
      award: values.award,
      nominatorName: values.nom_name.trim(),
      nominatorEmail: values.nom_email.trim(),
      nominatorAffiliation: values.nom_aff.trim(),
      nominatorRelationship: values.nom_rel.trim(),
      nomineeName: values.nominee_name.trim(),
      nomineeEmail: values.nominee_email.trim(),
      nomineeAffiliation: values.nominee_aff.trim(),
      nomineePosition: values.nominee_pos.trim(),
      nomineeCountry: values.nominee_country.trim(),
      degree: values.degree || null,
      enrollment: values.enrollment || null,
      statement: values.statement.trim(),
      consent: values.consent,
      documents,
      slidePages,
    });
  } catch (error) {
    console.error("Nomination persistence failed", error);
    await cleanupUploads(uploadedPaths);
    return { ok: false, message: "We couldn't save your nomination. Please try again." };
  }

  // 8. Confirmation email (non-fatal).
  try {
    await sendNominationConfirmation({
      to: values.nom_email.trim(),
      year,
      awardName: award.name,
      nominatorName: values.nom_name.trim(),
      nomineeName: values.nominee_name.trim(),
      nomineeAffiliation: values.nominee_aff.trim(),
      statement: values.statement.trim(),
      documentNames: Object.values(documents)
        .flat()
        .map((doc) => doc.name),
    });
  } catch (error) {
    console.error("Nomination confirmation email failed", error);
  }

  return { ok: true };
}

export async function discardNominationUploads(uploadSessionToken: string): Promise<void> {
  const uploadSession = parseUploadSession(uploadSessionToken, getUploadSessionSecret());
  if (!uploadSession) return;
  await cleanupUploads(uploadSession.files.map((file) => file.path));
}

async function cleanupUploads(paths: string[]): Promise<void> {
  if (!paths.length) return;
  try {
    await storageService.deleteFiles({ bucket: BUCKET, paths });
  } catch (error) {
    console.error("Failed to clean up uploaded nomination files", error);
  }
}
