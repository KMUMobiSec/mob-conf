"use client";

import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DOC_FIELD_KEYS,
  DOC_LABELS,
  type DocFieldKey,
  degreeLabel,
  enrollmentLabel,
} from "../lib/constants";
import type { NominationValues } from "../lib/schema";

export interface NominationSnapshot {
  awardName: string;
  values: NominationValues;
  fileNames: Record<DocFieldKey, string[]>;
  slidePages: number | null;
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
  snapshot: NominationSnapshot;
  onReset: () => void;
}) {
  const { awardName, values, fileNames, slidePages } = snapshot;
  const degree = degreeLabel(values.degree);
  const enrollment = enrollmentLabel(values.enrollment);
  const documentKeys = DOC_FIELD_KEYS.filter((key) => fileNames[key]?.length);

  return (
    <Card className="gap-0 p-8 sm:p-10">
      <span className="mb-4 flex size-13 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="size-7" />
      </span>
      <h2 className="heading text-foreground">Nomination submitted</h2>
      <p className="body mt-1.5 mb-6 text-muted-foreground">
        Thank you. Your nomination for the <strong className="text-foreground">{awardName}</strong>{" "}
        has been recorded. A confirmation has been emailed to{" "}
        <strong className="text-foreground">{values.nom_email}</strong>.
      </p>

      <div className="overflow-hidden rounded-md border border-border">
        <RecapRow label="Award">{awardName}</RecapRow>
        <RecapRow label="Nominator">
          {values.nom_name} · {values.nom_email}
        </RecapRow>
        <RecapRow label="Relationship">{values.nom_rel}</RecapRow>
        <RecapRow label="Nominee">
          {values.nominee_name} · {values.nominee_email}
        </RecapRow>
        <RecapRow label="Nominee role">
          {values.nominee_pos}, {values.nominee_aff} ({values.nominee_country})
        </RecapRow>
        {degree && (
          <RecapRow label="Degree program">
            {degree}
            {enrollment ? ` · ${enrollment}` : ""}
          </RecapRow>
        )}
        <RecapRow label="Statement">{values.statement}</RecapRow>
        <RecapRow label="Documents">
          <ul className="list list-disc pl-4">
            {documentKeys.map((key) => (
              <li key={key}>
                {DOC_LABELS[key]}: {fileNames[key].join(", ")}
                {key === "slides" && slidePages != null ? ` (${slidePages} pages)` : ""}
              </li>
            ))}
          </ul>
        </RecapRow>
        <RecapRow label="Consent">Nominee confirmed aware of nomination</RecapRow>
      </div>

      <div className="mt-6">
        <Button type="button" onClick={onReset}>
          Submit another nomination
        </Button>
      </div>
    </Card>
  );
}
