"use client";

import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { allergenLabel } from "../lib/constants";
import type { BanquetValues } from "../lib/schema";

export interface BanquetSnapshot {
  values: BanquetValues;
  banquetDate: string;
  banquetVenue: string;
  /** Whether a confirmation email was actually delivered to the submitter. */
  emailed: boolean;
}

function RecapRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border px-4 py-3 last:border-b-0 even:bg-muted/40 sm:grid-cols-[180px_1fr] sm:gap-4">
      <div className="text-sm font-semibold text-muted-foreground">{label}</div>
      <div className="break-words text-sm text-foreground">{children}</div>
    </div>
  );
}

export function SuccessView({
  snapshot,
  onReset,
}: {
  snapshot: BanquetSnapshot;
  onReset: () => void;
}) {
  const { values, banquetDate, banquetVenue, emailed } = snapshot;
  const attending = values.attending === "yes";
  const allergenNames = values.allergens.map(allergenLabel);
  const affiliation = values.affiliation.trim();
  const otherNotes = values.allergenOther.trim();
  const message = values.message.trim();

  return (
    <Card className="gap-0 p-8 sm:p-10">
      <span className="mb-4 flex size-13 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="size-7" />
      </span>
      <h2 className="heading text-foreground">
        {attending ? "RSVP confirmed" : "Response recorded"}
      </h2>
      <p className="body mt-1.5 mb-6 text-muted-foreground">
        {emailed ? (
          <>
            Thank you. Your banquet response has been recorded. A confirmation has been emailed to{" "}
            <strong className="text-foreground">{values.email}</strong>.
          </>
        ) : (
          <>
            Thank you. Your banquet response for{" "}
            <strong className="text-foreground">{values.email}</strong> has been recorded.
          </>
        )}
      </p>

      <div className="overflow-hidden rounded-md border border-border">
        <RecapRow label="Name">{values.name}</RecapRow>
        {affiliation ? <RecapRow label="Affiliation">{affiliation}</RecapRow> : null}
        <RecapRow label="Email">{values.email}</RecapRow>
        <RecapRow label="Banquet">
          {banquetDate} at {banquetVenue}
        </RecapRow>
        <RecapRow label="Attending">{attending ? "Yes" : "No"}</RecapRow>
        {attending ? (
          <>
            <RecapRow label="Allergens and dietary needs">
              {allergenNames.length > 0 ? allergenNames.join(", ") : "None specified"}
            </RecapRow>
            {otherNotes ? <RecapRow label="Other dietary notes">{otherNotes}</RecapRow> : null}
            {message ? <RecapRow label="Your message">{message}</RecapRow> : null}
          </>
        ) : null}
      </div>

      <div className="mt-6">
        <Button type="button" onClick={onReset}>
          Submit another response
        </Button>
      </div>
    </Card>
  );
}
