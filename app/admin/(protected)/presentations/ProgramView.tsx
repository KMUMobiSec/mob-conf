"use client";

import { ExternalLink, Eye, Gavel, MapPin } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProgramDay, ProgramSchedule, ProgramSession } from "@/lib/program/schedule";
import { bestTitleMatch } from "@/modules/admin/presentations/lib/match";
import type { MatchablePresentation } from "@/modules/admin/presentations/lib/queries";
import type { Paper } from "@/types/conference-schedule";
import { PresentationFileLink } from "./PresentationFileLink";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-07-08" → "Jul 8". */
function shortDate(iso: string): string {
  const [, month, day] = iso.split("-");
  const monthName = MONTHS[Number(month) - 1] ?? month;
  return `${monthName} ${Number(day)}`;
}

function TalkDownloads({ match }: { match: MatchablePresentation }) {
  const hasAny = match.materials.length > 0 || match.video || match.videoUrl;
  if (!hasAny) return null;

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {match.materials.map((file) => (
        <PresentationFileLink
          key={file.id}
          id={file.id}
          name={file.fileName}
          size={file.fileSize}
        />
      ))}
      {match.video ? (
        <PresentationFileLink
          id={match.video.id}
          name={match.video.fileName}
          size={match.video.fileSize}
        />
      ) : match.videoUrl ? (
        <a
          href={match.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center gap-2 rounded-md border border-border bg-muted/40 py-2 pl-2.5 pr-3 text-sm transition-colors hover:border-primary hover:bg-accent"
        >
          <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">Video link</span>
          <span className="shrink-0 text-xs font-medium text-primary">Open ↗</span>
        </a>
      ) : null}
    </div>
  );
}

function TalkRow({
  paper,
  presentations,
}: {
  paper: Paper;
  presentations: MatchablePresentation[];
}) {
  const match = bestTitleMatch(paper.title, presentations, (p) => p.title);

  return (
    <div className="grid grid-cols-[52px_1fr_auto] gap-3 px-4 py-3 sm:px-5">
      <div className="pt-0.5 text-sm tabular-nums text-muted-foreground">
        {paper.startTime ?? ""}
      </div>
      <div className="min-w-0">
        {paper.authors.length > 0 && (
          <p className="text-sm text-muted-foreground">{paper.authors.join(", ")}</p>
        )}
        <p className="text-sm font-semibold text-foreground">{paper.title}</p>
        {paper.presenter && (
          <p className="mt-0.5 text-xs text-muted-foreground">Presenter: {paper.presenter}</p>
        )}
        {match && <TalkDownloads match={match} />}
      </div>
      <div className="pt-0.5">
        {match && (
          <Link
            href={`/admin/presentations/${match.id}`}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:border-primary hover:bg-accent"
          >
            <Eye className="size-3.5" />
            View
          </Link>
        )}
      </div>
    </div>
  );
}

function SessionCard({
  session,
  presentations,
}: {
  session: ProgramSession;
  presentations: MatchablePresentation[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-l-4 border-primary bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary">
            {session.startTime} – {session.endTime}
          </span>
          <span className="text-base font-semibold text-foreground">{session.title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {session.chair && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Gavel className="size-3.5 shrink-0 text-primary/70" aria-hidden="true" />
              <span>
                Chair: <span className="font-medium text-foreground">{session.chair}</span>
              </span>
            </span>
          )}
          {session.room && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              <MapPin className="size-3.5" />
              {session.room}
            </span>
          )}
        </div>
      </div>

      {session.papers.length > 0 && (
        <div className="divide-y divide-border">
          {session.papers.map((paper, i) => (
            <TalkRow
              key={`${paper.title}-${paper.startTime ?? i}`}
              paper={paper}
              presentations={presentations}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DayPanel({
  day,
  presentations,
}: {
  day: ProgramDay;
  presentations: MatchablePresentation[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {day.slots.flatMap((slot) =>
        slot.sessions
          .filter((session) => session.papers.length > 0)
          .map((session) => (
            <SessionCard
              key={`${slot.startTime}-${session.sessionId}`}
              session={session}
              presentations={presentations}
            />
          )),
      )}
    </div>
  );
}

export function ProgramView({
  schedule,
  presentations,
}: {
  schedule: ProgramSchedule | null;
  presentations: MatchablePresentation[];
}) {
  if (!schedule || schedule.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
        No program has been added for this year yet.
      </div>
    );
  }

  return (
    <Tabs defaultValue={schedule[0].date} className="w-full gap-4">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1">
        {schedule.map((day) => (
          <TabsTrigger key={day.date} value={day.date} className="gap-1.5">
            <span className="font-semibold">{day.weekday}</span>
            <span className="text-xs opacity-70">{shortDate(day.date)}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {schedule.map((day) => (
        <TabsContent key={day.date} value={day.date}>
          <DayPanel day={day} presentations={presentations} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
