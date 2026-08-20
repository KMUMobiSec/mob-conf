"use client";

import { Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { notifyWinners } from "@/modules/admin/nominations/actions";

export function NotifyWinnersButton({
  pendingCount,
  year,
}: {
  pendingCount: number;
  year?: number;
}) {
  const t = useTranslations("Admin.nominations.actions");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const scopeLabel = year ? `EBISION ${year}` : t("allYears");

  function confirm() {
    startTransition(async () => {
      const result = await notifyWinners(year);
      setOpen(false);
      if (result.ok) {
        setMessage(
          result.scheduled > 0
            ? t("notifyStarted", { count: result.scheduled })
            : t("noPendingWinners"),
        );
        router.refresh();
      } else {
        setMessage(result.error ?? t("notifyError"));
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        disabled={pendingCount === 0}
        onClick={() => {
          setMessage(null);
          setOpen(true);
        }}
      >
        <Mail className="size-4" />
        {t("notifyWinners")}
        {pendingCount > 0 ? ` (${pendingCount})` : ""}
      </Button>
      {message && (
        <span className="max-w-xs text-right text-xs text-muted-foreground">{message}</span>
      )}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("notifyWinners")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("notifyDescription", {
                totalEmails: pendingCount * 2,
                pendingCount,
                scope: scopeLabel,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{t("cancel")}</AlertDialogCancel>
            <Button type="button" onClick={confirm} disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("starting")}
                </>
              ) : (
                t("sendEmails")
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
