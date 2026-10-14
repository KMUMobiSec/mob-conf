import { ArrowRight, Award, CheckCircle } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import type { ValidYear } from "@/constants/config";
import { loadData } from "@/lib/data";
import { getAnnouncementSubmissionAction } from "@/lib/routes/announcement";

interface ConferenceData {
  conferenceName: string;
  dates: string;
  venue: string;
  location: string;
}

interface AnnouncementDate {
  title: string;
  date: string;
}

interface AnnouncementData {
  importantDates: AnnouncementDate[];
}

const glassCard = "bg-card/60 backdrop-blur-xl border border-border/60 rounded-lg shadow-sm";

const AWARD_CATEGORY_KEYS = [
  { id: "1-1", titleKey: "awardBestPaper", descKey: "awardBestPaperDesc", autoNomination: true },
  {
    id: "1-2",
    titleKey: "awardBestStudent",
    descKey: "awardBestStudentDesc",
    autoNomination: true,
  },
  {
    id: "1-3",
    titleKey: "awardExemplaryLecturer",
    descKey: "awardExemplaryLecturerDesc",
    autoNomination: false,
  },
  {
    id: "1-4",
    titleKey: "awardYoungResearcher",
    descKey: "awardYoungResearcherDesc",
    autoNomination: false,
  },
  {
    id: "1-5",
    titleKey: "awardPromisingGraduate",
    descKey: "awardPromisingGraduateDesc",
    autoNomination: false,
  },
  {
    id: "1-6",
    titleKey: "awardIndustryPioneer",
    descKey: "awardIndustryPioneerDesc",
    autoNomination: false,
  },
] as const;

const NOMINATION_REQUIREMENT_KEYS = [
  "nominationReqCv",
  "nominationReqSummary",
  "nominationReqTeaching",
  "nominationReqDocumentation",
  "nominationReqLetter",
  "nominationReqSlides",
] as const;

const AnnouncementPage = async ({ year }: { year: ValidYear }) => {
  const t = await getTranslations("AnnouncementPage");
  const tCommon = await getTranslations("Common");
  const conf = await loadData<ConferenceData>("conference", year);
  const announcementData = await loadData<AnnouncementData>("announcement", year);
  const submissionAction = getAnnouncementSubmissionAction(year);

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

      {/* Award Categories Overview */}
      <section className="px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24">
        <div className="max-w-8xl mx-auto flex flex-col gap-10">
          {/* Categories Grid */}
          <div className={`${glassCard} p-6 sm:p-8`}>
            <h2 className="heading text-foreground flex items-center mb-6">
              <span className="w-1.5 h-6 bg-primary rounded-full mr-4" />
              {t("awardCategories")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {AWARD_CATEGORY_KEYS.map((award) => (
                <div
                  key={award.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/40"
                >
                  <Award className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="body text-foreground">{t(award.titleKey)}</p>
                    <small className="caption text-muted-foreground">
                      {award.autoNomination ? t("automaticConsideration") : t("nominationRequired")}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Individual Award Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {AWARD_CATEGORY_KEYS.map((award) => (
              <div key={award.id} className={`${glassCard} p-6 sm:p-8 flex flex-col gap-4`}>
                <h2 className="heading text-foreground flex items-center">
                  <span className="w-1.5 h-6 bg-primary rounded-full mr-4" />
                  {t(award.titleKey)}
                </h2>
                <p className="body text-muted-foreground">{t(award.descKey)}</p>
                <div className="flex items-center gap-2 mt-auto pt-2">
                  <small
                    className={`caption px-2.5 py-0.5 rounded-full font-medium ${
                      award.autoNomination
                        ? "bg-primary/10 text-primary"
                        : "bg-accent text-accent-foreground"
                    }`}
                  >
                    {award.autoNomination ? t("autoConsidered") : t("nominationRequired")}
                  </small>
                </div>
              </div>
            ))}
          </div>

          {/* Nomination Requirements */}
          <div className={`${glassCard} p-6 sm:p-8`}>
            <h2 className="heading text-foreground flex items-center mb-4">
              <span className="w-1.5 h-6 bg-primary rounded-full mr-4" />
              {t("nominationSubmissionRequirements")}
            </h2>
            <p className="body text-muted-foreground mb-6">{t("nominationRequirementsIntro")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {NOMINATION_REQUIREMENT_KEYS.map((key, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="body text-foreground">{t(key)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Method */}
          <div className={`${glassCard} p-6 sm:p-8`}>
            <h2 className="heading text-foreground flex items-center mb-4">
              <span className="w-1.5 h-6 bg-primary rounded-full mr-4" />
              {t("submissionMethod")}
            </h2>
            <p className="body text-muted-foreground mb-6">{t("submissionDescription")}</p>
            <Button asChild size="lg">
              <Link
                href={submissionAction.href}
                target={submissionAction.opensInNewTab ? "_blank" : undefined}
                rel={submissionAction.opensInNewTab ? "noopener noreferrer" : undefined}
              >
                {t(submissionAction.labelKey)}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <div className="mt-6 pt-4 border-t border-border/60">
              <small className="caption text-muted-foreground">
                {t("questionsContactNote")}{" "}
                <a
                  href="mailto:cyberchair.mobisec@gmail.com"
                  className="text-primary hover:text-primary/80 underline"
                >
                  cyberchair.mobisec@gmail.com
                </a>
              </small>
            </div>
          </div>

          {/* Important Dates — Timeline */}
          <div className={`${glassCard} p-6 sm:p-8`}>
            <h2 className="heading text-foreground flex items-center mb-6">
              <span className="w-1.5 h-6 bg-primary rounded-full mr-4" />
              {t("importantDates")}
            </h2>
            <ol className="list relative ml-4">
              {announcementData.importantDates.map((item, index, arr) => {
                const isLast = index === arr.length - 1;
                return (
                  <li key={index} className={`relative pl-8 ${isLast ? "" : "pb-8"}`}>
                    {!isLast && (
                      <div className="absolute left-[7px] top-3 bottom-0 w-px bg-primary/20" />
                    )}
                    <div className="absolute left-0 top-1.5 flex items-center justify-center">
                      <div className="w-[15px] h-[15px] rounded-full border-2 border-primary bg-card/80" />
                      <div className="absolute w-[7px] h-[7px] rounded-full bg-primary" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="body text-foreground">{item.title}</p>
                      <small className="caption text-muted-foreground">{item.date}</small>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="mt-6 p-4 bg-accent/40 rounded-lg">
              <small className="caption text-foreground">
                <strong>{t("noteLabel")}:</strong>{" "}
                {t("attendanceNote", {
                  year,
                  venue: conf.venue,
                  location: conf.location,
                  dates: conf.dates,
                })}
              </small>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24">
        <div className="max-w-8xl mx-auto">
          <div className="bg-primary/90 backdrop-blur-xl rounded-lg p-8 sm:p-12 relative overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute -top-20 -right-20 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-20 -left-20 w-48 h-48 bg-primary-foreground/5 rounded-full blur-3xl"
            />
            <div className="relative text-center flex flex-col gap-6 items-center">
              <h2 className="title text-primary-foreground">{t("ctaTitle")}</h2>
              <p className="body text-primary-foreground/80">{t("ctaDescription", { year })}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild variant="secondaryOutline">
                  <Link href={`mailto:${tCommon("email")}`}>{tCommon("email")}</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link
                    href={submissionAction.href}
                    target={submissionAction.opensInNewTab ? "_blank" : undefined}
                    rel={submissionAction.opensInNewTab ? "noopener noreferrer" : undefined}
                  >
                    {t(submissionAction.labelKey)}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnnouncementPage;
