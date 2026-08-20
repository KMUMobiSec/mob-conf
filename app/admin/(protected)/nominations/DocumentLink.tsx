"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { getDocumentSignedUrl } from "@/modules/admin/nominations/actions";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentLink({
  nominationId,
  path,
  name,
  size,
}: {
  nominationId: string;
  path: string;
  name: string;
  size: number;
}) {
  const t = useTranslations("Admin.nominations.actions");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setLoading(true);
    setError(null);
    const result = await getDocumentSignedUrl(nominationId, path);
    setLoading(false);
    if (result.ok && result.url) {
      window.open(result.url, "_blank", "noopener,noreferrer");
    } else {
      setError(result.error ?? t("openFileError"));
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={open}
        disabled={loading}
        className="flex w-full items-center gap-2 rounded-md border border-border bg-muted/40 py-2 pl-2.5 pr-3 text-left text-sm transition-colors hover:border-primary hover:bg-accent disabled:opacity-60"
      >
        <FileText className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">{name}</span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {formatSize(size)}
        </span>
        {loading ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <Download className="size-4 shrink-0 text-primary" />
        )}
      </button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
