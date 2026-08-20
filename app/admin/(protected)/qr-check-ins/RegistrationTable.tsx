"use client";

import { ChevronDown, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ValidYear } from "@/constants/config";
import { adminLocale } from "@/modules/admin/lib/intl";
import {
  getRegistrationSendTargets,
  sendRegistrationQrPasses,
} from "@/modules/admin/qr-check-ins/actions";
import {
  selectAllRegistrationRows,
  toggleRegistrationSelection,
} from "@/modules/admin/qr-check-ins/lib/selection";
import { SEND_CHUNK_SIZE, SEND_THROTTLE_MS } from "@/modules/admin/qr-check-ins/lib/send-config";
import { FilterSelect } from "../FilterSelect";
import { SearchInput } from "../SearchInput";
import { TablePagination } from "../TablePagination";
import { AddRegistrationDialog } from "./AddRegistrationDialog";
import { CsvImportDialog } from "./CsvImportDialog";
import { RegistrationRowActions } from "./RegistrationRowActions";
import { useRegistrationsRealtime } from "./useRegistrationsRealtime";

export interface RegistrationTableRow {
  id: string;
  year: number;
  idNumber: number | null;
  email: string | null;
  name: string;
  affiliation: string | null;
  qrEmailSentAt: string | null;
  qrEmailSentCount: number;
  checkedInAt: string | null;
}

