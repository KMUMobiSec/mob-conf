"use client";

import { Download, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ValidYear } from "@/constants/config";
import { importBanquetFromRegistrations } from "@/modules/admin/banquet-survey/actions";

export function ImportRegistrationsButton({ year }: { year: ValidYear }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runImport() {
    setOpen(false);
    setMessage(null);
    startTransition(async () => {
      const result = await importBanquetFromRegistrations({ year });
      setMessage(
        result.ok
          ? `Imported ${result.imported}; skipped ${result.skipped}.`
          : (result.error ?? "Could not import registrations."),
      );
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => setOpen(true)} disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        Import from registrations
      </Button>
      {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import from registrations</AlertDialogTitle>
            <AlertDialogDescription>
              This adds everyone registered for MOBISEC {year} (with an email) as banquet invitees.
              People already in this list are skipped, so it is safe to run more than once.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button type="button" onClick={runImport} disabled={isPending}>
              Import
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
