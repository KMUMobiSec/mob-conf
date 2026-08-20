export type SessionType =
  | "keynote"
  | "workshop"
  | "panel"
  | "session"
  | "break"
  | "lunch"
  | "banquet"
  | "ceremony"
  | "poster"
  | "forum"
  | "roundtable"
  | "special";

export type ConferenceInfo = {
  name: string;
  fullName: string;
  dates: string;
  location: string;
  venue: string;
};

export type Room = {
  id: string;
  name: string;
};

export type Speaker = {
  name: string;
  affiliation: string;
  role?: string;
  photo?: string;
  bio?: string;
};

export type Paper = {
  title: string;
  authors: string[];
  presenter?: string;
  startTime?: string;
  endTime?: string;
};

export type Session = {
  room: string;
  type: SessionType;
  sessionId: string;
  title: string;
  topic?: string;
  chair?: string;
  speakers?: Speaker[];
  papers?: Paper[];
  description?: string;
};

export type TimeSlot = {
  startTime: string;
  endTime: string;
  duration: string;
  sessions: Session[];
};

export type ConferenceDay = {
  date: string;
  dayName: string;
  slots: TimeSlot[];
};

export type ConferenceSchedule = {
  conference: ConferenceInfo;
  rooms: Room[];
  days: ConferenceDay[];
};