function formatDate(locale: string, value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleString(adminLocale(locale), {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RegistrationTable({
  rows,
  year,
  page,
  pageSize,
  total,
  checkedInTotal,
  params,
  testMode = false,
}: {
  rows: RegistrationTableRow[];
  year: ValidYear;
  page: number;
  pageSize: number;
  total: number;
  checkedInTotal: number;
  params: Record<string, string | undefined>;
  testMode?: boolean;
}) {
  const t = useTranslations("Admin.qrCheckIns.registrations");
  const locale = useLocale();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Bulk "Send to all" dialog state. Targets are fetched (whole year) when the dialog opens; the
  // send then runs client-side in throttled chunks so the progress bar can advance between chunks.
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkTargets, setBulkTargets] = useState<string[] | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkDone, setBulkDone] = useState(0);
  const [bulkResult, setBulkResult] = useState<{
    sent: number;
    failures: { id: string; email: string; error: string }[];
  } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const allSelected = rowIds.length > 0 && selected.size === rowIds.length;
  const someSelected = selected.size > 0 && !allSelected;
  const bulkTotal = bulkTargets?.length ?? 0;
  const bulkProgress = bulkTotal > 0 ? Math.round((bulkDone / bulkTotal) * 100) : 0;

  // Live updates via Supabase Broadcast: a scan setting `checked_in_at`, or a newly added/edited
  // registration, pings this year's channel and refreshes the table. Debounced + focus catch-up.
  useRegistrationsRealtime(year, "registrations");

  function toggleOne(id: string, checked: boolean) {
    setSelected((current) => toggleRegistrationSelection(current, id, checked));
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? selectAllRegistrationRows(rows, year) : new Set());
  }

  function sendSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setMessage(null);
    startTransition(async () => {
      const result = await sendRegistrationQrPasses({ year, ids });
      setMessage(t("sendSuccess", { sent: result.sent, failed: result.failures.length }));
      setSelected(new Set());
      router.refresh();
    });
  }

  async function openBulk() {
    setBulkResult(null);
    setBulkError(null);
    setBulkDone(0);
    setBulkTargets(null);
    setBulkOpen(true);
    setBulkLoading(true);
    const result = await getRegistrationSendTargets({ year });
    setBulkLoading(false);
    if (!result.ok) {
      setBulkError(result.error ?? t("bulkError"));
      return;
    }
    setBulkTargets(result.ids);
  }

  async function runBulk() {
    const targets = bulkTargets;
    if (!targets || targets.length === 0 || bulkRunning) return;
    setBulkRunning(true);
    setBulkResult(null);
    setBulkDone(0);
    let sent = 0;
    const failures: { id: string; email: string; error: string }[] = [];
    for (let i = 0; i < targets.length; i += SEND_CHUNK_SIZE) {
      const chunk = targets.slice(i, i + SEND_CHUNK_SIZE);
      const result = await sendRegistrationQrPasses({
        year,
        ids: chunk,
        throttleMs: SEND_THROTTLE_MS,
      });
      sent += result.sent;
      failures.push(...result.failures);
      setBulkDone(Math.min(i + chunk.length, targets.length));
    }
    setBulkRunning(false);
    setBulkResult({ sent, failures });
    router.refresh();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Consolidated toolbar — search + filter (left), actions (right); one row on desktop, wraps on
          mobile. Rendered before the empty state so search/filter stay usable when nothing matches. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3 flex-row sm:items-center">
          <SearchInput
            placeholder={t("searchPlaceholder")}
            ariaLabel={t("searchAriaLabel")}
            className="w-full sm:w-64"
          />
          <FilterSelect
            name="checkedIn"
            ariaLabel={t("filterStatusAriaLabel")}
            placeholder={t("allRegistrations")}
            triggerClassName="w-[170px]"
            options={[
              { value: "", label: t("allRegistrations") },
              { value: "1", label: t("checkedIn") },
              { value: "0", label: t("notCheckedIn") },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {message ? <span className="mr-1 text-sm text-foreground">{message}</span> : null}
          <AddRegistrationDialog year={year} />
          <CsvImportDialog year={year} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isPending || bulkRunning}>
                <Send className="size-4" />
                {t("sendMenu")}
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={selected.size === 0 || isPending || bulkRunning}
                onSelect={sendSelected}
              >
                {t("sendToSelected", { count: selected.size })}
              </DropdownMenuItem>
              <DropdownMenuItem disabled={isPending || bulkRunning} onSelect={openBulk}>
                {t("sendToEveryone")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {total === 0 ? (
        <div className="grid flex-1 place-items-center rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border">
          {/* One scroll container for the table, both axes: neutralize the shadcn table's own
            overflow-x wrapper so there's a single scrollbar, and min-h-0/flex-1 caps it to the
            space under the toolbar so the page body never scrolls. */}
          <div className="min-h-0 flex-1 overflow-auto *:data-[slot=table-container]:overflow-visible">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={someSelected ? "indeterminate" : allSelected}
                      onCheckedChange={(checked) => toggleAll(checked === true)}
                      aria-label={t("selectAllAriaLabel")}
                    />
                  </TableHead>
                  <TableHead className="w-16">{t("columns.id")}</TableHead>
                  <TableHead>{t("columns.attendee")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("columns.email")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("columns.affiliation")}</TableHead>
                  <TableHead>{t("columns.qrEmail")}</TableHead>
                  <TableHead>{t("columns.checkIn")}</TableHead>
                  <TableHead className="w-0 text-right">{t("columns.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(row.id)}
                        onCheckedChange={(checked) => toggleOne(row.id, checked === true)}
                        aria-label={t("selectOneAriaLabel", { name: row.name })}
                      />
                    </TableCell>
                    <TableCell>
                      {row.idNumber !== null ? (
                        <span className="font-mono text-lg font-semibold text-foreground tabular-nums">
                          {row.idNumber}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{row.name}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {row.email || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {row.affiliation || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      {row.qrEmailSentAt ? (
                        <div>
                          <Badge variant="secondary">{t("sent")}</Badge>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {formatDate(locale, row.qrEmailSentAt)} · {row.qrEmailSentCount}x
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{t("notSent")}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.checkedInAt ? (
                        <div>
                          <Badge>{t("checkedIn")}</Badge>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {formatDate(locale, row.checkedInAt)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{t("pending")}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <RegistrationRowActions
                          registration={{
                            id: row.id,
                            email: row.email,
                            name: row.name,
                            affiliation: row.affiliation,
                            checkedInAt: row.checkedInAt,
                          }}
                          year={year}
                          testMode={testMode}
                          disabled={bulkRunning}
                          onMessage={setMessage}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            path="/admin/qr-check-ins"
            params={params}
            summary={t("summary", { total, checkedInTotal })}
            leading={
              <span className="text-sm font-medium text-foreground">
                {t("selectedSummary", { count: selected.size })}
              </span>
            }
          />
        </div>
      )}

      <AlertDialog
        open={bulkOpen}
        onOpenChange={(open) => {
          // Don't let the dialog close mid-run; the send loop must keep going.
          if (!bulkRunning) setBulkOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bulkTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {bulkResult
                ? t("bulkDoneDescription")
                : bulkRunning
                  ? t("bulkSendingDescription")
                  : t("bulkConfirmDescription", { count: bulkTotal, year: String(year) })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {bulkLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("bulkLoading")}
            </div>
          ) : bulkError ? (
            <p className="text-sm text-destructive">{bulkError}</p>
          ) : bulkRunning || bulkResult ? (
            <div className="flex flex-col gap-2">
              <Progress value={bulkResult ? 100 : bulkProgress} />
              <p className="text-sm text-muted-foreground">
                {bulkResult
                  ? t("bulkSummary", { sent: bulkResult.sent, failed: bulkResult.failures.length })
                  : t("bulkProgress", { done: bulkDone, total: bulkTotal })}
              </p>
              {bulkResult && bulkResult.failures.length > 0 ? (
                <ul className="mt-1 max-h-40 list-disc overflow-auto pl-5 text-xs text-muted-foreground">
                  {bulkResult.failures.slice(0, 10).map((failure) => (
                    <li key={failure.id}>
                      {failure.email || "—"} — {failure.error}
                    </li>
                  ))}
                  {bulkResult.failures.length > 10 ? (
                    <li>{t("bulkMoreFailures", { count: bulkResult.failures.length - 10 })}</li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          ) : null}

          <AlertDialogFooter>
            {bulkResult ? (
              <AlertDialogAction onClick={() => setBulkOpen(false)}>
                {t("bulkClose")}
              </AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel disabled={bulkRunning}>{t("bulkCancel")}</AlertDialogCancel>
                <Button onClick={runBulk} disabled={bulkRunning || bulkLoading || bulkTotal === 0}>
                  {bulkRunning ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {t("bulkConfirm", { count: bulkTotal })}
                </Button>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
