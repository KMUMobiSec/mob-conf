"use client";

import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/helpers/utils";

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  /** Route the page links point at, e.g. "/admin/nominations". */
  path: string;
  /** Current filters to preserve across page navigation (empty/undefined dropped). */
  params?: Record<string, string | undefined>;
  /** Count text on the left (e.g. "247 nominations"). Falls back to a range. */
  summary?: ReactNode;
  /** Content shown at the start of the footer, before the summary — e.g. a "3 selected" status. */
  leading?: ReactNode;
}

function buildHref(path: string, params: Record<string, string | undefined>, page: number): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") sp.set(key, value);
  }
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

type PageEntry = { kind: "page"; value: number } | { kind: "ellipsis"; key: string };

/** Page numbers to render, collapsing long ranges to first/last + a window around current. */
function pageWindow(current: number, totalPages: number): PageEntry[] {
  const out: PageEntry[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= current - 1 && p <= current + 1)) {
      out.push({ kind: "page", value: p });
    } else if (out[out.length - 1]?.kind !== "ellipsis") {
      out.push({ kind: "ellipsis", key: p < current ? "start" : "end" });
    }
  }
  return out;
}

/** Table footer strip: count summary on the left, page navigation on the right. */
export function TablePagination({
  page,
  pageSize,
  total,
  path,
  params = {},
  summary,
  leading,
}: TablePaginationProps) {
  const t = useTranslations("Admin.pagination");
  const tCommon = useTranslations("Admin.common");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {leading}
        <p className="caption text-muted-foreground">
          {summary ?? t("showing", { from, to, total })}
        </p>
      </div>

      {totalPages > 1 && (
        <nav aria-label="pagination" className="flex items-center gap-1">
          <Link
            href={buildHref(path, params, page - 1)}
            aria-label={t("goToPrevious")}
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : undefined}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              page <= 1 && "pointer-events-none opacity-50",
            )}
          >
            <ChevronLeftIcon className="size-4" />
            <span className="hidden sm:inline">{tCommon("previous")}</span>
          </Link>

          {pageWindow(page, totalPages).map((entry) =>
            entry.kind === "ellipsis" ? (
              <span
                key={`ellipsis-${entry.key}`}
                aria-hidden
                className="flex size-8 items-center justify-center text-muted-foreground"
              >
                <MoreHorizontalIcon className="size-4" />
              </span>
            ) : (
              <Link
                key={entry.value}
                href={buildHref(path, params, entry.value)}
                aria-label={t("goToPage", { page: entry.value })}
                aria-current={entry.value === page ? "page" : undefined}
                className={cn(
                  buttonVariants({
                    variant: entry.value === page ? "outline" : "ghost",
                    size: "icon-sm",
                  }),
                )}
              >
                {entry.value}
              </Link>
            ),
          )}

          <Link
            href={buildHref(path, params, page + 1)}
            aria-label={t("goToNext")}
            aria-disabled={page >= totalPages}
            tabIndex={page >= totalPages ? -1 : undefined}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              page >= totalPages && "pointer-events-none opacity-50",
            )}
          >
            <span className="hidden sm:inline">{tCommon("next")}</span>
            <ChevronRightIcon className="size-4" />
          </Link>
        </nav>
      )}
    </div>
  );
}
