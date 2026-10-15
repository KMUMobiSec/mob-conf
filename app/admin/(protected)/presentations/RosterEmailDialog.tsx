"use client";

import { FileUp, Loader2, Mail, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ValidYear } from "@/constants/config";
import {
  type RosterAudience,
  sendPresentationRosterBlast,
  sendTestPresentationRosterBlast,
} from "@/modules/admin/presentations/lib/roster-actions";
import type { RosterStatusRow } from "@/modules/admin/presentations/lib/roster-queries";
import { type RecipientEntry, RecipientPicker } from "../email-blast/RecipientPicker";
import { RichTextEditor } from "../email-blast/RichTextEditor";

const DEFAULT_SUBJECT = "MOBISEC 2026 Participants Guide & Presentation Submission";

const DEFAULT_BODY = `<p>Dear MOBISEC 2026 Presenters,</p><p>Please find attached the MOBISEC 2026 Participants Guide.</p><p>Kindly prepare an 18-minute presentation followed by a 2-minute Q&amp;A. Presentation materials should be submitted by July 2, 2026 (KST/JST) through the link below:</p><p><a href="https://mobisec-conference.com/2026/presentation-upload" target="_blank" rel="noopener noreferrer">https://mobisec-conference.com/2026/presentation-upload</a></p><p>Please also refer to the MOBISEC 2026 program table for your presentation schedule:</p><p><a href="https://easychair.org/smart-program/MOBISEC2026/" target="_blank" rel="noopener noreferrer">https://easychair.org/smart-program/MOBISEC2026/</a></p><p>If you have any corrections or inquiries regarding the program, please feel free to contact us.</p><p>Thank you for your cooperation.</p><p>Best regards,<br>MOBISEC Organizing Committee</p>`;

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

interface SendResult {
  ok: boolean;
  error?: string;
  sent: number;
  failed: { email: string; error: string }[];
  skipped: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function fileToBase64(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}

export function RosterEmailDialog({ year, rows }: { year: ValidYear; rows: RosterStatusRow[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [html, setHtml] = useState(DEFAULT_BODY);
  const [pendingOnly, setPendingOnly] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [attachment, setAttachment] = useState<{
    name: string;
    size: number;
    base64: string;
  } | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audience: RosterAudience = pendingOnly ? "pending" : "all";
  const audienceRows = useMemo(
    () => (pendingOnly ? rows.filter((row) => row.presentationId === null) : rows),
    [rows, pendingOnly],
  );
  const recipients: RecipientEntry[] = useMemo(
    () =>
      audienceRows.map((row) => ({
        id: row.rosterId,
        idNumber: null,
        name: `${row.author} — ${row.paperNumber}`,
        email: row.contactEmail,
      })),
    [audienceRows],
  );

  // Default to everyone currently in the active audience; switching audiences re-selects its full set.
  useEffect(() => {
    setSelected(new Set(audienceRows.filter((row) => row.contactEmail).map((row) => row.rosterId)));
  }, [audienceRows]);

  const bodyEmpty = html.trim() === "" || html.trim() === "<p></p>";

  function reset() {
    setResult(null);
    setMessage(null);
    setError(null);
  }

  async function handleAttachment(file: File) {
    setAttachmentError(null);
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachmentError("Attachment must be 15 MB or smaller.");
      return;
    }
    const base64 = await fileToBase64(file);
    setAttachment({ name: file.name, size: file.size, base64 });
  }

  function requestBlast() {
    reset();
    if (subject.trim() === "") {
      setError("Add a subject before sending.");
      return;
    }
    if (selected.size === 0) {
      setError("Select at least one recipient.");
      return;
    }
    if (bodyEmpty) {
      setError("Write a message before sending.");
      return;
    }
    setConfirmOpen(true);
  }

  function runBlast() {
    reset();
    startTransition(async () => {
      const res = await sendPresentationRosterBlast({
        year,
        subject,
        html,
        rosterIds: Array.from(selected),
        audience,
        attachment: attachment
          ? { filename: attachment.name, contentBase64: attachment.base64 }
          : undefined,
      });
      setConfirmOpen(false);
      if (!res.ok && res.error) setError(res.error);
      setResult(res);
    });
  }

  function runTest() {
    reset();
    startTransition(async () => {
      const res = await sendTestPresentationRosterBlast({
        year,
        subject,
        html,
        attachment: attachment
          ? { filename: attachment.name, contentBase64: attachment.base64 }
          : undefined,
      });
      if (res.ok) setMessage("Test email sent.");
      else setError(res.error ?? "Could not send the test email.");
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
        <Button>
          <Mail className="size-4" />
          Email presenters
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Email the presenter roster</DialogTitle>
          <DialogDescription>
            Sent from the no-reply address, wrapped in the MOBISEC email template. Use “Send test to
            me” to preview the final email before sending to presenters.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="roster-blast-subject">Subject</Label>
                <Input
                  id="roster-blast-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  maxLength={200}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label id="roster-blast-body-label">Message</Label>
                <RichTextEditor
                  value={html}
                  onChange={setHtml}
                  ariaLabelledby="roster-blast-body-label"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Attachment</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleAttachment(file);
                    event.target.value = "";
                  }}
                />
                {attachment ? (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 py-1.5 pl-2.5 pr-2 text-sm">
                    <FileUp className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatSize(attachment.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      aria-label={`Remove ${attachment.name}`}
                      className="flex shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileUp className="size-4" />
                    Attach Participants Guide
                  </Button>
                )}
                {attachmentError ? (
                  <p className="caption text-destructive">{attachmentError}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={requestBlast} disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Send blast
                </Button>
                <Button variant="outline" onClick={runTest} disabled={isPending || bodyEmpty}>
                  <Mail className="size-4" />
                  Send test to me
                </Button>
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {message ? <p className="text-sm text-foreground">{message}</p> : null}
              {result ? (
                <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                  <p className="font-medium text-foreground">
                    Sent {result.sent} · failed {result.failed.length} · skipped {result.skipped}
                  </p>
                  {result.failed.length > 0 ? (
                    <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
                      {result.failed.slice(0, 10).map((failure) => (
                        <li key={failure.email}>
                          {failure.email} — {failure.error}
                        </li>
                      ))}
                      {result.failed.length > 10 ? (
                        <li>…and {result.failed.length - 10} more</li>
                      ) : null}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <Label htmlFor="roster-audience-switch" className="flex flex-col gap-0.5">
                  <span>Not-yet-uploaded only</span>
                  <span className="caption text-muted-foreground">
                    {pendingOnly ? "Pending presenters" : "Everyone on the roster"}
                  </span>
                </Label>
                <Switch
                  id="roster-audience-switch"
                  checked={pendingOnly}
                  onCheckedChange={setPendingOnly}
                />
              </div>
              <Label>Recipients</Label>
              <RecipientPicker recipients={recipients} selected={selected} onChange={setSelected} />
            </div>
          </div>
        </DialogBody>
        <DialogFooter />
      </DialogContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send this email blast?</AlertDialogTitle>
            <AlertDialogDescription>
              This will email <strong>{selected.size}</strong> selected presenter(s) from the
              no-reply address for MOBISEC {year}. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={runBlast} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Send to {selected.size}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
