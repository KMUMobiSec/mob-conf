"use client";

import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PresentationValues } from "../lib/schema";

export interface PresentationSnapshot {
  values: PresentationValues;
  materialFileNames: string[];
  videoFileName: string | null;
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
  snapshot: PresentationSnapshot;
  onReset: () => void;
}) {
  const { values, materialFileNames, videoFileName } = snapshot;
  const videoLink = values.videoUrl.trim();

  return (
    <Card className="gap-0 p-8 sm:p-10">
      <span className="mb-4 flex size-13 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="size-7" />
      </span>
      <h2 className="heading text-foreground">Presentation submitted</h2>
      <p className="body mt-1.5 mb-6 text-muted-foreground">
        Thank you. Your presentation has been uploaded and recorded. A confirmation has been emailed
        to <strong className="text-foreground">{values.contactEmail}</strong>.
      </p>

      <div className="overflow-hidden rounded-md border border-border">
        <RecapRow label="Paper number">{values.paperNumber}</RecapRow>
        <RecapRow label="Title">{values.title}</RecapRow>
        <RecapRow label="Contact email">{values.contactEmail}</RecapRow>
        <RecapRow label={materialFileNames.length === 1 ? "File" : "Files"}>
          <ul className="flex flex-col gap-0.5">
            {materialFileNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </RecapRow>
        {videoFileName ? (
          <RecapRow label="Video">{videoFileName}</RecapRow>
        ) : videoLink ? (
          <RecapRow label="Video link">
            <span className="break-all">{videoLink}</span>
          </RecapRow>
        ) : null}
      </div>

      <div className="mt-6">
        <Button type="button" onClick={onReset}>
          Submit another presentation
        </Button>
      </div>
    </Card>
  );
}
