"use client";

import { Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendTestWinnerEmails } from "@/modules/admin/nominations/actions";

export function TestEmailButton({ year }: { year?: number }) {
  const t = useTranslations("Admin.nominations.actions");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    startTransition(async () => {
      setMessage(null);
      const result = await sendTestWinnerEmails(year);
      if (result.ok) {
        setMessage(t("testEmailsSent", { count: result.sent, to: result.to ?? "" }));
      } else if (result.failures.length > 0) {
        setMessage(t("failedToSendList", { failures: result.failures.join(", ") }));
      } else {
        setMessage(result.error ?? t("testEmailError"));
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="outline" onClick={send} disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {t("testEmail")}
      </Button>
      {message && (
        <span className="max-w-xs text-right text-xs text-muted-foreground">{message}</span>
      )}
    </div>
  );
}
