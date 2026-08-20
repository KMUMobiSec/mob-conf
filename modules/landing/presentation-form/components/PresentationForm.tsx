"use client";

import { useMemo, useRef, useState } from "react";

import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ValidYear } from "@/constants/config";
import {
  discardPresentationUpload,
  type PreparedPresentationUpload,
  preparePresentationUpload,
  type SubmitPresentationResult,
  submitPresentation,
} from "../actions";
import { MATERIAL_ACCEPT, MAX_FILE_MB_LABEL, MAX_MATERIAL_FILES } from "../lib/constants";
import { EMPTY_VALUES, type PresentationValues, validatePresentation } from "../lib/schema";
import { FileDropField, type SelectedFile } from "./FileDropField";
import { type PresentationSnapshot, SuccessView } from "./SuccessView";
import { VideoField } from "./VideoField";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

let selectedFileSeq = 0;
function makeSelected(file: File): SelectedFile {
  selectedFileSeq += 1;
  return { id: `f${selectedFileSeq}-${file.name}-${file.size}`, file };
}

function RequiredMark() {
  return (
    <span className="font-bold text-destructive" aria-hidden="true">
      *
    </span>
  );
}

class DirectUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DirectUploadError";
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function omitError(errors: Record<string, string>, key: string): Record<string, string> {
  if (!(key in errors)) return errors;
  const { [key]: _removed, ...rest } = errors;
  return rest;
}

function uploadToSignedUrl(
  upload: PreparedPresentationUpload,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);

    xhr.open("PUT", upload.signedUrl);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }
      const reason = xhr.responseText?.trim()
        ? `HTTP ${xhr.status}: ${xhr.responseText.trim()}`
        : `HTTP ${xhr.status}`;
      reject(
        new DirectUploadError(
          `Upload failed for ${file.name} (${formatSize(file.size)}). The form allows up to ${MAX_FILE_MB_LABEL}, but storage rejected this upload (${reason}). Please try again or choose a smaller file.`,
        ),
      );
    };
    xhr.onerror = () =>
      reject(
        new DirectUploadError(
          `Upload failed for ${file.name}. Please check your connection and try again.`,
        ),
      );
    xhr.send(body);
  });
}

function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  type = "text",
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  hint?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>
        {label}
        <RequiredMark />
      </FieldLabel>
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      <FieldError>{error}</FieldError>
    </Field>
  );
}

