"use client";

import { FileText, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ValidYear } from "@/constants/config";
import { cn } from "@/lib/helpers/utils";
import { importRegistrations } from "@/modules/admin/qr-check-ins/actions";

const ACCEPT = ".csv,text/csv,text/plain";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isCsvFile(file: File): boolean {
  return /\.(csv|txt)$/i.test(file.name) || file.type === "text/csv" || file.type === "text/plain";
}

export function CsvImportDialog({ year }: { year: ValidYear }) {
  const t = useTranslations("Admin.qrCheckIns.dialogs");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<{ name: string; size: number; csv: string } | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setSelected(null);
    setMessage(null);
    setError(null);
    setDragging(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function acceptFile(file: File) {
    setMessage(null);
    if (!isCsvFile(file)) {
      setError(t("importFileTypeError"));
      return;
    }
    const csv = await file.text();
    if (!csv.trim()) {
      setError(t("importEmptyFileError"));
      return;
    }
    setError(null);
    setSelected({ name: file.name, size: file.size, csv });
  }

  function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void acceptFile(file);
    event.target.value = "";
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void acceptFile(file);
  }

  function handleImport() {
    if (!selected) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await importRegistrations({ year, csv: selected.csv });
      if (!result.ok && result.error) {
        setError(result.error);
        return;
      }
      setMessage(
        t("importResult", {
          created: result.created,
          updated: result.updated,
          invalid: result.invalidRows.length,
        }),
      );
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="size-4" />
          {t("importButton")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("importTitle")}</DialogTitle>
          <DialogDescription>{t("importDescription")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          <label
            htmlFor="csv-file-input"
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(event) => {
              // Ignore leaves into child elements; only clear when the pointer exits the dropzone.
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setDragging(false);
              }
            }}
            onDrop={handleDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-input bg-muted/40 px-4 py-8 text-center transition-colors hover:border-primary hover:bg-accent",
              dragging && "border-primary bg-accent",
              error && "border-destructive",
            )}
          >
            <input
              id="csv-file-input"
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              onChange={handlePick}
              className="sr-only"
            />
            <span className="flex size-10 items-center justify-center rounded-md bg-accent text-primary">
              <Upload className="size-5" />
            </span>
            <span className="text-sm font-semibold text-foreground">
              {dragging ? t("dropHere") : t("browse")}
            </span>
            <span className="text-xs text-muted-foreground">{t("fileHint")}</span>
          </label>

          {selected ? (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 py-1.5 pl-2.5 pr-2 text-sm">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{selected.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {formatSize(selected.size)}
              </span>
              <button
                type="button"
                onClick={reset}
                aria-label={t("removeFileAriaLabel", { name: selected.name })}
                className="flex shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : null}

          {error ? <p className="caption text-destructive">{error}</p> : null}
          {message ? <p className="caption text-muted-foreground">{message}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {t("close")}
          </Button>
          <Button type="button" onClick={handleImport} disabled={isPending || !selected}>
            {isPending ? t("importing") : t("import")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
