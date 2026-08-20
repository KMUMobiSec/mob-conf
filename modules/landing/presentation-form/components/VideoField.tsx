"use client";

import { Info } from "lucide-react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MAX_FILE_MB_LABEL, VIDEO_ACCEPT } from "../lib/constants";
import { FileDropField, type SelectedFile } from "./FileDropField";

export interface VideoFieldProps {
  file: SelectedFile | null;
  onFile: (file: File | null) => void;
  url: string;
  onUrl: (url: string) => void;
  onUrlBlur?: () => void;
  fileError?: string;
  urlError?: string;
  disabled?: boolean;
}

/**
 * Optional presentation video: upload a file (≤ 50 MB) OR paste a link for larger
 * recordings. The two are mutually exclusive — choosing one disables the other.
 */
export function VideoField({
  file,
  onFile,
  url,
  onUrl,
  onUrlBlur,
  fileError,
  urlError,
  disabled,
}: VideoFieldProps) {
  const hasFile = Boolean(file);
  const hasUrl = url.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="heading text-foreground">Presentation video</h2>
        <p className="body mt-1.5 text-sm text-muted-foreground">
          Optional — for authors presenting online. A recording of your talk for the online
          sessions.
        </p>
      </div>

      <ul className="body flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
        <li>
          <strong className="text-foreground">{MAX_FILE_MB_LABEL} or smaller?</strong> Upload it
          directly below (MP4, MOV, or WEBM).
        </li>
        <li>
          <strong className="text-foreground">Larger than {MAX_FILE_MB_LABEL}?</strong> Share a link
          instead — Google Drive, OneDrive, Dropbox, and similar all work.
        </li>
      </ul>

      <FileDropField
        label="Upload video"
        accept={VIDEO_ACCEPT}
        captionHint={`MP4 · MOV · WEBM · single file · max ${MAX_FILE_MB_LABEL}`}
        files={file ? [file] : []}
        onAdd={(picked) => onFile(picked[0] ?? null)}
        onRemove={() => onFile(null)}
        error={fileError}
        disabled={disabled || hasUrl}
      />

      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <Field data-invalid={urlError ? true : undefined}>
        <FieldLabel htmlFor="video_url">Video link</FieldLabel>
        <Input
          id="video_url"
          type="url"
          inputMode="url"
          placeholder="https://drive.google.com/…"
          value={url}
          disabled={disabled || hasFile}
          aria-invalid={urlError ? true : undefined}
          onChange={(event) => onUrl(event.target.value)}
          onBlur={onUrlBlur}
        />
        <div className="mt-1.5 flex items-start gap-2 rounded-md border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm text-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="body leading-relaxed">
            Please make sure the link lets anyone with it <strong>view and download</strong> the
            file. The organizing committee needs to download your recording to prepare the online
            program, so a quick check of your sharing settings now keeps everything running
            smoothly. Thank you!
          </p>
        </div>
        <FieldError>{urlError}</FieldError>
      </Field>
    </div>
  );
}
