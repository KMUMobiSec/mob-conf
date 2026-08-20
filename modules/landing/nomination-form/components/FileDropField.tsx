"use client";

import { FileText, Upload, X } from "lucide-react";
import { useId } from "react";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/helpers/utils";
import { MAX_FILE_MB_LABEL } from "../lib/constants";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export interface FileDropFieldProps {
  label: string;
  accept: string;
  multiple?: boolean;
  required?: boolean;
  optional?: boolean;
  recommended?: boolean;
  hint?: string;
  status?: string | null;
  files: File[];
  onChange: (files: File[]) => void;
  error?: string;
}

export function FileDropField({
  label,
  accept,
  multiple = false,
  required,
  optional,
  recommended,
  hint,
  status,
  files,
  onChange,
  error,
}: FileDropFieldProps) {
  const inputId = useId();
  const acceptLabel = accept.replace(/\./g, "").toUpperCase().replace(/,/g, " · ");

  const handlePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    if (picked.length) {
      onChange(multiple ? [...files, ...picked] : picked.slice(0, 1));
    }
    event.target.value = "";
  };

  const removeAt = (index: number) => onChange(files.filter((_, i) => i !== index));

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={inputId}>
        {label}
        {required && (
          <span className="font-bold text-destructive" aria-hidden="true">
            *
          </span>
        )}
        {optional && !recommended && (
          <span className="text-xs font-medium text-muted-foreground">(optional)</span>
        )}
        {recommended && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            Recommended
          </span>
        )}
      </FieldLabel>
      {hint && <FieldDescription>{hint}</FieldDescription>}

      <label
        htmlFor={inputId}
        className={cn(
          "flex cursor-pointer items-center gap-3.5 rounded-md border border-dashed border-input bg-muted/40 px-4 py-3.5 transition-colors hover:border-primary hover:bg-accent",
          files.length && "border-solid bg-card",
          error && "border-destructive",
        )}
      >
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handlePick}
          className="sr-only"
        />
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
          <Upload className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">
            {files.length
              ? multiple
                ? "Add another file"
                : "Replace file"
              : `Choose file${multiple ? "s" : ""}`}
          </span>
          <span className="block text-xs text-muted-foreground">
            {acceptLabel} · {multiple ? "multiple files allowed" : "single file"} · max{" "}
            {MAX_FILE_MB_LABEL} per file
          </span>
        </span>
      </label>

      {status && <p className="body text-xs text-muted-foreground">{status}</p>}

      {files.length > 0 && (
        <ul className="list flex flex-col gap-1.5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-md border border-border bg-muted/40 py-1.5 pl-2.5 pr-2 text-sm"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {formatSize(file.size)}
              </span>
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label={`Remove ${file.name}`}
                className="flex shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <FieldError>{error}</FieldError>
    </Field>
  );
}
