"use client";

import { Loader2, Mail, Send } from "lucide-react";
import { useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ValidYear } from "@/constants/config";
import { sendEmailBlast, sendTestEmailBlast } from "@/modules/admin/email-blast/actions";
import { CsvImportDialog } from "../qr-check-ins/CsvImportDialog";
import { type RecipientEntry, RecipientPicker } from "./RecipientPicker";
import { RichTextEditor } from "./RichTextEditor";

const EMPTY_BODY = "<p></p>";

interface SendResult {
  ok: boolean;
  error?: string;
  sent: number;
  failed: { email: string; error: string }[];
  skipped: number;
}

export function EmailBlastComposer({
  year,
  recipients,
}: {
  year: ValidYear;
  recipients: RecipientEntry[];
}) {
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState(EMPTY_BODY);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bodyEmpty = subject.trim() === "" || html.trim() === "" || html.trim() === EMPTY_BODY;

  function reset() {
    setResult(null);
    setMessage(null);
    setError(null);
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
      const res = await sendEmailBlast({
        year,
        subject,
        html,
        recipientIds: Array.from(selected),
      });
      setConfirmOpen(false);
      if (!res.ok && res.error) setError(res.error);
      setResult(res);
    });
  }

  function runTest() {
    reset();
    startTransition(async () => {
      const res = await sendTestEmailBlast({ year, subject, html });
      if (res.ok) setMessage("Test email sent.");
      else setError(res.error ?? "Could not send the test email.");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="blast-subject">Subject</Label>
          <Input
            id="blast-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="MOBISEC 2026 — an update for you"
            maxLength={200}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          {/* The editor is a contenteditable region (not a labelable control), so associate the
              label by id via aria-labelledby rather than htmlFor. */}
          <Label id="blast-body-label">Message</Label>
          <RichTextEditor value={html} onChange={setHtml} ariaLabelledby="blast-body-label" />
          <p className="caption text-muted-foreground">
            Sent from the no-reply address and wrapped in the MOBISEC email template. Use “Send test
            to me” to preview the final email.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={requestBlast} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
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
            {result.skipped > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {result.skipped} selected recipient(s) had no valid email and were skipped.
              </p>
            ) : null}
            {result.failed.length > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
                {result.failed.slice(0, 10).map((failure) => (
                  <li key={failure.email}>
                    {failure.email} — {failure.error}
                  </li>
                ))}
                {result.failed.length > 10 ? <li>…and {result.failed.length - 10} more</li> : null}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>Recipients</Label>
          <CsvImportDialog year={year} />
        </div>
        <RecipientPicker recipients={recipients} selected={selected} onChange={setSelected} />
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send this email blast?</AlertDialogTitle>
            <AlertDialogDescription>
              This will email <strong>{selected.size}</strong> selected recipient(s) from the
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
    </div>
  );
}
