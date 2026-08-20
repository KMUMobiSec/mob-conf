import { CalendarDays, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ValidYear } from "@/constants/config";
import { loadData } from "@/lib/data";
import { loadProgramSchedule } from "@/lib/program/schedule";
import { ScheduleTabs } from "./ScheduleTabs";

interface ProgramFlowData {
  info: {
    date: string;
    venue: string;
  };
}

const ProgramFlowPage = async ({ year }: { year: ValidYear }) => {
  const t = await getTranslations("ProgramFlowPage");

  let data: ProgramFlowData | null = null;
  try {
    data = await loadData<ProgramFlowData>("program-flow", year);
  } catch {
    data = null;
  }

  const schedule = await loadProgramSchedule(year);

  if (!data) {
    return (
      <section className="px-4 sm:px-8 lg:px-12 py-16 sm:py-24">
        <div className="mx-auto flex max-w-8xl flex-col items-center gap-4 text-center">
          <h1 className="display text-foreground">{t("title")}</h1>
          <p className="body max-w-2xl text-muted-foreground">{t("emptyDescription", { year })}</p>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col">
      {/* ── Header ── */}
      <section className="px-4 sm:px-8 lg:px-12 pt-12 pb-8 sm:pt-16 sm:pb-10">
        <div className="mx-auto flex max-w-8xl flex-col gap-4">
          <h1 className="display text-foreground">{t("title")}</h1>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
              <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium text-foreground sm:text-base">
                {data.info.date}
              </span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
              <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium text-foreground sm:text-base">
                {data.info.venue}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* ── Schedule ── */}
      {schedule && schedule.length > 0 && (
        <section className="px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24">
          <ScheduleTabs schedule={schedule} />
        </section>
      )}
    </div>
  );
};

export default ProgramFlowPage;
