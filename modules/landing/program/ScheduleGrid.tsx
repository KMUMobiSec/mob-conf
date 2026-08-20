"use client";

import { Calendar, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type {
  ConferenceDay,
  ConferenceSchedule,
  Session,
  Speaker,
  TimeSlot,
} from "@/types/conference-schedule";
import SessionCard from "./SessionCard";

interface ScheduleGridProps {
  schedule: ConferenceSchedule;
  selectedDay: string | null;
  selectedRoom: string | null;
  selectedType: string | null;
  searchQuery: string;
  selectedAuthors: string[];
  onSpeakerClick?: (speaker: Speaker) => void;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  schedule,
  selectedDay,
  selectedRoom,
  selectedType,
  searchQuery,
  selectedAuthors,
  onSpeakerClick,
}) => {
  const t = useTranslations("ProgramPage");
  // Filter days
  const filteredDays = useMemo(() => {
    if (!selectedDay) return schedule.days;
    return schedule.days.filter((day) => day.date === selectedDay);
  }, [schedule.days, selectedDay]);

  // Filter sessions within a time slot
  const filterSessions = (sessions: Session[]): Session[] => {
    return sessions.filter((session) => {
      // Room filter
      if (selectedRoom) {
        if (selectedRoom === "common" && session.room !== "common") return false;
        if (selectedRoom !== "common" && session.room !== selectedRoom) return false;
      }

      // Type filter
      if (selectedType && session.type !== selectedType) return false;

      // Authors filter
      if (selectedAuthors.length > 0) {
        const hasMatchingPapers = session.papers?.some(
          (paper) =>
            paper.authors.some((author) => selectedAuthors.includes(author)) ||
            (paper.presenter && selectedAuthors.includes(paper.presenter)),
        );
        if (!hasMatchingPapers) return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = session.title.toLowerCase().includes(query);
        const matchesTopic = session.topic?.toLowerCase().includes(query);
        const matchesSpeakers = session.speakers?.some(
          (s) =>
            s.name.toLowerCase().includes(query) || s.affiliation.toLowerCase().includes(query),
        );
        const matchesPapers = session.papers?.some(
          (paper) =>
            paper.title.toLowerCase().includes(query) ||
            paper.authors.some((author) => author.toLowerCase().includes(query)) ||
            paper.presenter?.toLowerCase().includes(query),
        );
        if (!matchesTitle && !matchesTopic && !matchesSpeakers && !matchesPapers) return false;
      }

      return true;
    });
  };

  const getRoomName = (roomId: string): string => {
    if (roomId === "common") return t("commonArea");
    if (roomId === "symphony-4f") return t("symphonyRoom");
    const room = schedule.rooms.find((r) => r.id === roomId);
    return room?.name || roomId;
  };

  const formatTabDate = (dateString: string, dayName: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const day = date.getDate();
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-normal opacity-90">
          {month} {day}
        </span>
        <span className="text-sm">{dayName}</span>
      </div>
    );
  };

  const renderTimeSlot = (slot: TimeSlot, _dayIndex: number) => {
    const filteredSessions = filterSessions(slot.sessions);
    if (filteredSessions.length === 0) return null;

    const sessionCount = filteredSessions.length;
    const gridColumns = Math.min(sessionCount, 3);
    const gridClassName =
      gridColumns === 1
        ? "grid-cols-1"
        : gridColumns === 2
          ? "grid-cols-1 md:grid-cols-2"
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

    return (
      <div key={`${slot.startTime}-${slot.endTime}`} className="mb-3">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 border-b border-border pb-1.5 mb-2">
          <div className="flex items-center gap-2">
            <h5 className="small-heading flex items-center gap-2 px-2 py-1 bg-primary/5">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span className="text-foreground">
                {slot.startTime} - {slot.endTime}
              </span>
              <span className="text-muted-foreground">({slot.duration})</span>
            </h5>
          </div>
        </div>
        <div className={cn("grid gap-3", gridClassName)}>
          {filteredSessions.map((session, idx) => (
            <SessionCard
              key={`${session.room}-${session.title}-${idx}`}
              session={session}
              roomName={getRoomName(session.room)}
              onSpeakerClick={onSpeakerClick}
              className={sessionCount === 1 ? "w-full" : ""}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderDay = (day: ConferenceDay) => {
    const hasSessions = day.slots.some((slot) => filterSessions(slot.sessions).length > 0);
    if (!hasSessions) return null;

    return (
      <TabsContent key={day.date} value={day.date} className="mt-3">
        <div className="mb-4 p-3 bg-linear-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2">
            <div>
              <h3 className="heading text-foreground">{day.dayName}</h3>
              <p className="body text-muted-foreground flex items-center gap-2">
                {new Date(day.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {day.slots.map((slot) => renderTimeSlot(slot, schedule.days.indexOf(day)))}
        </div>
      </TabsContent>
    );
  };

  if (filteredDays.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="body text-muted-foreground">No sessions found matching your filters.</p>
      </div>
    );
  }

  // If only one day is selected, show it directly without tabs
  if (filteredDays.length === 1) {
    const day = filteredDays[0];
    return (
      <div>
        <div className="mb-4 p-3 bg-linear-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <div>
              <h3 className="heading text-foreground">{day.dayName}</h3>
              <p className="body text-muted-foreground">
                {new Date(day.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-3">{day.slots.map((slot) => renderTimeSlot(slot, 0))}</div>
      </div>
    );
  }

  // Multiple days - show tabs
  return (
    <Tabs defaultValue={filteredDays[0]?.date} className="w-full">
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-5 h-auto p-1.5">
        {filteredDays.map((day) => (
          <TabsTrigger
            key={day.date}
            value={day.date}
            className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {formatTabDate(day.date, day.dayName)}
          </TabsTrigger>
        ))}
      </TabsList>
      {filteredDays.map((day) => renderDay(day))}
    </Tabs>
  );
};

export default ScheduleGrid;
