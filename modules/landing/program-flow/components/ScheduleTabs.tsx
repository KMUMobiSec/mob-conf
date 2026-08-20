"use client";

import {
  Building2,
  Coffee,
  FileText,
  Flag,
  Gavel,
  Globe,
  Handshake,
  type LucideIcon,
  Mic,
  PartyPopper,
  Presentation,
  UserRound,
  Users,
  Utensils,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ProgramSchedule, ProgramSession } from "@/lib/program/schedule";

type ItemTone = "key" | "session" | "routine" | "muted";

const ITEM_META: Record<string, { icon: LucideIcon; tone: ItemTone }> = {
  keynote: { icon: Mic, tone: "key" },
  ceremony: { icon: Flag, tone: "key" },
  industrial: { icon: Building2, tone: "key" },
  social: { icon: PartyPopper, tone: "key" },
  invited: { icon: Users, tone: "session" },
  poster: { icon: Presentation, tone: "session" },
  meeting: { icon: Handshake, tone: "session" },
  assembly: { icon: Globe, tone: "session" },
  session: { icon: FileText, tone: "routine" },
  paper: { icon: FileText, tone: "routine" },
  break: { icon: Coffee, tone: "muted" },
  lunch: { icon: Utensils, tone: "muted" },
};

const NODE_CLASS: Record<ItemTone, string> = {
  key: "bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/10",
  session: "bg-primary/10 text-primary",
  routine: "bg-background text-muted-foreground border border-border",
  muted: "bg-muted text-muted-foreground/70",
};

const metaFor = (type: string) =>
  ITEM_META[type] ?? { icon: FileText, tone: "routine" as ItemTone };

/** Flatten a day's time slots into an ordered session list. */
function daySessions(day: ProgramSchedule[number]): ProgramSession[] {
  return day.slots.flatMap((slot) => slot.sessions);
}

/** Keep author lines short — first name + "et al." once past two authors. */
function shortAuthors(authors: string[]): string {
  if (authors.length <= 2) return authors.join(", ");
  return `${authors[0]} et al.`;
}

const ChairLine = ({ label, chair }: { label: string; chair: string }) => (
  <p className="caption flex items-start gap-1.5 text-muted-foreground">
    <Gavel className="mt-0.5 size-3 shrink-0 text-primary/70" aria-hidden="true" />
    <span>
      {label && <span className="font-medium text-foreground">{label}: </span>}
      {chair}
    </span>
  </p>
);

