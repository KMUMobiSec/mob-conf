"use client";

import { RefreshCw, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { ValidYear } from "@/constants/config";
import { cn } from "@/lib/helpers/utils";
import { adminLocale } from "@/modules/admin/lib/intl";
import { formatIdNumber } from "@/modules/admin/qr-check-ins/lib/format";
import { TablePagination } from "../TablePagination";
import { useRegistrationsRealtime } from "./useRegistrationsRealtime";

export interface CheckInLogEntry {
  id: string;
  idNumber: number | null;
  name: string;
  affiliation: string | null;
  /** ISO check-in timestamp. */
  checkedInAt: string;
  checkedInBy: string | null;
}

function formatCheckInTime(locale: string, value: string): string {
  return new Date(value).toLocaleString(adminLocale(locale), {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function CheckInLogs({
  rows,
  year,
  page,
  pageSize,
  total,
  params,
}: {
  rows: CheckInLogEntry[];
  year: ValidYear;
  page: number;
  pageSize: number;
  total: number;
  params: Record<string, string | undefined>;
}) {
  const t = useTranslations("Admin.qrCheckIns.logs");
  const locale = useLocale();
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  // Live feed via Supabase Broadcast: a check-in (or a test-mode undo clearing it) pings this year's
  // channel and re-fetches the server-rendered log. Debounced so a burst collapses into one refetch,
  // with a focus/visibility catch-up; the manual Refresh button below stays as the explicit fallback.
  useRegistrationsRealtime(year, "checkin-logs");

  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-primary" aria-hidden />
          {t("autoUpdating")}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isRefreshing}
          aria-label={t("refreshAria")}
        >
          <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
          {t("refresh")}
        </Button>
      </div>

      {total === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border">
          <ul className="min-h-0 flex-1 divide-y divide-border overflow-auto">
            {rows.map((row) => (
              <li key={row.id} className="flex items-center gap-4 px-4 py-4 sm:gap-6">
                {/* Emphasized badge number — the dominant element of each entry. */}
                <div className="flex w-16 shrink-0 justify-center sm:w-20">
                  {row.idNumber != null ? (
                    <span className="text-4xl font-bold leading-none tabular-nums sm:text-5xl">
                      {formatIdNumber(row.idNumber)}
                    </span>
                  ) : (
                    <span className="text-2xl font-semibold leading-none text-muted-foreground">
                      —
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-foreground">{row.name}</div>
                  {row.affiliation ? (
                    <div className="truncate text-sm text-muted-foreground">{row.affiliation}</div>
                  ) : null}
                  <div
                    className={cn(
                      "mt-1 flex items-center gap-1.5 text-xs",
                      row.checkedInBy ? "text-muted-foreground" : "text-muted-foreground/70",
                    )}
                  >
                    <UserRound className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {t("scannedBy", { user: row.checkedInBy ?? t("unknownAccount") })}
                    </span>
                  </div>
                </div>

                <time
                  dateTime={row.checkedInAt}
                  className="shrink-0 whitespace-nowrap text-xs text-muted-foreground tabular-nums"
                >
                  {formatCheckInTime(locale, row.checkedInAt)}
                </time>
              </li>
            ))}
          </ul>
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            path="/admin/qr-check-ins"
            params={params}
            summary={t("summary", { total })}
          />
        </div>
      )}
    </div>
  );
}
