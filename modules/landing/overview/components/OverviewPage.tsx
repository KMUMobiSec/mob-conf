import { ArrowRight, Download } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import type { ValidYear } from "@/constants/config";
import { YEAR_CONFIG } from "@/constants/config";
import { loadData } from "@/lib/data";

interface ConferenceData {
  conferenceFullTitle: string;
}

const glassCard = "bg-card/60 backdrop-blur-xl border border-border/60 rounded-lg shadow-sm";

const OverviewPage = async ({ year }: { year: ValidYear }) => {
  const t = await getTranslations("OverviewPage");
  const tCommon = await getTranslations("Common");
  const yearConfig = YEAR_CONFIG[year];
  const conf = await loadData<ConferenceData>("conference", year);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-24">
        <div className="max-w-8xl mx-auto flex flex-col gap-4">
          <p className="tag text-primary">{t("label")}</p>
          <h1 className="display text-foreground">{t("title")}</h1>
          <p className="body text-muted-foreground max-w-3xl">{conf.conferenceFullTitle}</p>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24">
        <div className="max-w-8xl mx-auto flex flex-col gap-10">
          <div className={`${glassCard} p-6 sm:p-8 flex flex-col gap-6`}>
            <p className="body text-foreground">
              During the past two decades, mobile internet technologies have been dramatically
              growing while leading to a paradigm shift in our life. Despite their revolution,
              mobile internet technologies open doors to various security threats, which should be
              addressed to keep mobile Internet environments secure and trustworthy.
            </p>
            <p className="body text-foreground">
              Even worse, the latest technologies (e.g., 6G Networks, Quantum Computing, Generative
              AI, and so forth) continuously have introduced new security challenges. Therefore, it
              is of paramount importance to study mobile internet security.
            </p>
            <p className="body text-foreground">
              The purpose of MOBISEC {year} is to bring together the academic and industry working
              on different aspects, exchange ideas, and explore new research directions for
              addressing the challenges in mobile internet security and application of cyber
              security. MOBISEC {year} also aims to publish high quality papers, which are closely
              related to various theories and practical applications in mobility management and
              cyber security to highlight the state-of-art research. In spite of focusing on
              security aspects, this conference welcomes papers which are related to mobile internet
              technologies and emerging issues in cyberspace. We expect that MOBISEC {year} will be
              a trigger for further research and technology improvements related to this important
              subject.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className={`${glassCard} p-6 sm:p-8 flex flex-col gap-4`}>
              <h2 className="heading text-foreground flex items-center">
                <span className="w-1.5 h-6 bg-primary rounded-full mr-4" />
                {t("scopeTitle")}
              </h2>
              <p className="body text-muted-foreground">{t("scopeDescription", { year })}</p>
            </div>
            <div className={`${glassCard} p-6 sm:p-8 flex flex-col gap-4`}>
              <h2 className="heading text-foreground flex items-center">
                <span className="w-1.5 h-6 bg-primary rounded-full mr-4" />
                {t("impactTitle")}
              </h2>
              <p className="body text-muted-foreground">{t("impactDescription", { year })}</p>
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
              <p className="body text-primary-foreground/80 max-w-2xl">{t("ctaDescription")}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild variant="secondaryOutline">
                  <Link href={yearConfig.cfpUrl} target="_blank">
                    <Download className="h-4 w-4" />
                    {t("downloadCfp")}
                  </Link>
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

export default OverviewPage;
