"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConferenceSchedule } from "@/types/conference-schedule";

interface ScheduleFiltersProps {
  schedule: ConferenceSchedule;
  selectedDay: string | null;
  selectedRoom: string | null;
  selectedType: string | null;
  searchQuery: string;
  selectedAuthors: string[];
  onDayChange: (day: string | null) => void;
  onRoomChange: (room: string | null) => void;
  onTypeChange: (type: string | null) => void;
  onSearchChange: (query: string) => void;
  onAuthorsChange: (authors: string[]) => void;
  onReset: () => void;
}

const ScheduleFilters: React.FC<ScheduleFiltersProps> = ({
  schedule,
  selectedDay,
  selectedRoom,
  selectedType,
  searchQuery,
  selectedAuthors,
  onDayChange,
  onRoomChange,
  onTypeChange,
  onSearchChange,
  onAuthorsChange,
  onReset,
}) => {
  const t = useTranslations("ProgramPage");
  const sessionTypes = [
    "session",
    "keynote",
    "workshop",
    "panel",
    "break",
    "lunch",
    "banquet",
    "ceremony",
    "poster",
    "forum",
    "roundtable",
    "special",
  ];

  // Collect all unique authors and presenters
  const allAuthorsAndPresenters = useMemo(() => {
    const authorsSet = new Set<string>();
    schedule.days.forEach((day) => {
      day.slots.forEach((slot) => {
        slot.sessions.forEach((session) => {
          session.papers?.forEach((paper) => {
            paper.authors.forEach((author) => {
              authorsSet.add(author);
            });
            if (paper.presenter) authorsSet.add(paper.presenter);
          });
        });
      });
    });
    return Array.from(authorsSet).sort();
  }, [schedule]);

  const hasActiveFilters =
    selectedDay || selectedRoom || selectedType || searchQuery || selectedAuthors.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Day Filter */}
        <Select
          value={selectedDay || "all"}
          onValueChange={(v) => onDayChange(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("allDays")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allDays")}</SelectItem>
            {schedule.days.map((day) => (
              <SelectItem key={day.date} value={day.date}>
                {day.dayName} ({day.date})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Room Filter */}
        <Select
          value={selectedRoom || "all"}
          onValueChange={(v) => onRoomChange(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("allRooms")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allRooms")}</SelectItem>
            {schedule.rooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name}
              </SelectItem>
            ))}
            <SelectItem value="common">{t("commonAreas")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select
          value={selectedType || "all"}
          onValueChange={(v) => onTypeChange(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("allTypes")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allTypes")}</SelectItem>
            {sessionTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Authors Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-[200px] justify-between border border-input"
            >
              <span className="truncate">
                {selectedAuthors.length === 0
                  ? t("allAuthors")
                  : `${selectedAuthors.length} ${t("selected")}`}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="subheading">{t("filterByAuthors")}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAuthorsChange([])}
                  className="h-8 px-2"
                >
                  {t("clearAll")}
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {allAuthorsAndPresenters.map((author) => (
                  <div key={author} className="flex items-center space-x-2">
                    <Checkbox
                      id={`author-${author}`}
                      checked={selectedAuthors.includes(author)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onAuthorsChange([...selectedAuthors, author]);
                        } else {
                          onAuthorsChange(selectedAuthors.filter((a) => a !== author));
                        }
                      }}
                    />
                    <label
                      htmlFor={`author-${author}`}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {author}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button variant="outline" onClick={onReset} className="shrink-0">
            <X className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};

export default ScheduleFilters;
