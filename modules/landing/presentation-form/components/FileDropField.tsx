"use client";

import { FileText, Upload, X } from "lucide-react";
import { useId } from "react";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/helpers/utils";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** A selected file plus a stable id and optional upload progress (0–100). */
export interface SelectedFile {
  id: string;
  file: File;
  progress?: number;
}

export interface FileDropFieldProps {
  label: string;
  accept: string;
  /** Short caption under the drop control, e.g. "PDF · PPT · PPTX · max 50 MB". */
  captionHint: string;
  multiple?: boolean;
  required?: boolean;
  hint?: string;
  files: SelectedFile[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  error?: string;
  disabled?: boolean;
}

/** Drag/drop upload field supporting one or many files, each with a progress bar. */
export function FileDropField({
  label,
  accept,
  captionHint,
  multiple = false,
  required,
  hint,
  files,
  onAdd,
  onRemove,
  error,
  disabled,
}: FileDropFieldProps) {
  const inputId = useId();

  const handlePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    if (picked.length) onAdd(picked);
    event.target.value = "";
  };

  const hasFiles = files.length > 0;
  const chooseLabel = multiple ? "Add files" : hasFiles ? "Replace file" : "Choose file";

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={inputId}>
        {label}
        {required && (
          <span className="font-bold text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </FieldLabel>
      {hint && <FieldDescription>{hint}</FieldDescription>}

      <label
        htmlFor={inputId}
        className={cn(
          "flex cursor-pointer items-center gap-3.5 rounded-md border border-dashed border-input bg-muted/40 px-4 py-3.5 transition-colors hover:border-primary hover:bg-accent",
          hasFiles && "border-solid bg-card",
          error && "border-destructive",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handlePick}
          className="sr-only"
        />
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
          <Upload className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">{chooseLabel}</span>
          <span className="block text-xs text-muted-foreground">{captionHint}</span>
        </span>
      </label>

      {hasFiles && (
        <ul className="list flex flex-col gap-1.5">
          {files.map(({ id, file, progress }) => (
            <li
              key={id}
              className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/40 py-1.5 pl-2.5 pr-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {formatSize(file.size)}
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onRemove(id)}
                    aria-label={`Remove ${file.name}`}
                    className="flex shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              {progress !== undefined && (
                <div
                  className="h-1 w-full overflow-hidden rounded-full bg-border"
                  role="progressbar"
                  aria-valuenow={Math.round(progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Uploading ${file.name}`}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-200"
                    style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <FieldError>{error}</FieldError>
    </Field>
  );
}