export function PresentationForm({ year }: { year: ValidYear }) {
  const [values, setValues] = useState<PresentationValues>(EMPTY_VALUES);
  const [materials, setMaterials] = useState<SelectedFile[]>([]);
  const [video, setVideo] = useState<SelectedFile | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [tried, setTried] = useState(false);
  const [token, setToken] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<PresentationSnapshot | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const clearFieldError = (key: string) => setServerFieldErrors((prev) => omitError(prev, key));

  const set = <K extends keyof PresentationValues>(key: K, val: PresentationValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    clearFieldError(key);
  };
  const touch = (key: string) => setTouched((prev) => ({ ...prev, [key]: true }));

  const addMaterials = (files: File[]) => {
    clearFieldError("materials");
    setMaterials((prev) => [...prev, ...files.map(makeSelected)].slice(0, MAX_MATERIAL_FILES));
    touch("materials");
  };
  const removeMaterial = (id: string) => {
    clearFieldError("materials");
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    touch("materials");
  };
  const setVideoFile = (file: File | null) => {
    clearFieldError("video");
    setVideo(file ? makeSelected(file) : null);
    touch("video");
  };
  const setVideoUrl = (url: string) => {
    clearFieldError("video");
    clearFieldError("videoUrl");
    set("videoUrl", url);
  };

  const selection = useMemo(
    () => ({ materials: materials.map((m) => m.file), video: video?.file ?? null }),
    [materials, video],
  );
  const { valid, errors } = useMemo(
    () => validatePresentation(values, selection),
    [values, selection],
  );
  const displayErrors = useMemo(
    () => ({ ...errors, ...serverFieldErrors }),
    [errors, serverFieldErrors],
  );
  const showErr = (key: string) => (touched[key] || tried ? displayErrors[key] : undefined);

  function buildFormData(uploadSession?: string): FormData {
    const fd = new FormData();
    fd.set("year", String(year));
    fd.set("company", honeypot);
    fd.set("cf-turnstile-response", token);
    const manifest = [
      ...materials.map((m) => ({
        name: m.file.name,
        size: m.file.size,
        type: m.file.type || undefined,
        kind: "material" as const,
      })),
      ...(video
        ? [
            {
              name: video.file.name,
              size: video.file.size,
              type: video.file.type || undefined,
              kind: "video" as const,
            },
          ]
        : []),
    ];
    fd.set("file_manifest", JSON.stringify(manifest));
    if (uploadSession) fd.set("upload_session", uploadSession);
    fd.set("paper_number", values.paperNumber);
    fd.set("title", values.title);
    fd.set("contact_email", values.contactEmail);
    fd.set("video_url", values.videoUrl);
    return fd;
  }

  function scrollFirstInvalid() {
    requestAnimationFrame(() => {
      const firstInvalid = formRef.current?.querySelector<HTMLElement>(
        '[data-invalid="true"], [aria-invalid="true"]',
      );
      firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function showActionResultError(result: SubmitPresentationResult) {
    setServerFieldErrors(result.errors ?? {});
    setServerError(result.message ?? "Please correct the highlighted fields and try again.");
    scrollFirstInvalid();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTried(true);
    setServerError(null);
    setServerFieldErrors({});
    setProgress({});
    if (!valid) {
      scrollFirstInvalid();
      return;
    }

    // Ordered list of files matches the manifest order sent to the server.
    const filesInOrder: SelectedFile[] = [...materials, ...(video ? [video] : [])];

    setSubmitting(true);
    let uploadSession: string | undefined;
    try {
      const prepared = await preparePresentationUpload(buildFormData());
      if (!prepared.ok || !prepared.uploadSession || !prepared.uploads) {
        showActionResultError(prepared);
        return;
      }

      uploadSession = prepared.uploadSession;
      const uploads = prepared.uploads;
      const mismatch =
        uploads.length !== filesInOrder.length ||
        uploads.some(
          (u, i) => u.name !== filesInOrder[i].file.name || u.size !== filesInOrder[i].file.size,
        );
      if (mismatch) {
        await discardPresentationUpload(uploadSession);
        setServerFieldErrors({
          materials:
            "Your selected files changed while preparing the upload. Please choose them again and resubmit.",
        });
        setServerError("The selected files changed. Please re-select and resubmit.");
        scrollFirstInvalid();
        return;
      }

      try {
        for (let i = 0; i < uploads.length; i += 1) {
          const upload = uploads[i];
          const { id, file } = filesInOrder[i];
          await uploadToSignedUrl(upload, file, (percent) =>
            setProgress((prev) => ({ ...prev, [id]: percent })),
          );
        }
      } catch (error) {
        await discardPresentationUpload(uploadSession);
        if (error instanceof DirectUploadError) {
          setServerFieldErrors({ materials: error.message });
          setServerError("A file could not be uploaded. Check the highlighted upload field.");
          scrollFirstInvalid();
          return;
        }
        throw error;
      }

      const result = await submitPresentation(buildFormData(uploadSession));
      if (result.ok) {
        setSubmitted({
          values: { ...values },
          materialFileNames: materials.map((m) => m.file.name),
          videoFileName: video?.file.name ?? null,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        showActionResultError(result);
      }
    } catch {
      setServerError(
        "The presentation could not be submitted. Please try again. If this happens again, contact the EBISION team.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setValues(EMPTY_VALUES);
    setMaterials([]);
    setVideo(null);
    setProgress({});
    setTouched({});
    setTried(false);
    setToken("");
    setHoneypot("");
    setServerFieldErrors({});
    setServerError(null);
    setSubmitted(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submitted) {
    return <SuccessView snapshot={submitted} onReset={reset} />;
  }

  const materialsWithProgress: SelectedFile[] = materials.map((m) => ({
    ...m,
    progress: progress[m.id],
  }));
  const videoWithProgress: SelectedFile | null = video
    ? { ...video, progress: progress[video.id] }
    : null;

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <Card className="gap-0 overflow-hidden p-0">
        <section className="flex flex-col gap-4 border-b border-border px-5 py-6 sm:px-8">
          <TextField
            id="paper_number"
            label="Paper Number"
            placeholder="Enter your paper number"
            value={values.paperNumber}
            onChange={(v) => set("paperNumber", v)}
            onBlur={() => touch("paperNumber")}
            error={showErr("paperNumber")}
          />
          <TextField
            id="title"
            label="Title"
            placeholder="Enter the title of your paper"
            value={values.title}
            onChange={(v) => set("title", v)}
            onBlur={() => touch("title")}
            error={showErr("title")}
          />
          <TextField
            id="contact_email"
            label="Contact Email"
            type="email"
            autoComplete="email"
            placeholder="Enter the email of your designated contact person"
            value={values.contactEmail}
            onChange={(v) => set("contactEmail", v)}
            onBlur={() => touch("contactEmail")}
            error={showErr("contactEmail")}
          />
        </section>

        <section className="flex flex-col gap-4 border-b border-border px-5 py-6 sm:px-8">
          <div>
            <h2 className="heading text-foreground">Upload your presentation</h2>
            <p className="body mt-1.5 text-sm text-muted-foreground">
              Upload your presentation materials here. Your files are stored securely and are only
              accessible to the EBISION organizing committee.
            </p>
          </div>

          <FileDropField
            label="Presentation materials"
            required
            multiple
            accept={MATERIAL_ACCEPT}
            captionHint={`PDF · PPT · PPTX · up to ${MAX_MATERIAL_FILES} files · max ${MAX_FILE_MB_LABEL} each`}
            hint={`Accepted formats: PDF, PPT, PPTX. Up to ${MAX_MATERIAL_FILES} files, maximum ${MAX_FILE_MB_LABEL} each.`}
            files={materialsWithProgress}
            onAdd={addMaterials}
            onRemove={removeMaterial}
            error={showErr("materials")}
            disabled={submitting}
          />
        </section>

        <section className="flex flex-col gap-4 px-5 py-6 sm:px-8">
          <VideoField
            file={videoWithProgress}
            onFile={setVideoFile}
            url={values.videoUrl}
            onUrl={setVideoUrl}
            onUrlBlur={() => touch("videoUrl")}
            fileError={showErr("video")}
            urlError={showErr("videoUrl")}
            disabled={submitting}
          />

          {tried && !valid && (
            <div className="rounded-md border border-destructive/35 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
              Please correct the highlighted fields before submitting.
            </div>
          )}
          {serverError && (
            <div className="rounded-md border border-destructive/35 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          {/* Honeypot — must remain empty */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden"
          >
            <label>
              Company
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
              />
            </label>
          </div>

          {SITE_KEY && <TurnstileWidget siteKey={SITE_KEY} onToken={setToken} />}

          <div className="flex flex-wrap items-center gap-3.5">
            <Button type="submit" disabled={submitting || (Boolean(SITE_KEY) && !token)}>
              {submitting ? "Submitting…" : "Submit"}
            </Button>
            <Button type="button" variant="ghost" onClick={reset} disabled={submitting}>
              Clear form
            </Button>
            <span className="text-xs text-muted-foreground">* required</span>
          </div>
        </section>
      </Card>
    </form>
  );
}
