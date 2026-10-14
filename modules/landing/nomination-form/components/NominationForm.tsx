"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ValidYear } from "@/constants/config";
import { cn } from "@/lib/helpers/utils";
import {
  discardNominationUploads,
  type NominationFileManifestEntry,
  type PreparedNominationUpload,
  prepareNominationUploads,
  type SubmitNominationResult,
  submitNomination,
} from "../actions";
import {
  AWARDS,
  DEGREE_OPTIONS,
  DOC_FIELD_KEYS,
  DOC_FIELDS,
  type DocFieldKey,
  ENROLLMENT_OPTIONS,
  getAward,
  MAX_FILE_MB_LABEL,
  MAX_SLIDES,
} from "../lib/constants";
import { countPdfPages } from "../lib/pdf-pages";
import { EMPTY_VALUES, type NominationValues, validateNomination } from "../lib/schema";
import { FileDropField } from "./FileDropField";
import { type NominationSnapshot, SuccessView } from "./SuccessView";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

function RequiredMark() {
  return (
    <span className="font-bold text-destructive" aria-hidden="true">
      *
    </span>
  );
}

class DirectUploadError extends Error {
  readonly key: DocFieldKey;

  constructor(key: DocFieldKey, message: string) {
    super(message);
    this.name = "DirectUploadError";
    this.key = key;
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

async function uploadToSignedUrl(upload: PreparedNominationUpload, file: File): Promise<void> {
  const body = new FormData();
  body.append("cacheControl", "3600");
  body.append("", file);

  const response = await fetch(upload.signedUrl, {
    method: "PUT",
    body,
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    const status = `HTTP ${response.status}`;
    const reason = details.trim() ? `${status}: ${details.trim()}` : status;
    throw new DirectUploadError(
      upload.key,
      `Upload failed for ${file.name} (${formatSize(file.size)}). The form allows up to ${MAX_FILE_MB_LABEL} per file, but storage rejected this upload (${reason}). Please try again or choose a smaller file.`,
    );
  }
}

function Section({
  num,
  title,
  desc,
  children,
}: {
  num: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-border px-5 py-6 last:border-b-0 sm:px-8">
      <div className="flex items-center gap-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-base font-bold tabular-nums text-primary-foreground">
          {num}
        </span>
        <h2 className="heading text-foreground">{title}</h2>
      </div>
      {desc && (
        <p className="body mt-1.5 mb-4 text-sm text-muted-foreground sm:ml-[3.25rem]">{desc}</p>
      )}
      <div className="flex flex-col gap-4 sm:ml-[3.25rem]">{children}</div>
    </section>
  );
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
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      <FieldError>{error}</FieldError>
    </Field>
  );
}

export function NominationForm({ year }: { year: ValidYear }) {
  const [values, setValues] = useState<NominationValues>(EMPTY_VALUES);
  const [files, setFiles] = useState<Partial<Record<DocFieldKey, File[]>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [tried, setTried] = useState(false);
  const [slidePages, setSlidePages] = useState<number | null>(null);
  const [token, setToken] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});
  const [uploadFieldErrors, setUploadFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<NominationSnapshot | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const award = getAward(values.award);
  const isGrad = Boolean(award?.showsGradFields);
  const isIndustry = Boolean(award?.requiresSlides);
  const isLecturer = Boolean(award?.recommendsTeaching);

  const clearFieldErrors = (key: string) => {
    setServerFieldErrors((prev) => omitError(prev, key));
    setUploadFieldErrors((prev) => omitError(prev, key));
  };

  const set = <K extends keyof NominationValues>(key: K, val: NominationValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    clearFieldErrors(key);
  };
  const touch = (key: string) => setTouched((prev) => ({ ...prev, [key]: true }));
  const setFileFor = (key: DocFieldKey, arr: File[]) => {
    clearFieldErrors(key);
    setFiles((prev) => ({ ...prev, [key]: arr }));
  };

  const { valid, errors } = useMemo(
    () => validateNomination(values, files, slidePages),
    [values, files, slidePages],
  );
  const displayErrors = useMemo(
    () => ({ ...errors, ...serverFieldErrors, ...uploadFieldErrors }),
    [errors, serverFieldErrors, uploadFieldErrors],
  );
  const showErr = (key: string) => (touched[key] || tried ? displayErrors[key] : undefined);

  // Detect slide PDF page count for the Industry Pioneer award.
  const slidesFile = files.slides?.[0];
  useEffect(() => {
    if (!isIndustry || !slidesFile) {
      setSlidePages(null);
      return;
    }
    let alive = true;
    countPdfPages(slidesFile).then((pages) => {
      if (alive) setSlidePages(pages);
    });
    return () => {
      alive = false;
    };
  }, [slidesFile, isIndustry]);

  const slidesStatus =
    isIndustry && files.slides?.length
      ? slidePages == null
        ? `Could not auto-detect page count — please ensure the PDF has ${MAX_SLIDES} pages or fewer.`
        : `Detected ${slidePages} page${slidePages === 1 ? "" : "s"}${
            slidePages > MAX_SLIDES ? " — over the limit." : " — within the limit."
          }`
      : null;

  function buildFileManifest(): NominationFileManifestEntry[] {
    return DOC_FIELD_KEYS.flatMap((key) =>
      (files[key] ?? []).map((file, index) => ({
        key,
        index,
        name: file.name,
        size: file.size,
        type: file.type || undefined,
      })),
    );
  }

  function buildFormData(uploadSession?: string): FormData {
    const fd = new FormData();
    fd.set("year", String(year));
    fd.set("company", honeypot);
    fd.set("cf-turnstile-response", token);
    fd.set("file_manifest", JSON.stringify(buildFileManifest()));
    if (uploadSession) fd.set("upload_session", uploadSession);
    for (const [key, val] of Object.entries(values)) {
      fd.set(key, typeof val === "boolean" ? String(val) : val);
    }
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

  function showActionResultError(result: SubmitNominationResult) {
    setServerFieldErrors(result.errors ?? {});
    setServerError(result.message ?? "Please correct the highlighted fields and try again.");
    scrollFirstInvalid();
  }

  async function uploadPreparedFiles(uploads: PreparedNominationUpload[]) {
    for (const upload of uploads) {
      const file = files[upload.key]?.[upload.index];
      if (!file || file.name !== upload.name || file.size !== upload.size) {
        throw new DirectUploadError(
          upload.key,
          "The selected file changed while preparing the upload. Please choose the file again and resubmit.",
        );
      }

      await uploadToSignedUrl(upload, file);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTried(true);
    setServerError(null);
    setServerFieldErrors({});
    setUploadFieldErrors({});
    if (!valid || !award) {
      // Surface the first incomplete field after the errors render.
      scrollFirstInvalid();
      return;
    }

    setSubmitting(true);
    let uploadSession: string | undefined;
    try {
      const prepared = await prepareNominationUploads(buildFormData());
      if (!prepared.ok || !prepared.uploadSession || !prepared.uploads) {
        showActionResultError(prepared);
        return;
      }

      uploadSession = prepared.uploadSession;
      try {
        await uploadPreparedFiles(prepared.uploads);
      } catch (error) {
        await discardNominationUploads(uploadSession);
        if (error instanceof DirectUploadError) {
          setUploadFieldErrors({ [error.key]: error.message });
          setServerError("One document could not be uploaded. Check the highlighted upload field.");
          scrollFirstInvalid();
          return;
        }
        throw error;
      }

      const result = await submitNomination(buildFormData(uploadSession));
      if (result.ok) {
        const fileNames = Object.fromEntries(
          DOC_FIELD_KEYS.map((key) => [key, (files[key] ?? []).map((file) => file.name)]),
        ) as Record<DocFieldKey, string[]>;
        setSubmitted({ awardName: award.name, values: { ...values }, fileNames, slidePages });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        showActionResultError(result);
      }
    } catch {
      setServerError(
        "The nomination could not be submitted. Please try again. If this happens again, contact the MOBISEC awards team.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setValues(EMPTY_VALUES);
    setFiles({});
    setTouched({});
    setTried(false);
    setSlidePages(null);
    setToken("");
    setHoneypot("");
    setServerFieldErrors({});
    setUploadFieldErrors({});
    setServerError(null);
    setSubmitted(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submitted) {
    return <SuccessView snapshot={submitted} onReset={reset} />;
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <Card className="gap-0 overflow-hidden p-0">
        {/* 1. Award */}
        <Section
          num="1"
          title="Award selection"
          desc="Choose the award you are nominating for. The required fields and documents below depend on this choice."
        >
          <Field data-invalid={showErr("award") ? true : undefined}>
            <FieldLabel htmlFor="award">
              Award
              <RequiredMark />
            </FieldLabel>
            <Select
              value={values.award}
              onValueChange={(val) => {
                set("award", val);
                touch("award");
              }}
            >
              <SelectTrigger
                id="award"
                className="w-full"
                aria-invalid={showErr("award") ? true : undefined}
              >
                <SelectValue placeholder="Select an award…" />
              </SelectTrigger>
              <SelectContent>
                {AWARDS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{showErr("award")}</FieldError>
          </Field>
        </Section>

        {/* 2. Nominator */}
        <Section
          num="2"
          title="Nominator details"
          desc="Your contact information. All fields are required."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="nom_name"
              label="Full name"
              autoComplete="name"
              value={values.nom_name}
              onChange={(v) => set("nom_name", v)}
              onBlur={() => touch("nom_name")}
              error={showErr("nom_name")}
            />
            <TextField
              id="nom_email"
              label="Email"
              type="email"
              autoComplete="email"
              value={values.nom_email}
              onChange={(v) => set("nom_email", v)}
              onBlur={() => touch("nom_email")}
              error={showErr("nom_email")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="nom_aff"
              label="Affiliation / institution"
              value={values.nom_aff}
              onChange={(v) => set("nom_aff", v)}
              onBlur={() => touch("nom_aff")}
              error={showErr("nom_aff")}
            />
            <TextField
              id="nom_rel"
              label="Relationship to nominee"
              hint="e.g. colleague, supervisor, collaborator, mentee"
              value={values.nom_rel}
              onChange={(v) => set("nom_rel", v)}
              onBlur={() => touch("nom_rel")}
              error={showErr("nom_rel")}
            />
          </div>
        </Section>

        {/* 3. Nominee */}
        <Section
          num="3"
          title="Nominee details"
          desc="Information about the person being nominated."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="nominee_name"
              label="Full name"
              value={values.nominee_name}
              onChange={(v) => set("nominee_name", v)}
              onBlur={() => touch("nominee_name")}
              error={showErr("nominee_name")}
            />
            <TextField
              id="nominee_email"
              label="Email"
              type="email"
              value={values.nominee_email}
              onChange={(v) => set("nominee_email", v)}
              onBlur={() => touch("nominee_email")}
              error={showErr("nominee_email")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="nominee_aff"
              label="Affiliation / institution"
              value={values.nominee_aff}
              onChange={(v) => set("nominee_aff", v)}
              onBlur={() => touch("nominee_aff")}
              error={showErr("nominee_aff")}
            />
            <TextField
              id="nominee_pos"
              label="Position / title"
              value={values.nominee_pos}
              onChange={(v) => set("nominee_pos", v)}
              onBlur={() => touch("nominee_pos")}
              error={showErr("nominee_pos")}
            />
          </div>
          <div className="sm:max-w-[340px]">
            <TextField
              id="nominee_country"
              label="Country"
              value={values.nominee_country}
              onChange={(v) => set("nominee_country", v)}
              onBlur={() => touch("nominee_country")}
              error={showErr("nominee_country")}
            />
          </div>

          {isGrad && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-1">
              <Field data-invalid={showErr("degree") ? true : undefined}>
                <FieldLabel>
                  Current degree program
                  <RequiredMark />
                </FieldLabel>
                <RadioGroup
                  className="flex flex-wrap gap-3"
                  value={values.degree}
                  onValueChange={(val) => {
                    set("degree", val);
                    touch("degree");
                  }}
                >
                  {DEGREE_OPTIONS.map((option) => (
                    <Label
                      key={option.value}
                      className={cn(
                        "cursor-pointer rounded-md border px-3.5 py-2.5 text-sm font-normal transition-colors hover:border-primary",
                        values.degree === option.value
                          ? "border-primary bg-accent"
                          : "border-input",
                      )}
                    >
                      <RadioGroupItem value={option.value} />
                      {option.label}
                    </Label>
                  ))}
                </RadioGroup>
                <FieldError>{showErr("degree")}</FieldError>
              </Field>

              <Field data-invalid={showErr("enrollment") ? true : undefined}>
                <FieldLabel>
                  Enrollment status
                  <RequiredMark />
                </FieldLabel>
                <FieldDescription>
                  Must be currently enrolled to qualify for this award.
                </FieldDescription>
                <RadioGroup
                  className="flex flex-wrap gap-3"
                  value={values.enrollment}
                  onValueChange={(val) => {
                    set("enrollment", val);
                    touch("enrollment");
                  }}
                >
                  {ENROLLMENT_OPTIONS.map((option) => (
                    <Label
                      key={option.value}
                      className={cn(
                        "cursor-pointer rounded-md border px-3.5 py-2.5 text-sm font-normal transition-colors hover:border-primary",
                        values.enrollment === option.value
                          ? "border-primary bg-accent"
                          : "border-input",
                      )}
                    >
                      <RadioGroupItem value={option.value} />
                      {option.label}
                    </Label>
                  ))}
                </RadioGroup>
                <FieldError>{showErr("enrollment")}</FieldError>
              </Field>
            </div>
          )}
        </Section>

        {/* 4. Statement */}
        <Section
          num="4"
          title="Nomination statement"
          desc="Explain why this nominee deserves the award."
        >
          <Field data-invalid={showErr("statement") ? true : undefined}>
            <FieldLabel htmlFor="statement">
              Justification
              <RequiredMark />
            </FieldLabel>
            <FieldDescription>
              Describe the nominee's achievements, impact, and why they merit this recognition.
            </FieldDescription>
            <Textarea
              id="statement"
              className="min-h-28"
              placeholder="The nominee has demonstrated…"
              value={values.statement}
              aria-invalid={showErr("statement") ? true : undefined}
              onChange={(event) => set("statement", event.target.value)}
              onBlur={() => touch("statement")}
            />
            <p className="body text-right text-xs text-muted-foreground">
              {values.statement.trim().length} characters
            </p>
            <FieldError>{showErr("statement")}</FieldError>
          </Field>
        </Section>

        {/* 5. Documents */}
        <Section
          num="5"
          title="Supporting documents"
          desc={
            award
              ? `Required documents for the ${award.name}.`
              : "Select an award above to see which documents are required."
          }
        >
          <FileDropField
            label="Curriculum Vitae (CV)"
            required
            accept={DOC_FIELDS.cv.accept}
            files={files.cv ?? []}
            onChange={(arr) => setFileFor("cv", arr)}
            error={showErr("cv")}
          />
          <FileDropField
            label="Summary of major research achievements & contributions"
            required
            accept={DOC_FIELDS.achievements.accept}
            files={files.achievements ?? []}
            onChange={(arr) => setFileFor("achievements", arr)}
            error={showErr("achievements")}
          />
          <FileDropField
            label="Supporting documentation"
            required
            multiple
            accept={DOC_FIELDS.supporting.accept}
            hint="Publication lists, awards, project reports, etc. You may attach multiple files."
            files={files.supporting ?? []}
            onChange={(arr) => setFileFor("supporting", arr)}
            error={showErr("supporting")}
          />
          <FileDropField
            label="Record of teaching or relevant service accomplishments"
            optional
            recommended={isLecturer}
            accept={DOC_FIELDS.teaching.accept}
            hint={
              isLecturer
                ? "Strongly recommended for the Distinguished Lecturer Award."
                : "Optional, but helpful for the committee."
            }
            files={files.teaching ?? []}
            onChange={(arr) => setFileFor("teaching", arr)}
            error={showErr("teaching")}
          />

          {isGrad && (
            <div className="animate-in fade-in slide-in-from-top-1">
              <FileDropField
                label="Letter of recommendation from supervisor"
                required
                accept={DOC_FIELDS.recommendation.accept}
                hint="Required for the Promising Graduate Student Award. Submission is blocked without it."
                files={files.recommendation ?? []}
                onChange={(arr) => setFileFor("recommendation", arr)}
                error={showErr("recommendation")}
              />
            </div>
          )}

          {isIndustry && (
            <div className="animate-in fade-in slide-in-from-top-1">
              <FileDropField
                label="Innovation achievement slides"
                required
                accept={DOC_FIELDS.slides.accept}
                hint={`Up to ${MAX_SLIDES} slides showcasing innovation achievements. Submit as a single PDF — maximum ${MAX_SLIDES} pages.`}
                status={slidesStatus}
                files={files.slides ?? []}
                onChange={(arr) => setFileFor("slides", arr)}
                error={showErr("slides")}
              />
            </div>
          )}
        </Section>

        {/* 6. Consent + submit */}
        <div className="flex flex-col gap-3.5 px-5 py-6 sm:px-8">
          <Field data-invalid={showErr("consent") ? true : undefined}>
            <Label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-muted/40 p-4">
              <Checkbox
                className="mt-0.5"
                checked={values.consent}
                aria-invalid={showErr("consent") ? true : undefined}
                onCheckedChange={(checked) => {
                  set("consent", checked === true);
                  touch("consent");
                }}
              />
              <span className="text-sm font-normal leading-snug">
                I confirm that the nominee is aware of this nomination and consents to being
                considered for this award.
              </span>
            </Label>
            <FieldError>{showErr("consent")}</FieldError>
          </Field>

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
            <Button
              type="submit"
              disabled={submitting || !values.consent || (Boolean(SITE_KEY) && !token)}
            >
              {submitting ? "Submitting…" : "Submit nomination"}
            </Button>
            <Button type="button" variant="ghost" onClick={reset}>
              Clear form
            </Button>
            <span className="text-xs text-muted-foreground">* required</span>
          </div>
        </div>
      </Card>
    </form>
  );
}
