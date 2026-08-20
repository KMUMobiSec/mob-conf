import { ArrowRight, CheckCircle, Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ValidYear } from "@/constants/config";
import { YEAR_CONFIG } from "@/constants/config";
import { loadData } from "@/lib/data";
import { cn } from "@/lib/helpers/utils";

const glassCard = "bg-background/10 backdrop-blur-sm border border-border/60 rounded-lg";

const proceedingsCardBase = "rounded-xl border p-5 sm:p-6 flex flex-col gap-3 shadow-sm";
const proceedingsCardEmphasized =
  "border-primary/50 bg-primary/10 dark:bg-primary/12 ring-1 ring-primary/25";
const proceedingsCardMuted = "border-border/70 bg-card/50";

const subsectionBlock =
  "pl-4 border-l-4 border-primary/50 bg-primary/5 dark:bg-primary/10 rounded-r-lg py-4 pr-4";

const importantDateValueClass =
  "mt-1 block text-lg sm:text-xl font-bold tabular-nums leading-snug text-primary";

const sectionHeader = "flex items-center gap-3 mb-5 pb-3 border-b border-border/60";

interface CallForPapersData {
  title: string;
  description: string;
  topics: string[];
  importantDates: {
    originalPapers: { title: string; date: string; color: string }[];
    posterPapers?: { title: string; date: string; color: string }[];
  };
  submissionGuidelines: {
    paperCategories: string[];
    requirements: (
      | string
      | {
          text: string;
          link: { text: string; href: string; target: string };
          textAfter: string;
          link2: { text: string; href: string; target: string };
          textEnd: string;
        }
    )[];
  };
  proceedings: {
    title: string;
    items?: string[];
    attendeeNote?: string;
    stages?: { badge: string; heading: string; text: string }[];
    specialIssuesTitle?: string;
    specialIssuesIntro?: string;
    specialIssues?: {
      kind: string;
      topic: string;
      journal: string;
      indexing: string;
      url: string;
      /** Optional local PDF (e.g. topical collection / special issue flyer). */
      pdf?: string;
    }[];
  };
  callToAction: {
    title: string;
    description: string;
    buttons: { text: string; type: string; link: string }[];
  };
  contact: { email: string; message: string };
}

