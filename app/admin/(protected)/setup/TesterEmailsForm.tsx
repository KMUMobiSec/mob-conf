"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateTesterEmails } from "@/modules/admin/settings/actions";
import { TEST_MODE_FALLBACK_EMAIL } from "@/modules/admin/settings/lib/test-mode";

export function TesterEmailsForm({ testerEmails }: { testerEmails: string[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateTesterEmails(String(formData.get("testerEmails") ?? ""));
      if (!result.ok) {
        setMessage({ kind: "error", text: result.error ?? "Could not save." });
        return;
      }
      const count = result.emails?.length ?? 0;
      setMessage({
        kind: "ok",
        text:
          count === 0
            ? `Saved. With no testers, test-mode email falls back to ${TEST_MODE_FALLBACK_EMAIL}.`
            : `Saved ${count} tester email${count === 1 ? "" : "s"}.`,
      });
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-2">
        <Label htmlFor="tester-emails">Tester email receivers</Label>
        <Textarea
          // Remount when the saved list changes so the field reflects the normalized value.
          key={testerEmails.join("\n")}
          id="tester-emails"
          name="testerEmails"
          rows={6}
          defaultValue={testerEmails.join("\n")}
          placeholder={"tester@example.com\nqa@example.com"}
          className="min-h-36 font-mono text-sm"
        />
        <p className="caption text-muted-foreground">
          One email per line (commas and semicolons also work). While check-in test mode is on, all
          check-in emails go to these addresses instead of the real attendee. If empty, they fall
          back to {TEST_MODE_FALLBACK_EMAIL}.
        </p>
        {message ? (
          <p
            className={
              message.kind === "error"
                ? "caption text-destructive"
                : "caption text-muted-foreground"
            }
          >
            {message.text}
          </p>
        ) : null}
      </div>
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save testers"}
        </Button>
      </div>
    </form>
  );
}
