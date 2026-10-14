import { ArrowRight, CheckCircle, Download } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import type { ValidYear } from "@/constants/config";
import { YEAR_CONFIG } from "@/constants/config";
import { loadData } from "@/lib/data";

interface ImportantDate {
  title: string;
  date: string;
  color: string;
}

interface CallForPapersData {
  importantDates: {
    originalPapers: ImportantDate[];
    posterPapers?: ImportantDate[];
  };
}

const glassCard = "bg-card/60 backdrop-blur-xl border border-border/60 rounded-lg shadow-sm";

const subsectionBlock =
  "pl-5 border-l-4 border-primary/50 bg-primary/5 dark:bg-primary/10 rounded-r-lg py-4 pr-4";

const sectionHeader = "flex items-center gap-3 mb-6 pb-3 border-b border-border/60";

const importantDateValueClass =
  "mt-1 block text-lg sm:text-xl font-bold tabular-nums leading-snug text-primary";

const AuthorInstructionPage = async ({ year }: { year: ValidYear }) => {
  const t = await getTranslations("AuthorInstructionPage");
  const tCommon = await getTranslations("Common");
  const yearConfig = YEAR_CONFIG[year];
  const cfpData = await loadData<CallForPapersData>("call-for-papers", year);

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

      {/* Quick Navigation */}
      <section className="px-4 sm:px-8 lg:px-12 pb-8">
        <div className="max-w-8xl mx-auto">
          <nav
            aria-label={t("onThisPage")}
            className="bg-muted/50 border border-border/60 rounded-lg p-4 sm:p-6"
          >
            <p className="body text-sm font-semibold text-foreground mb-3">{t("onThisPage")}</p>
            <ul className="list flex flex-wrap gap-2">
              <li>
                <a
                  href="#general"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-background border border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  {t("jumpToGeneral")}
                </a>
              </li>
              <li>
                <a
                  href="#regular-paper"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-background border border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  {t("jumpToRegular")}
                </a>
              </li>
              {cfpData.importantDates.posterPapers &&
                cfpData.importantDates.posterPapers.length > 0 && (
                  <li>
                    <a
                      href="#poster-paper"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-background border border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    >
                      {t("jumpToPoster")}
                    </a>
                  </li>
                )}
            </ul>
          </nav>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24">
        <div className="max-w-8xl mx-auto flex flex-col gap-10">
          {/* General Requirements */}
          <div id="general" className={`${glassCard} p-6 sm:p-8 scroll-mt-24`}>
            <h2 className="title text-foreground flex items-center mb-4">
              <span className="w-1.5 h-6 bg-primary rounded-full mr-4" />
              {t("generalRequirements")}
            </h2>
            <p className="body text-foreground">
              All papers must be original and not simultaneously submitted to another journal or
              conference. The contributions to MOBISEC {year} must be submitted to the conference
              submission system:{" "}
              <a
                href={yearConfig.submissionUrl}
                className="text-primary hover:text-primary/80 underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                EasyChair
              </a>
            </p>
          </div>

          {/* (1) Regular Paper */}
          <div
            id="regular-paper"
            className={`${glassCard} p-6 sm:p-8 flex flex-col gap-8 scroll-mt-24`}
          >
            <h2 className={`title ${sectionHeader} text-foreground`}>{t("sectionRegularPaper")}</h2>

            <div className={subsectionBlock}>
              <p className="tag text-primary mb-3">{t("importantDates")}</p>
              <ol className="list relative ml-4">
                {cfpData.importantDates.originalPapers.map((item, index, arr) => {
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
                        <p className="body text-foreground font-medium leading-snug">
                          {item.title}
                        </p>
                        <p className={importantDateValueClass}>{item.date}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className={subsectionBlock}>
              <p className="tag text-primary mb-2">{t("submissionFormat")}</p>
              <p className="body text-muted-foreground mb-3">{t("regularPaperDescription")}</p>
              <p className="body text-muted-foreground mb-3">{t("regularPaperFileFormat")}</p>
              <div className="flex flex-col gap-3">
                <a
                  href="https://easychair.org/publications/easychair.zip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  EasyChair LaTeX class file (US letter size)
                </a>
                <a
                  href="https://easychair.org/publications/easychair.docx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  EasyChair Microsoft Word template
                </a>
              </div>
            </div>

            <div className={subsectionBlock}>
              <p className="tag text-primary mb-4">{t("requirements")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                  <p className="body text-foreground">{t("regularRequirementAnonymous")}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                  <p className="body text-foreground">{t("regularRequirementPageLength")}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                  <p className="body text-foreground">{t("regularRequirementOriginal")}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                  <p className="body text-foreground">{t("regularRequirementPdfFormat")}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                  <p className="body text-foreground">{t("regularRequirementRegistration")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* (2) Poster Paper */}
          {cfpData.importantDates.posterPapers &&
            cfpData.importantDates.posterPapers.length > 0 && (
              <div
                id="poster-paper"
                className={`${glassCard} p-6 sm:p-8 flex flex-col gap-8 scroll-mt-24`}
              >
                <h2 className={`title ${sectionHeader} text-foreground`}>
                  {t("sectionPosterPaper")}
                </h2>

                <div className={subsectionBlock}>
                  <p className="tag text-primary mb-3">{t("importantDates")}</p>
                  <ol className="list relative ml-4">
                    {cfpData.importantDates.posterPapers.map((item, index, arr) => {
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
                            <p className="body text-foreground font-medium leading-snug">
                              {item.title}
                            </p>
                            <p className={importantDateValueClass}>{item.date}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>

                <div className={subsectionBlock}>
                  <p className="tag text-primary mb-2">{t("submissionFormat")}</p>
                  <p className="body text-muted-foreground mb-3">{t("posterSubmissionFormat")}</p>
                  <p className="body text-muted-foreground mb-2">{t("regularPaperFileFormat")}</p>
                  <div className="flex flex-col gap-3">
                    <a
                      href="https://easychair.org/publications/easychair.zip"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      EasyChair LaTeX class file (US letter size)
                    </a>
                    <a
                      href="https://easychair.org/publications/easychair.docx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      EasyChair Microsoft Word template
                    </a>
                  </div>
                </div>

                <div className={subsectionBlock}>
                  <p className="tag text-primary mb-2">{t("posterAbstractTitle")}</p>
                  <p className="body text-muted-foreground mb-3">{t("posterAbstractIntro")}</p>
                  <p className="body text-muted-foreground mb-2">
                    {t("posterAbstractRequirements")}
                  </p>
                  <ul className="list list-disc list-inside text-muted-foreground space-y-1 ml-2">
                    <li>{t("posterAbstractPageLimit")}</li>
                    <li>{t("posterAbstractNotAnonymized")}</li>
                    <li>{t("posterAbstractFileFormat")}</li>
                  </ul>
                </div>

                <div className={subsectionBlock}>
                  <p className="tag text-primary mb-2">{t("posterDraftTitle")}</p>
                  <p className="body text-muted-foreground">{t("posterDraftDescription")}</p>
                </div>

                <div className={subsectionBlock}>
                  <p className="tag text-primary mb-2">{t("requirements")}</p>
                  <p className="body text-muted-foreground">{t("posterCopyrightNote")}</p>
                  <p className="body text-foreground mt-3">
                    <strong>{t("posterTrackSelection", { year })}</strong>
                  </p>
                </div>
              </div>
            )}
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
                  <Link href={yearConfig.submissionUrl} target="_blank">
                    {tCommon("submitPaper")}
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

export default AuthorInstructionPage;