const SessionRow = ({ session, isLast }: { session: ProgramSession; isLast: boolean }) => {
  const t = useTranslations("ProgramFlowPage");
  const meta = metaFor(session.type);
  const Icon = meta.icon;
  const isKey = meta.tone === "key";
  const isMuted = meta.tone === "muted";
  const isKeynote = session.type === "keynote";

  return (
    <li className="group flex gap-3 sm:gap-5">
      {/* Time gutter — desktop only; start time is the anchor, end time recedes */}
      <div className="hidden w-20 shrink-0 pt-1 text-right sm:block">
        <span
          className={`mono block text-lg font-semibold tabular-nums ${isMuted ? "text-muted-foreground" : "text-primary"}`}
        >
          {session.startTime}
        </span>
        <span className="mono block text-xs tabular-nums text-muted-foreground">
          {session.endTime}
        </span>
      </div>
      {/* Timeline spine: node + connector */}
      <div className="flex flex-col items-center pt-1">
        <span
          className={`inline-flex shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110 ${
            isMuted ? "size-8" : "size-9 sm:size-10"
          } ${NODE_CLASS[meta.tone]}`}
        >
          <Icon className={isMuted ? "size-4" : "size-5"} aria-hidden="true" />
        </span>
        {!isLast && (
          <span
            className="my-1.5 w-px flex-1 bg-gradient-to-b from-border to-border/30"
            aria-hidden="true"
          />
        )}
      </div>
      <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-4"}`}>
        <div
          className={`rounded-xl border px-3 py-3 transition-all duration-200 sm:px-4 ${
            isKey
              ? "border-l-4 border-primary/30 border-l-primary bg-primary/5"
              : "border-transparent group-hover:border-border/60 group-hover:bg-accent/40 group-hover:shadow-sm"
          }`}
        >
          {/* Time — mobile only, above the title; start time is the anchor */}
          <span className="mono mb-1 flex items-baseline gap-1.5 tabular-nums sm:hidden">
            <span
              className={`text-base font-semibold ${isMuted ? "text-muted-foreground" : "text-primary"}`}
            >
              {session.startTime}
            </span>
            <span className="text-xs text-muted-foreground">– {session.endTime}</span>
          </span>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className={`subheading ${isMuted ? "text-muted-foreground" : "text-foreground"}`}>
              {session.title}
            </p>
            {session.room && (
              <span className="caption text-muted-foreground">· {session.room}</span>
            )}
          </div>

          {session.chair && (
            <div className="mt-1.5">
              <ChairLine
                label={t(session.type === "poster" ? "posterChairs" : "sessionChair")}
                chair={session.chair}
              />
            </div>
          )}

          {session.papers.length > 0 && (
            <ol className="mt-3 flex flex-col divide-y divide-border/50 border-t border-border/50">
              {session.papers.map((paper) => (
                <li
                  key={paper.title}
                  className="flex items-start gap-2.5 py-2.5 first:pt-3 last:pb-0"
                >
                  {paper.startTime && (
                    <span className="mono shrink-0 text-sm font-semibold tabular-nums text-primary">
                      {paper.startTime}
                    </span>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="text-sm font-semibold leading-snug text-foreground">
                      {paper.title}
                    </p>
                    {(paper.presenter || paper.authors.length > 0) && (
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        {(paper.presenter || isKeynote) && (
                          <UserRound
                            className="size-3.5 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                        )}
                        {isKeynote && (
                          <span className="font-medium text-foreground">{t("keynoteSpeaker")}</span>
                        )}
                        {paper.presenter || shortAuthors(paper.authors)}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </li>
  );
};

export function ScheduleTabs({ schedule }: { schedule: ProgramSchedule }) {
  const t = useTranslations("ProgramFlowPage");
  const [active, setActive] = useState(0);
  const day = schedule[active];

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % schedule.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + schedule.length) % schedule.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = schedule.length - 1;
    else return;
    e.preventDefault();
    setActive(next);
    document.getElementById(`day-tab-${next}`)?.focus();
  };

  if (!day) return null;

  const sessions = daySessions(day);
  const sessionCount = sessions.filter((s) => metaFor(s.type).tone !== "muted").length;

  return (
    <div className="mx-auto flex max-w-8xl flex-col gap-8">
      {/* Day tabs (left) + selected-day summary (right) */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div
          role="tablist"
          aria-label={t("scheduleTitle")}
          className="flex flex-wrap gap-2 sm:gap-3"
        >
          {schedule.map((d, i) => {
            const selected = i === active;
            return (
              <button
                type="button"
                key={d.date}
                id={`day-tab-${i}`}
                role="tab"
                aria-selected={selected}
                aria-controls={`day-panel-${i}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className={`flex flex-col items-start rounded-xl px-4 py-2.5 text-left leading-tight transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  selected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border/60 bg-card/60 backdrop-blur-md hover:border-primary/40 hover:bg-accent"
                }`}
              >
                <span className={`tag ${selected ? "text-primary-foreground" : "text-primary"}`}>
                  {`Day ${i + 1}`}
                </span>
                <span
                  className={`caption ${selected ? "text-primary-foreground/90" : "text-muted-foreground"}`}
                >
                  {d.date} · {d.weekday}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected-day summary */}
        <div className="flex shrink-0 items-center gap-4 rounded-xl border border-primary/15 bg-primary/5 px-4 py-4">
          <span className="text-base font-semibold text-foreground sm:text-lg">
            {day.date} · {day.weekday}
          </span>
          <span className="h-6 w-px bg-primary/15" aria-hidden="true" />
          <div className="flex items-baseline gap-1.5">
            <span className="display-number text-2xl text-primary">{sessionCount}</span>
            <span className="caption text-muted-foreground">{t("sessions")}</span>
          </div>
        </div>
      </div>

      {/* Active day timeline */}
      <div
        id={`day-panel-${active}`}
        role="tabpanel"
        aria-labelledby={`day-tab-${active}`}
        className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-xl sm:p-6 lg:p-8"
      >
        <ol className="flex flex-col">
          {sessions.map((session, index) => (
            <SessionRow
              key={`${session.startTime}-${session.sessionId}`}
              session={session}
              isLast={index === sessions.length - 1}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}
