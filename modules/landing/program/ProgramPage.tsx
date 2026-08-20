"use client";

import { CalendarDays, Download, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CURRENT_YEAR, isValidYear, YEAR_CONFIG } from "@/constants/config";
import type {
  ConferenceDay,
  ConferenceInfo,
  ConferenceSchedule,
  Paper,
  Room,
  SessionType,
  Speaker,
} from "@/types/conference-schedule";
import EmptySchedule from "./EmptySchedule";
import ScheduleFilters from "./ScheduleFilters";
import ScheduleGrid from "./ScheduleGrid";
import SpeakerModal from "./SpeakerModal";

interface ProgramPageProps {
  year?: number;
}

// Function to properly parse CSV with quoted fields
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === "," && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = "";
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current.trim());

  return result;
};

// Function to parse CSV data into ConferenceSchedule format
const parseCSVToSchedule = (csvText: string, year: number): ConferenceSchedule | null => {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return null;

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index]?.trim() || "";
    });
    return obj;
  });

  const timeToMinutes = (time: string): number => {
    // Expected format: HH:MM
    const [hRaw, mRaw] = (time || "").split(":");
    const h = Number(hRaw);
    const m = Number(mRaw);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return Number.MAX_SAFE_INTEGER;
    return h * 60 + m;
  };

  // Extract conference info based on year config
  const config = isValidYear(year) ? YEAR_CONFIG[year] : null;
  const conference: ConferenceInfo = {
    name: config?.conferenceName ?? `EBISION ${year}`,
    fullName: `The ${config?.edition ?? ""} IFIP WG 8.4 International Symposium on E-Business Information Systems Evolution`,
    dates: config?.dates ?? `TBD, ${year}`,
    location: config?.location ?? "TBD",
    venue: config?.venue ?? "TBD",
  };

  // Extract rooms
  const rooms: Room[] = [];
  const roomSet = new Set<string>();
  rows.forEach((row) => {
    if (row.session_room && row.session_room !== "") {
      roomSet.add(row.session_room);
    }
  });

  // Create room objects based on known rooms
  const knownRooms: Record<string, string> = {
    "symphony-4f": "Symphony Room (4F)",
    common: "Common Area",
  };
  roomSet.forEach((roomId) => {
    if (knownRooms[roomId as keyof typeof knownRooms]) {
      rooms.push({
        id: roomId,
        name: knownRooms[roomId as keyof typeof knownRooms],
      });
    }
  });

  // Group by day and time slots
  const daysMap = new Map<string, ConferenceDay>();

  rows.forEach((row) => {
    const dayKey = `${row.session_day}_${row.session_date}`;
    if (!daysMap.has(dayKey)) {
      daysMap.set(dayKey, {
        date: row.session_date,
        dayName: row.session_day,
        slots: [],
      });
    }

    const day = daysMap.get(dayKey);
    if (!day) return;

    // Find or create time slot
    let slot = day.slots.find(
      (s) => s.startTime === row.session_start_time && s.endTime === row.session_end_time,
    );

    if (!slot) {
      slot = {
        startTime: row.session_start_time,
        endTime: row.session_end_time,
        duration: row.session_duration || "",
        sessions: [],
      };
      day.slots.push(slot);
    }

    // Find or create session
    let session = slot.sessions.find(
      (s) => s.sessionId === row.session_id && s.room === row.session_room,
    );

    if (!session) {
      session = {
        room: row.session_room,
        type: (row.session_type as SessionType) || "session",
        sessionId: row.session_id,
        title: row.session_title || `Session ${row.session_id}`,
        topic: row.session_topic,
        chair: row.session_chair || undefined,
        speakers: row.session_speakers
          ? [
              {
                name: row.session_speakers,
                affiliation: "",
                role: "keynote" as const,
              },
            ]
          : [],
        papers: [],
      };
      slot.sessions.push(session);
    }

    // Add paper if it exists
    if (row.paper_title && row.paper_title !== "") {
      const paper: Paper = {
        title: row.paper_title,
        authors: row.paper_authors ? row.paper_authors.split(";").map((a) => a.trim()) : [],
        presenter: row.paper_presenter || undefined,
        startTime: row.paper_start_time || undefined,
        endTime: row.paper_end_time || undefined,
      };
      session.papers?.push(paper);
    }
  });

  // Ensure stable chronological ordering regardless of CSV row order
  daysMap.forEach((day) => {
    day.slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    day.slots.forEach((slot) => {
      slot.sessions.forEach((session) => {
        if (!session.papers || session.papers.length === 0) return;
        session.papers.sort(
          (a, b) => timeToMinutes(a.startTime || "") - timeToMinutes(b.startTime || ""),
        );
      });
    });
  });

  const days = Array.from(daysMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return {
    conference,
    rooms,
    days,
  };
};