const CallForPapers = async ({ year }: { year: ValidYear }) => {
  const t = await getTranslations("CallForPapers");
  const tCommon = await getTranslations("Common");
  const callForPapersData = await loadData<CallForPapersData>("call-for-papers", year);
  const yearConfig = YEAR_CONFIG[year];
  return (
    <div className="flex flex-col gap-14">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <p className="tag text-primary">{t("submissionsLabel")}</p>
        <h2 className="title text-foreground">{callForPapersData.title}</h2>
        <p className="body text-muted-foreground max-w-xl">{callForPapersData.description}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
          <a
            href={yearConfig.cfpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
          >
            <Download className="w-4 h-4 shrink-0" />
            {t("fullCfpPdf")}
          </a>
          <a
            href={yearConfig.cfpLeafletUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
          >
            <Download className="w-4 h-4 shrink-0" />
            {t("cfpLeafletPdf")}
          </a>
        </div>
      </div>

      {/* (1) Regular Paper & (2) Poster Paper — Two column */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* (1) Regular Paper */}
        <div
          className={`${glassCard} p-6 sm:p-8 flex flex-col gap-6 w-full ${
            callForPapersData.importantDates.posterPapers?.length ? "lg:w-1/2" : "lg:w-full"
          }`}
        >
          <h2 className={`title ${sectionHeader} text-foreground`}>{t("sectionRegularPaper")}</h2>
          <div className={subsectionBlock}>
            <p className="tag text-primary mb-3">{t("importantDatesTitle")}</p>
            <ol className="list relative ml-4">
              {callForPapersData.importantDates.originalPapers.map((dateItem, index) => {
                const isLast = index === callForPapersData.importantDates.originalPapers.length - 1;
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
                        {dateItem.title}
                      </p>
                      <p className={importantDateValueClass}>{dateItem.date}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className={subsectionBlock}>
            <p className="tag text-primary mb-3">{t("submissionRequirementsTitle")}</p>
            <ul className="list flex flex-col gap-2">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                <p className="body text-foreground">{t("regularRequirementAnonymous")}</p>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                <p className="body text-foreground">{t("regularRequirementPdfFormat")}</p>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                <p className="body text-foreground">{t("regularRequirementPageLength")}</p>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                <p className="body text-foreground">{t("regularRequirementOriginal")}</p>
              </li>
            </ul>
          </div>
        </div>

        {/* (2) Poster Paper */}
        {callForPapersData.importantDates.posterPapers &&
        callForPapersData.importantDates.posterPapers.length > 0 ? (
          <div className={`${glassCard} p-6 sm:p-8 flex flex-col gap-6 w-full lg:w-1/2`}>
            <h2 className={`title ${sectionHeader} text-foreground`}>{t("sectionPosterPaper")}</h2>
            <div className={subsectionBlock}>
              <p className="tag text-primary mb-3">{t("importantDatesTitle")}</p>
              <ol className="list relative ml-4">
                {callForPapersData.importantDates.posterPapers.map((dateItem, index) => {
                  const isLast =
                    index === (callForPapersData.importantDates.posterPapers?.length ?? 0) - 1;
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
                          {dateItem.title}
                        </p>
                        <p className={importantDateValueClass}>{dateItem.date}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className={subsectionBlock}>
              <p className="tag text-primary mb-3">{t("submissionRequirementsTitle")}</p>
              <ul className="list flex flex-col gap-2">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                  <p className="body text-foreground">{t("posterRequirementFormat")}</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                  <p className="body text-foreground">{t("posterRequirementAbstract")}</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                  <p className="body text-foreground">{t("posterRequirementDraft")}</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                  <p className="body text-foreground">{t("posterRequirementTrack", { year })}</p>
                </li>
              </ul>
            </div>
          </div>
        ) : null}
      </div>

      {/* General Requirements */}
      <div className={`${glassCard} p-6 sm:p-8`}>
        <h2 className="title text-foreground flex items-center mb-4">
          <span className="w-1.5 h-6 bg-primary rounded-full mr-4" />
          {t("generalRequirementsTitle")}
        </h2>
        <p className="body text-foreground">
          {t("generalRequirementsDescription", { year })}{" "}
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

      {/* Full Guidelines Link */}
      <div
        className={`${glassCard} p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4`}
      >
        <p className="body text-muted-foreground">
          {t("fullGuidelinesNote")}{" "}
          <Link
            href={`/${year}/author-instruction`}
            className="text-primary hover:text-primary/80 font-medium underline"
          >
            {t("authorInstructionsPage")}
          </Link>
          {t("fullGuidelinesSuffix") || "."}
        </p>
        <Button asChild variant="outline">
          <Link href={`/${year}/author-instruction`}>{tCommon("authorInstructions")}</Link>
        </Button>
      </div>

      {/* Proceedings & Post Publications */}
      <div className={`${glassCard} p-6 sm:p-8`}>
        <h2 className="title text-foreground flex items-center mb-6">
          <span className="w-1.5 h-6 bg-primary rounded-full mr-4" />
          {callForPapersData.proceedings.title}
        </h2>

        {callForPapersData.proceedings.attendeeNote ? (
          <p className="body text-foreground border-l-4 border-primary pl-4 py-1 mb-8 bg-primary/5 dark:bg-primary/10 rounded-r-md">
            {callForPapersData.proceedings.attendeeNote}
          </p>
        ) : null}

        {callForPapersData.proceedings.stages && callForPapersData.proceedings.stages.length > 0 ? (
          <div className="flex flex-col gap-10">
            <div className="grid gap-4 lg:grid-cols-2">
              {callForPapersData.proceedings.stages.map((stage, index) => (
                <div
                  key={stage.heading}
                  className={cn(
                    proceedingsCardBase,
                    index === 1 ? proceedingsCardEmphasized : proceedingsCardMuted,
                  )}
                >
                  <Badge
                    variant={index === 1 ? "default" : "secondary"}
                    className="w-fit font-semibold tracking-wide uppercase text-xs px-2.5 py-0.5"
                  >
                    {stage.badge}
                  </Badge>
                  <h3 className="heading text-foreground">{stage.heading}</h3>
                  <p className="body text-muted-foreground">{stage.text}</p>
                </div>
              ))}
            </div>

            {callForPapersData.proceedings.specialIssues &&
            callForPapersData.proceedings.specialIssues.length > 0 ? (
              <div className="border-t border-border/60 pt-10 flex flex-col gap-6">
                <div className="space-y-2">
                  <h3 className="heading text-foreground">
                    {callForPapersData.proceedings.specialIssuesTitle}
                  </h3>
                  <p className="body text-muted-foreground max-w-3xl">
                    {callForPapersData.proceedings.specialIssuesIntro}
                  </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {callForPapersData.proceedings.specialIssues.map((issue) => (
                    <div
                      key={issue.url}
                      className={cn(proceedingsCardBase, proceedingsCardEmphasized)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="default"
                          className="w-fit font-semibold tracking-wide uppercase text-xs px-2.5 py-0.5"
                        >
                          {issue.kind}
                        </Badge>
                        <Badge
                          variant="default"
                          className="font-medium bg-amber-400 text-amber-950 hover:bg-amber-500 dark:bg-amber-400 dark:text-amber-950 dark:hover:bg-amber-500 text-xs px-2.5 py-0.5"
                        >
                          {issue.indexing}
                        </Badge>
                      </div>
                      <h4 className="subheading text-foreground">{issue.topic}</h4>
                      <p className="body text-muted-foreground">{issue.journal}</p>
                      <div className="flex flex-col gap-2 pt-1 mt-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
                        <a
                          href={issue.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold hover:underline"
                        >
                          {t("proceedingsJournalLink")}
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        </a>
                        {issue.pdf ? (
                          <a
                            href={issue.pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold hover:underline"
                          >
                            <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            {t("proceedingsOutletPdf")}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : callForPapersData.proceedings.items ? (
          <ul className="list flex flex-col gap-3">
            {callForPapersData.proceedings.items.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-primary/60 mt-2.5 shrink-0 rounded-full" />
                <span className="text-foreground flex-1">{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* Topics of Interest */}
      <div className={`${glassCard} p-6 sm:p-8`}>
        <h2 className="title text-foreground flex items-center mb-6">
          <span className="w-1.5 h-6 bg-primary rounded-full mr-4" />
          {t("topicsTitle")}
        </h2>
        <ul className="list grid grid-cols-1 md:grid-cols-2 gap-3">
          {callForPapersData.topics.map((topic, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-primary/60 mt-2.5 shrink-0 rounded-full" />
              <span className="text-foreground flex-1">{topic}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Call to Action */}
      <div className="bg-primary/90 backdrop-blur-xl rounded-lg p-8 sm:p-12 relative overflow-hidden">
        {/* Decorative blur blobs */}
        <div
          aria-hidden="true"
          className="absolute -top-20 -right-20 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-20 -left-20 w-48 h-48 bg-primary-foreground/5 rounded-full blur-3xl"
        />
        <div className="relative text-center flex flex-col gap-6 items-center">
          <h2 className="title text-primary-foreground">{callForPapersData.callToAction.title}</h2>
          <p className="body text-primary-foreground/80 max-w-lg">
            {callForPapersData.callToAction.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {callForPapersData.callToAction.buttons.map((btn, index) => {
              const href = btn.link.startsWith("/") ? `/${year}${btn.link}` : btn.link;
              const isExternal = btn.link.startsWith("http");
              return (
                <Button
                  key={index}
                  asChild
                  variant={index === 0 ? "secondaryOutline" : "secondary"}
                >
                  {isExternal ? (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {btn.text}
                      {index > 0 && <ArrowRight className="h-4 w-4" />}
                    </a>
                  ) : (
                    <Link href={href}>
                      {btn.text}
                      {index > 0 && <ArrowRight className="h-4 w-4" />}
                    </Link>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-accent/60 backdrop-blur-xl rounded-lg border border-border/40 p-6 sm:p-8 text-center">
        <p className="body text-foreground">
          {callForPapersData.contact.message}{" "}
          <Link
            href={`mailto:${callForPapersData.contact.email}`}
            className="text-primary hover:text-primary/80 font-medium underline"
          >
            {callForPapersData.contact.email}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CallForPapers;
