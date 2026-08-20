"use client";

import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { resendWinnerEmails } from "@/modules/admin/nominations/actions";

export function ResendWinnerButton({ id }: { id: string }) {
  const t = useTranslations("Admin.nominations.actions");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onResend() {
    setMessage(null);
    setIsError(false);
    startTransition(async () => {
      const result = await resendWinnerEmails(id);
      if (result.ok) {
        setMessage(t("winnerEmailsSent", { count: result.sent }));
      } else if (result.error) {
        setIsError(true);
        setMessage(result.error);
      } else {
        setIsError(true);
        const failed = result.failures
          .map((f) => (f === "winner" ? t("winnerLabel") : t("nominatorLabel")))
          .join(", ");
        setMessage(t("winnerEmailsPartial", { sent: result.sent, failed }));
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="outline" onClick={onResend} disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t("sending")}
          </>
        ) : (
          <>
            <Send className="size-4" />
            {t("resendWinnerEmails")}
          </>
        )}
      </Button>
      {message && (
        <span className={isError ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
          {message}
        </span>
      )}
    </div>
  );
}
