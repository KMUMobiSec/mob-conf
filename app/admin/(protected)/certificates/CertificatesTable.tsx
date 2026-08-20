"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Download,
  Loader2,
  Mail,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ValidYear } from "@/constants/config";
import { sendCertificate } from "@/modules/admin/certificates/actions";
import type { CertificateRecipient } from "@/modules/admin/certificates/lib/queries";
import { CustomCertificateDialog } from "./CustomCertificateDialog";

type SortColumn = "name" | "email" | "affiliation" | "role";
type SortDirection = "asc" | "desc";
type SendStatus = "sent" | "error";

interface BulkResultRow {
  id: string;
  name: string;
  email: string | null;
  status: SendStatus;
  message?: string;
}

const PAGE_SIZE = 20;

export function CertificatesTable({
  year,
  recipients,
}: {
  year: ValidYear;
  recipients: CertificateRecipient[];
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "author" | "participant">("all");
  const [sentFilter, setSentFilter] = useState<"all" | "sent" | "unsent">("all");
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Certificate role for author-eligible recipients. Authors default to "author"; non-authors are
  // always participants and aren't tracked here.
  const [roleChoice, setRoleChoice] = useState<Record<string, "author" | "participant">>({});
  // Chosen paper title for authors of multiple papers (keyed by recipient id).
  const [chosenTitle, setChosenTitle] = useState<Record<string, string>>({});

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, SendStatus>>({});

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);

  const [showBulk, setShowBulk] = useState(false);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{
    total: number;
    completed: number;
    results: BulkResultRow[];
  } | null>(null);

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = recipients.filter((r) => {
      if (roleFilter === "author" && !r.isAuthor) return false;
      if (roleFilter === "participant" && r.isAuthor) return false;
      // Sent = emailed in a prior session (DB) or during this session (local status).
      const sent = r.certificateEmailSentAt != null || status[r.id] === "sent";
      if (sentFilter === "sent" && !sent) return false;
      if (sentFilter === "unsent" && sent) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.email?.toLowerCase().includes(q) ?? false) ||
        (r.affiliation?.toLowerCase().includes(q) ?? false) ||
        r.paperTitles.some((t) => t.toLowerCase().includes(q))
      );
    });
    const value = (r: CertificateRecipient): string => {
      switch (sortColumn) {
        case "name":
          return r.name.toLowerCase();
        case "email":
          return r.email?.toLowerCase() ?? "";
        case "affiliation":
          return r.affiliation?.toLowerCase() ?? "";
        case "role":
          return r.isAuthor ? "author" : "participant";
      }
    };
    return [...filtered].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      if (av < bv) return sortDirection === "asc" ? -1 : 1;
      if (av > bv) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [recipients, search, roleFilter, sentFilter, status, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filteredSorted.slice(startIndex, startIndex + PAGE_SIZE);

  function toggleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(pageRows.map((r) => r.id)) : new Set());
  }

  /** Whether the author certificate should be generated for this row. */
  function wantsAuthorCert(r: CertificateRecipient): boolean {
    return r.isAuthor && (roleChoice[r.id] ?? "author") === "author";
  }

  function downloadUrl(r: CertificateRecipient): string {
    const params = new URLSearchParams({ year: String(year), id: r.id });
    if (wantsAuthorCert(r)) {
      params.set("author", "true");
      const title = chosenTitle[r.id];
      if (title && r.paperTitles.length > 1) params.set("title", title);
    }
    return `/admin/certificates/download?${params.toString()}`;
  }

  async function handleDownload(r: CertificateRecipient) {
    setDownloadingId(r.id);
    setError(null);
    try {
      const response = await fetch(downloadUrl(r));
      if (!response.ok) throw new Error(await response.text());
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ebision-${year}-certificate-${r.name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download certificate.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleSend(r: CertificateRecipient) {
    setSendingId(r.id);
    setError(null);
    setSuccess(null);
    try {
      const result = await sendCertificate({
        year,
        id: r.id,
        asAuthor: wantsAuthorCert(r),
        paperTitle: r.paperTitles.length > 1 ? chosenTitle[r.id] : undefined,
      });
      if (!result.ok) {
        setStatus((s) => ({ ...s, [r.id]: "error" }));
        setError(result.error ?? "Failed to send certificate.");
        return;
      }
      setStatus((s) => ({ ...s, [r.id]: "sent" }));
      setSuccess(`Certificate sent to ${r.email}.`);
      window.setTimeout(() => setSuccess(null), 5000);
    } catch {
      setStatus((s) => ({ ...s, [r.id]: "error" }));
      setError("Failed to send certificate.");
    } finally {
      setSendingId(null);
    }
  }

  async function handleBulkSend() {
    const selected = recipients.filter((r) => selectedIds.has(r.id));
    if (selected.length === 0) return;

    setShowBulk(true);
    setIsBulkSending(true);
    setBulkProgress({ total: selected.length, completed: 0, results: [] });

    for (const r of selected) {
      let row: BulkResultRow;
      try {
        const result = await sendCertificate({
          year,
          id: r.id,
          asAuthor: wantsAuthorCert(r),
          paperTitle: r.paperTitles.length > 1 ? chosenTitle[r.id] : undefined,
        });
        row = {
          id: r.id,
          name: r.name,
          email: r.email,
          status: result.ok ? "sent" : "error",
          message: result.error,
        };
      } catch {
        row = {
          id: r.id,
          name: r.name,
          email: r.email,
          status: "error",
          message: "Could not send.",
        };
      }
      setStatus((s) => ({ ...s, [r.id]: row.status }));
      setBulkProgress((prev) =>
        prev ? { ...prev, completed: prev.completed + 1, results: [...prev.results, row] } : prev,
      );
    }

    setIsBulkSending(false);
    setSelectedIds(new Set());
  }

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selectedIds.has(r.id));

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-500 bg-green-50 text-green-800 dark:bg-green-950/40">
          <Mail className="h-4 w-4 text-green-600" />
          <AlertTitle>Sent</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Toolbar: search + filters + Custom on the left, bulk-send on the right when rows are picked. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, email, affiliation, paper…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v as typeof roleFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="author">Authors</SelectItem>
              <SelectItem value="participant">Participants</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sentFilter}
            onValueChange={(v) => {
              setSentFilter(v as typeof sentFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="unsent">Not sent</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setShowCustom(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Custom
          </Button>
        </div>
        {selectedIds.size > 0 && (
          <Button onClick={handleBulkSend} disabled={isBulkSending} className="w-full sm:w-auto">
            {isBulkSending ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 shrink-0" />
            )}
            Send to {selectedIds.size} selected
          </Button>
        )}
      </div>

      {filteredSorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          {search || roleFilter !== "all" || sentFilter !== "all"
            ? "No registrants match your filters."
            : "No registrants for this year."}
        </div>
      ) : (
        // Fill-height table shell: the inner div is the ONLY scroller (both axes), so the page
        // itself never scrolls. Pagination is pinned below the scroll area.
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border">
          <div className="min-h-0 flex-1 overflow-auto *:data-[slot=table-container]:overflow-visible">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allOnPageSelected}
                      onCheckedChange={(c) => toggleSelectAll(c === true)}
                      aria-label="Select all on page"
                    />
                  </TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>
                    <SortButton column="role" label="Role" onSort={toggleSort}>
                      <SortIcon column="role" />
                    </SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton column="name" label="Name" onSort={toggleSort}>
                      <SortIcon column="name" />
                    </SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton column="email" label="Email" onSort={toggleSort}>
                      <SortIcon column="email" />
                    </SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton column="affiliation" label="Affiliation" onSort={toggleSort}>
                      <SortIcon column="affiliation" />
                    </SortButton>
                  </TableHead>
                  <TableHead className="w-64">Paper</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((r) => {
                  const rowStatus = status[r.id];
                  const isSending = sendingId === r.id;
                  const noEmail = !r.email;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(r.id)}
                          onCheckedChange={(c) => toggleSelect(r.id, c === true)}
                          aria-label={`Select ${r.name}`}
                          disabled={noEmail}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(r)}
                            disabled={downloadingId === r.id || isSending}
                          >
                            {downloadingId === r.id ? (
                              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 shrink-0" />
                            )}
                          </Button>
                          <Button
                            variant={rowStatus === "error" ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => handleSend(r)}
                            disabled={isSending || noEmail}
                            className={
                              rowStatus === "sent"
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : ""
                            }
                            title={noEmail ? "No email on file" : undefined}
                          >
                            {isSending ? (
                              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                            ) : rowStatus === "sent" ? (
                              <Check className="h-4 w-4 shrink-0" />
                            ) : rowStatus === "error" ? (
                              <X className="h-4 w-4 shrink-0" />
                            ) : (
                              <Mail className="h-4 w-4 shrink-0" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {r.isAuthor ? (
                          // Author-eligible people can receive either certificate; the choice here
                          // drives which template is generated (and the paper column below).
                          <Select
                            value={roleChoice[r.id] ?? "author"}
                            onValueChange={(v) =>
                              setRoleChoice((prev) => ({
                                ...prev,
                                [r.id]: v as "author" | "participant",
                              }))
                            }
                          >
                            <SelectTrigger className="h-8 w-33">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="author">Author</SelectItem>
                              <SelectItem value="participant">Participant</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-muted-foreground">Participant</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>
                        {r.email ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={r.affiliation ?? ""}>
                        {r.affiliation ?? "—"}
                      </TableCell>
                      {/* Fixed width so the row height/column width stays constant whether this shows
                          the multi-paper dropdown, a single title, or a dash. */}
                      <TableCell className="w-64 max-w-64">
                        {wantsAuthorCert(r) ? (
                          r.paperTitles.length > 1 ? (
                            <Select
                              value={chosenTitle[r.id] ?? r.paperTitles[0]}
                              onValueChange={(v) =>
                                setChosenTitle((prev) => ({ ...prev, [r.id]: v }))
                              }
                            >
                              <SelectTrigger className="h-8 w-full text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {r.paperTitles.map((t) => (
                                  <SelectItem key={t} value={t} className="text-xs">
                                    {t}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="block truncate text-xs" title={r.paperTitles[0]}>
                              {r.paperTitles[0]}
                            </span>
                          )
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Footer: registrant count on the left (always), pagination controls when multi-page. */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 md:flex-row">
            <p className="text-sm text-muted-foreground">
              {totalPages > 1
                ? `Showing ${startIndex + 1}–${Math.min(startIndex + PAGE_SIZE, filteredSorted.length)} of ${filteredSorted.length} registrant${filteredSorted.length !== 1 ? "s" : ""}`
                : `${filteredSorted.length} registrant${filteredSorted.length !== 1 ? "s" : ""}`}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <CustomCertificateDialog
        year={year}
        open={showCustom}
        onOpenChange={setShowCustom}
        onSuccess={(msg) => {
          setSuccess(msg);
          window.setTimeout(() => setSuccess(null), 5000);
        }}
        onError={setError}
      />

      <Dialog
        open={showBulk}
        onOpenChange={(open) => {
          if (!isBulkSending && !open) {
            setShowBulk(false);
            setBulkProgress(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isBulkSending ? "Sending certificates…" : "Bulk send complete"}
            </DialogTitle>
            <DialogDescription>
              {bulkProgress
                ? isBulkSending
                  ? `Sent ${bulkProgress.completed} of ${bulkProgress.total}…`
                  : `${bulkProgress.results.filter((x) => x.status === "sent").length} of ${bulkProgress.total} sent successfully.`
                : null}
            </DialogDescription>
          </DialogHeader>
          {bulkProgress && (
            <DialogBody className="flex flex-col gap-4">
              <div className="h-2.5 w-full rounded-full bg-muted">
                <div
                  className="h-2.5 rounded-full bg-primary transition-all"
                  style={{ width: `${(bulkProgress.completed / bulkProgress.total) * 100}%` }}
                />
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {bulkProgress.results.map((x) => (
                  <div
                    key={x.id}
                    className={`flex items-center gap-3 rounded-md p-2 ${
                      x.status === "sent"
                        ? "bg-green-50 text-green-800 dark:bg-green-950/40"
                        : "bg-red-50 text-red-800 dark:bg-red-950/40"
                    }`}
                  >
                    {x.status === "sent" ? (
                      <Check className="h-4 w-4 shrink-0 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 shrink-0 text-red-600" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{x.name}</p>
                      <p className="truncate text-xs">{x.email ?? "no email"}</p>
                      {x.message && <p className="mt-1 text-xs text-red-600">{x.message}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </DialogBody>
          )}
          <DialogFooter>
            <Button
              onClick={() => {
                setShowBulk(false);
                setBulkProgress(null);
              }}
              disabled={isBulkSending}
            >
              {isBulkSending ? "Please wait…" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SortButton({
  column,
  label,
  onSort,
  children,
}: {
  column: SortColumn;
  label: string;
  onSort: (column: SortColumn) => void;
  children: React.ReactNode;
}) {
  return (
    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => onSort(column)}>
      <span className="flex items-center gap-2">
        {label}
        {children}
      </span>
    </Button>
  );
}
