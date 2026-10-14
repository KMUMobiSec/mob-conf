"use client";

import { ChevronDown, Loader2, Mail, Pencil, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useMemo, useState, useTransition } from "react";
import {
  AlertDialog,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ValidYear } from "@/constants/config";
import {
  resendBanquetConfirmation,
  resendBanquetInvitation,
  sendAllBanquetConfirmations,
  sendAllBanquetInvitations,
  sendBanquetConfirmations,
  sendBanquetInvitations,
} from "@/modules/admin/banquet-survey/actions";
import {
  selectAllBanquetRows,
  toggleBanquetSelection,
} from "@/modules/admin/banquet-survey/lib/selection";
import { allergenLabel } from "@/modules/landing/banquet-survey/lib/constants";
import { TablePagination } from "../TablePagination";
import { EditResponseDialog } from "./EditResponseDialog";

export interface BanquetResponseRow {
  id: string;
  year: number;
  name: string;
  affiliation: string | null;
  email: string;
  attending: boolean;
  respondedAt: string | null;
  allergens: string[];
  allergenOther: string | null;
  message: string | null;
  emailsSentCount: number;
  confirmationSentAt: string | null;
  invitationsSentCount: number;
  invitationSentAt: string | null;
}

type BulkKind = "invite-all" | "confirm-all";

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Placeholder() {
  return <span className="text-muted-foreground">-</span>;
}

function StatusBadge({ row }: { row: BanquetResponseRow }) {
  if (!row.respondedAt) return <Badge variant="outline">Invited</Badge>;
  return row.attending ? (
    <Badge>Attending</Badge>
  ) : (
    <Badge variant="secondary">Not attending</Badge>
  );
}

const BULK_COPY: Record<BulkKind, { title: string; description: (year: number) => string }> = {
  "invite-all": {
    title: "Send invitation to all invited",
    description: (year) =>
      `This emails a banquet invitation to every invited person for MOBISEC ${year} who has not yet responded.`,
  },
  "confirm-all": {
    title: "Send confirmation to all responded",
    description: (year) =>
      `This emails a confirmation to every person who has responded to the MOBISEC ${year} banquet survey.`,
  },
};

export function BanquetResponsesTable({
  rows,
  year,
  page,
  pageSize,
  total,
  params,
  summary,
}: {
  rows: BanquetResponseRow[];
  year: ValidYear;
  page: number;
  pageSize: number;
  total: number;
  params: Record<string, string | undefined>;
  summary: ReactNode;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [pendingBulk, setPendingBulk] = useState<BulkKind | null>(null);
  const [pendingRowId, setPendingRowId] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<BanquetResponseRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const allSelected = rowIds.length > 0 && selected.size === rowIds.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleOne(id: string, checked: boolean) {
    setSelected((current) => toggleBanquetSelection(current, id, checked));
  }

  function toggleAll(checked: boolean) {
    setSelected(selectAllBanquetRows(rowIds, checked));
  }

  function runSend(
    action: () => Promise<{ sent: number; failures: unknown[]; error?: string }>,
    {
      clearSelection = false,
      rowId = null,
    }: { clearSelection?: boolean; rowId?: string | null } = {},
  ) {
    setMessage(null);
    setPendingRowId(rowId);
    startTransition(async () => {
      const result = await action();
      // Surface a top-level error (e.g. an expired session) instead of a misleading
      // "Sent 0; failed 0."
      setMessage(
        result.error ? result.error : `Sent ${result.sent}; failed ${result.failures.length}.`,
      );
      if (clearSelection && !result.error) setSelected(new Set());
      setPendingRowId(null);
      router.refresh();
    });
  }

  function resendOne(row: BanquetResponseRow) {
    // Invited people get the invitation; responders get the confirmation.
    const action = row.respondedAt
      ? () => resendBanquetConfirmation({ year, id: row.id })
      : () => resendBanquetInvitation({ year, id: row.id });
    runSend(action, { rowId: row.id });
  }

  function sendInvitationsToSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    runSend(() => sendBanquetInvitations({ year, ids }), { clearSelection: true });
  }

  function sendConfirmationsToSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    runSend(() => sendBanquetConfirmations({ year, ids }), { clearSelection: true });
  }

  function confirmBulk() {
    const kind = pendingBulk;
    setPendingBulk(null);
    if (!kind) return;
    const action =
      kind === "invite-all"
        ? () => sendAllBanquetInvitations({ year })
        : () => sendAllBanquetConfirmations({ year });
    runSend(action, { clearSelection: true });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
        No banquet responses match this view. Use Import from registrations to add invitees.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {message ? <span className="text-foreground">{message}</span> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isPending}>
                <Send className="size-4" />
                Send invitation
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={selected.size === 0} onSelect={sendInvitationsToSelected}>
                To selected ({selected.size})
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setPendingBulk("invite-all")}>
                To all invited
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isPending}>
                <Mail className="size-4" />
                Resend confirmation
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={selected.size === 0}
                onSelect={sendConfirmationsToSelected}
              >
                To selected ({selected.size})
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setPendingBulk("confirm-all")}>
                To all responded
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border">
        <div className="min-h-0 flex-1 overflow-auto *:data-[slot=table-container]:overflow-visible">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={someSelected ? "indeterminate" : allSelected}
                    onCheckedChange={(checked) => toggleAll(checked === true)}
                    aria-label="Select all responses"
                  />
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Affiliation</TableHead>
                <TableHead>Allergens</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Emails</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const allergens = row.allergens.map(allergenLabel).join(", ");
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(row.id)}
                        onCheckedChange={(checked) => toggleOne(row.id, checked === true)}
                        aria-label={`Select ${row.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge row={row} />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{row.name}</div>
                    </TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.affiliation || <Placeholder />}</TableCell>
                    <TableCell>
                      {allergens ? <span className="text-sm">{allergens}</span> : <Placeholder />}
                    </TableCell>
                    <TableCell>
                      {row.message ? (
                        <span className="block max-w-[16rem] truncate text-sm" title={row.message}>
                          {row.message}
                        </span>
                      ) : (
                        <Placeholder />
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      <div>
                        Invite: {row.invitationsSentCount}
                        {row.invitationSentAt ? ` (${formatDate(row.invitationSentAt)})` : ""}
                      </div>
                      <div>
                        Confirm: {row.emailsSentCount}
                        {row.confirmationSentAt ? ` (${formatDate(row.confirmationSentAt)})` : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRow(row)}
                          disabled={isPending}
                        >
                          <Pencil className="size-4" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resendOne(row)}
                          disabled={isPending}
                        >
                          {pendingRowId === row.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Mail className="size-4" />
                          )}
                          {row.respondedAt ? "Resend confirmation" : "Send invitation"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          path="/admin/banquet-survey"
          params={params}
          summary={summary}
          leading={
            <span className="text-sm font-medium text-foreground">{selected.size} selected</span>
          }
        />
      </div>

      <AlertDialog
        open={pendingBulk !== null}
        onOpenChange={(open) => !open && setPendingBulk(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingBulk ? BULK_COPY[pendingBulk].title : ""}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingBulk ? BULK_COPY[pendingBulk].description(year) : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button type="button" onClick={confirmBulk} disabled={isPending}>
              Send
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditResponseDialog
        row={editingRow}
        year={year}
        open={editingRow !== null}
        onOpenChange={(open) => !open && setEditingRow(null)}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
