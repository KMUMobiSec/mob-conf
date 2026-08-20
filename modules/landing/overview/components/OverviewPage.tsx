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
              We are living in an era of digital great transformation, where revolutionary advances
              in technology are reshaping every dimension of E-Business. Artificial intelligence,
              quantum computing, 6G mobile communications, cloud ecosystems, robotics, blockchain,
              and Web 3.0 are no longer distant visions but emerging realities that are redefining
              how businesses and societies operate.
            </p>
            <p className="body text-foreground">
              These developments demand a paradigm shift in E-Business Information Systems (EBIS)—a
              shift that must be approached through truly multidisciplinary perspectives, spanning
              not only technology and organizations but also society, culture, consumers, and global
              infrastructures.
            </p>
            <p className="body text-foreground">
              As the flagship event of IFIP Working Group 8.4, EBISION {year} provides an
              international forum to explore this paradigm shift, share insights across disciplines,
              and envision the next stage of EBIS evolution. The symposium encourages contributions
              that highlight both theoretical advancements and practical success stories,
              demonstrating how innovations can be effectively translated into sustainable impact
              across industries, economies, and societies.
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