const ProgramPage: React.FC<ProgramPageProps> = ({ year = CURRENT_YEAR }) => {
  const t = useTranslations("ProgramPage");
  const yearConfig = isValidYear(year) ? YEAR_CONFIG[year] : null;
  const [schedule, setSchedule] = useState<ConferenceSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Load CSV data on component mount
  useEffect(() => {
    const loadCSVData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load the EBISION CSV schedule
        const response = await fetch(`/data/${year}/ebision-table.csv`);
        if (!response.ok) {
          throw new Error(`Failed to load CSV: ${response.status}`);
        }

        const csvText = await response.text();
        const parsedSchedule = parseCSVToSchedule(csvText, year ?? CURRENT_YEAR);

        if (!parsedSchedule) {
          throw new Error("Failed to parse CSV data");
        }

        setSchedule(parsedSchedule);
      } catch (err) {
        console.error("Error loading CSV data:", err);
        setError(err instanceof Error ? err.message : "Failed to load schedule data");
      } finally {
        setLoading(false);
      }
    };

    loadCSVData();
  }, [year]);

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [isSpeakerModalOpen, setIsSpeakerModalOpen] = useState(false);

  const handleSpeakerClick = (speaker: Speaker) => {
    setSelectedSpeaker(speaker);
    setIsSpeakerModalOpen(true);
  };

  const handleResetFilters = () => {
    setSelectedDay(null);
    setSelectedRoom(null);
    setSelectedType(null);
    setSearchQuery("");
    setSelectedAuthors([]);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="body text-muted-foreground">{t("loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="body text-destructive mb-4">
            {t("error")} {error}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            {t("retry")}
          </Button>
        </div>
      </div>
    );
  }

  if (!schedule || schedule.days.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptySchedule conferenceName={schedule?.conference.name || `EBISION ${year}`} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <div className="container mx-auto py-6 flex flex-col gap-6">
        {/* Header Section */}
        <div className="pb-4 border-b border-border">
          <div className="flex sm:flex-row flex-col items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="title mb-3 bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {schedule.conference.fullName}
              </h1>
              <div className="flex flex-col sm:flex-row gap-x-6 gap-y-2 w-full flex-wrap">
                <p className="body flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span>{schedule.conference.dates}</span>
                </p>
                <p className="body flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>
                    {schedule.conference.location}, {schedule.conference.venue}
                  </span>
                </p>
              </div>
            </div>
            {yearConfig?.programBookUrl ? (
              <Button variant="outline" size="sm" className="shrink-0 gap-2" asChild>
                <a href={yearConfig.programBookUrl} download>
                  <Download className="h-4 w-4" />
                  {t("downloadProgramBook")}
                </a>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-2"
                disabled
                title={t("timetableComingSoon")}
              >
                <Download className="h-4 w-4" />
                {t("comingSoon")}
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <ScheduleFilters
          schedule={schedule}
          selectedDay={selectedDay}
          selectedRoom={selectedRoom}
          selectedType={selectedType}
          searchQuery={searchQuery}
          selectedAuthors={selectedAuthors}
          onDayChange={setSelectedDay}
          onRoomChange={setSelectedRoom}
          onTypeChange={setSelectedType}
          onSearchChange={setSearchQuery}
          onAuthorsChange={setSelectedAuthors}
          onReset={handleResetFilters}
        />

        {/* Schedule Grid */}
        <ScheduleGrid
          schedule={schedule}
          selectedDay={selectedDay}
          selectedRoom={selectedRoom}
          selectedType={selectedType}
          searchQuery={searchQuery}
          selectedAuthors={selectedAuthors}
          onSpeakerClick={handleSpeakerClick}
        />

        {/* Speaker Modal */}
        <SpeakerModal
          speaker={selectedSpeaker}
          open={isSpeakerModalOpen}
          onOpenChange={setIsSpeakerModalOpen}
        />
      </div>
    </div>
  );
};

export default ProgramPage;
