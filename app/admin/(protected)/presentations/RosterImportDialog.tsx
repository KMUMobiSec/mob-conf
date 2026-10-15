"use client";

import { Download, FileSpreadsheet, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import * as XLSX from "xlsx";
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
import { importPresentationRoster } from "@/modules/admin/presentations/lib/roster-actions";

const ACCEPT =
  ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const HEADER_ALIASES: Record<string, string> = {
  papernumber: "paperNumber",
  "paper number": "paperNumber",
  "paper no": "paperNumber",
  "paper no.": "paperNumber",
  title: "title",
  author: "author",
  authors: "author",
  contactemail: "contactEmail",
  "contact email": "contactEmail",
  email: "contactEmail",
};

/** Parse a workbook's first sheet into roster row objects, matching headers loosely. */
function parseWorkbook(buffer: ArrayBuffer): Record<string, string>[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const grid: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (grid.length < 2) return [];

  const headerRow = grid[0].map((cell) =>
    String(cell ?? "")
      .trim()
      .toLowerCase(),
  );
  const keys = headerRow.map((h) => HEADER_ALIASES[h] ?? null);

  const rows: Record<string, string>[] = [];
  for (const rawRow of grid.slice(1)) {
    const row: Record<string, string> = {};
    keys.forEach((key, index) => {
      if (!key) return;
      row[key] = String(rawRow[index] ?? "").trim();
    });
    if (Object.values(row).some((v) => v.length > 0)) rows.push(row);
  }
  return rows;
}

export function RosterImportDialog({ year }: { year: ValidYear }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<{
    name: string;
    size: number;
    rows: Record<string, string>[];
  } | null>(null);
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
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const rows = parseWorkbook(buffer);
      if (rows.length === 0) {
        setError(
          "No rows found. Make sure the first row has the Paper Number/Title/Author/Contact Email headers.",
        );
        return;
      }
      setSelected({ name: file.name, size: file.size, rows });
    } catch {
      setError("Couldn't read that file. Make sure it's a .xlsx or .xls spreadsheet.");
    }
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
      const result = await importPresentationRoster({ year, rows: selected.rows });
      if (!result.ok && result.error) {
        setError(result.error);
        return;
      }
      setMessage(
        `Imported: ${result.created} added, ${result.updated} updated` +
          (result.skipped > 0 ? `, ${result.skipped} row(s) skipped.` : "."),
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
          Import roster
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import presenter roster</DialogTitle>
          <DialogDescription>
            Upload a spreadsheet with Paper Number, Title, Author, and Contact Email columns.
            Existing rows are matched and updated by paper number; new paper numbers are added.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          <a
            href={`/admin/presentations/roster-template?year=${year}`}
            className="flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Download className="size-3.5" />
            Download the blank template
          </a>

          <label
            htmlFor="roster-file-input"
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(event) => {
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
              id="roster-file-input"
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              onChange={handlePick}
              className="sr-only"
            />
            <span className="flex size-10 items-center justify-center rounded-md bg-accent text-primary">
              <FileSpreadsheet className="size-5" />
            </span>
            <span className="text-sm font-semibold text-foreground">
              {dragging ? "Drop it here" : "Choose a spreadsheet or drag it here"}
            </span>
            <span className="text-xs text-muted-foreground">.xlsx or .xls</span>
          </label>

          {selected ? (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 py-1.5 pl-2.5 pr-2 text-sm">
              <FileSpreadsheet className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{selected.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {selected.rows.length} row{selected.rows.length === 1 ? "" : "s"} ·{" "}
                {formatSize(selected.size)}
              </span>
              <button
                type="button"
                onClick={reset}
                aria-label={`Remove ${selected.name}`}
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
            Close
          </Button>
          <Button type="button" onClick={handleImport} disabled={isPending || !selected}>
            {isPending ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
