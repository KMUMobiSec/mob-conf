"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBanquetDetails } from "@/modules/admin/settings/actions";
import {
  BANQUET_DATE_FALLBACK,
  BANQUET_VENUE_FALLBACK,
} from "@/modules/landing/banquet-survey/lib/constants";

export function BanquetDetailsForm({
  banquetDate,
  banquetVenue,
}: {
  banquetDate: string | null;
  banquetVenue: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateBanquetDetails({
        date: String(formData.get("banquetDate") ?? ""),
        venue: String(formData.get("banquetVenue") ?? ""),
      });
      if (!result.ok) {
        setMessage({ kind: "error", text: result.error ?? "Could not save." });
        return;
      }
      setMessage({ kind: "ok", text: "Saved banquet details." });
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="banquet-date">Banquet date</Label>
          <Input
            key={banquetDate ?? ""}
            id="banquet-date"
            name="banquetDate"
            defaultValue={banquetDate ?? ""}
            placeholder={BANQUET_DATE_FALLBACK}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="banquet-venue">Banquet venue</Label>
          <Input
            key={banquetVenue ?? ""}
            id="banquet-venue"
            name="banquetVenue"
            defaultValue={banquetVenue ?? ""}
            placeholder={BANQUET_VENUE_FALLBACK}
          />
        </div>
      </div>
      <p className="caption text-muted-foreground">
        Shown in the banquet survey heading and confirmation email. When left blank, the survey uses
        the defaults {BANQUET_DATE_FALLBACK} and {BANQUET_VENUE_FALLBACK}.
      </p>
      {message ? (
        <p
          className={
            message.kind === "error" ? "caption text-destructive" : "caption text-muted-foreground"
          }
        >
          {message.text}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save banquet details"}
        </Button>
      </div>
    </form>
  );
}
