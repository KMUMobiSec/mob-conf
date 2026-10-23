import { ArrowRight, CalendarClock, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import type { ValidYear } from "@/constants/config";
import { loadData } from "@/lib/data";

interface SessionChair {
  name: string;
  affiliation: string;
}

interface SpecialSession {
  code: string;
  title: string;
  chairs: SessionChair[];
  submissionDeadline: string;
  submissionUrl: string;
}

interface SpecialSessionsData {
  sessions: SpecialSession[];
}

const glassCard = "bg-card/60 backdrop-blur-xl border border-border/60 rounded-lg shadow-sm";

const SpecialSessionsPage = async ({ year }: { year: ValidYear }) => {
  const t = await getTranslations("SpecialSessionsPage");

  let data: SpecialSessionsData | null = null;
  try {
    data = await loadData<SpecialSessionsData>("special-sessions", year);
  } catch {
    data = null;
  }
  const sessions = data?.sessions ?? [];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-24">
        <div className="max-w-8xl mx-auto flex flex-col gap-4">
          <p className="tag text-primary">{t("label")}</p>
          <h1 className="display text-foreground">{t("title")}</h1>
          <p className="body text-muted-foreground max-w-3xl">{t("subtitle", { year })}</p>
        </div>
      </section>

      {/* Sessions */}
      <section className="px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24">
        <div className="max-w-8xl mx-auto flex flex-col gap-8">
          {sessions.length === 0 ? (
            <div className={`${glassCard} p-8 text-center`}>
              <p className="body text-muted-foreground">{t("empty")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {sessions.map((session) => (
                <div key={session.code} className={`${glassCard} p-6 sm:p-8 flex flex-col gap-5`}>
                  <div className="flex flex-col gap-2">
                    <span className="tag text-primary">{session.code}</span>
                    <h2 className="heading text-foreground text-wrap">{session.title}</h2>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-border pt-4">
                    <p className="small-heading flex items-center gap-2 text-foreground">
                      <Users className="h-4 w-4 text-primary shrink-0" />
                      {t("chairsHeading")}
                    </p>
                    <ul className="list flex flex-col gap-1">
                      {session.chairs.map((chair) => (
                        <li key={chair.name} className="body text-muted-foreground">
                          {chair.name}
                          <span className="caption"> — {chair.affiliation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-start gap-2 border-t border-border pt-4">
                    <CalendarClock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="body text-foreground">{session.submissionDeadline}</p>
                      <small className="caption text-muted-foreground">{t("deadlineLabel")}</small>
                    </div>
                  </div>

                  <Button asChild className="mt-auto w-fit">
                    <a href={session.submissionUrl} target="_blank" rel="noopener noreferrer">
                      {t("submitButton")}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}

          {sessions.length > 0 && <p className="caption text-muted-foreground">{t("note")}</p>}
        </div>
      </section>
    </div>
  );
};

export default SpecialSessionsPage;
