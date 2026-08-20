import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Paper } from "@/types/conference-schedule";

/** A session in the conference program (type is free-text from the CSV). */
export interface ProgramSession {
  sessionId: string;
  title: string;
  topic?: string;
  room?: string;
  chair?: string;
  type: string;
  startTime: string;
  endTime: string;
  papers: Paper[];
}

export interface ProgramTimeSlot {
  startTime: string;
  endTime: string;
  sessions: ProgramSession[];
}

export interface ProgramDay {
  weekday: string;
  date: string;
  slots: ProgramTimeSlot[];
}

export type ProgramSchedule = ProgramDay[];

/** Parse one CSV line honoring double-quoted fields (with "" escaping). */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;
  while (i < line.length) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 2;
      } else {
        inQuotes = !inQuotes;
        i += 1;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      i += 1;
    } else {
      current += char;
      i += 1;
    }
  }
  result.push(current.trim());
  return result;
}

function splitAuthors(value: string): string[] {
  return value
    .split(";")
    .map((a) => a.trim())
    .filter(Boolean);
}

/**
 * Parse the 17-column program CSV into a day → time-slot → session → papers
 * structure. Rows without a `paper_title` (e.g. breaks, ceremonies) contribute
 * session metadata only. Time slots within a day are ordered chronologically by
 * start time so interleaved breaks land in the right place.
 */
export function parseProgramSchedule(csvText: string): ProgramSchedule {
  const lines = csvText.replace(/\r\n/g, "\n").trim().split("\n");
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const col = (row: string[], name: string): string => {
    const idx = headers.indexOf(name);
    return idx >= 0 ? (row[idx] ?? "") : "";
  };

  const days = new Map<string, ProgramDay>();
  const slots = new Map<string, ProgramTimeSlot>();
  const sessions = new Map<string, ProgramSession>();

  for (let i = 1; i < lines.length; i += 1) {
    if (!lines[i].trim()) continue;
    const row = parseCsvLine(lines[i]);

    const date = col(row, "session_date");
    const weekday = col(row, "session_day");
    const sessionStart = col(row, "session_start_time");
    const sessionEnd = col(row, "session_end_time");
    const sessionId = col(row, "session_id");
    if (!date || !sessionId) continue;

    let day = days.get(date);
    if (!day) {
      day = { weekday, date, slots: [] };
      days.set(date, day);
    }

    const slotKey = `${date}|${sessionStart}-${sessionEnd}`;
    let slot = slots.get(slotKey);
    if (!slot) {
      slot = { startTime: sessionStart, endTime: sessionEnd, sessions: [] };
      slots.set(slotKey, slot);
      day.slots.push(slot);
    }

    const sessionKey = `${slotKey}|${sessionId}`;
    let session = sessions.get(sessionKey);
    if (!session) {
      session = {
        sessionId,
        title: col(row, "session_title"),
        topic: col(row, "session_topic") || undefined,
        room: col(row, "session_room") || undefined,
        chair: col(row, "session_chair") || undefined,
        type: col(row, "session_type") || "session",
        startTime: sessionStart,
        endTime: sessionEnd,
        papers: [],
      };
      sessions.set(sessionKey, session);
      slot.sessions.push(session);
    }

    const paperTitle = col(row, "paper_title");
    if (paperTitle) {
      const paper: Paper = {
        title: paperTitle,
        authors: splitAuthors(col(row, "paper_authors")),
        presenter: col(row, "paper_presenter") || undefined,
        startTime: col(row, "paper_start_time") || undefined,
        endTime: col(row, "paper_end_time") || undefined,
      };
      session.papers.push(paper);
    }
  }

  const schedule = [...days.values()];
  for (const day of schedule) {
    day.slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return schedule;
}

/** Read + parse the program file for a year (null when absent). */
export async function loadProgramSchedule(year: number): Promise<ProgramSchedule | null> {
  const file = path.join(process.cwd(), "data", String(year), "program.csv");
  try {
    const text = await readFile(file, "utf8");
    return parseProgramSchedule(text);
  } catch {
    return null;
  }
}
