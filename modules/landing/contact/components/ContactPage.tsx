import { ArrowRight, Calendar, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import type { ValidYear } from "@/constants/config";
import { YEAR_CONFIG } from "@/constants/config";
import { loadData } from "@/lib/data";

interface ConferenceData {
  conferenceName: string;
  conferenceFullTitle: string;
  dates: string;
  venue: string;
  location: string;
}

const glassCard = "bg-card/60 backdrop-blur-xl border border-border/60 rounded-lg shadow-sm";

const ContactPage = async ({ year }: { year: ValidYear }) => {
  const t = await getTranslations("ContactPage");
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
          <p className="body text-muted-foreground max-w-3xl">{t("subtitle", { year })}</p>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24">
        <div className="max-w-8xl mx-auto flex flex-col gap-10">
          {/* Contact Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* General Inquiries */}
            <div className={`${glassCard} p-6 sm:p-8 flex flex-col gap-4`}>
              <h2 className="heading text-foreground flex items-center">
                <span className="w-1.5 h-6 bg-primary rounded-full mr-4" />
                {t("generalInquiries")}
              </h2>
              <p className="body text-muted-foreground">
                {t("generalInquiriesDescription", { year })}
              </p>
              <div className="flex items-center gap-3 mt-auto pt-2">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a
                  href={`mailto:${tCommon("email")}`}
                  className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors break-all sm:break-normal"
                >
                  {tCommon("email")}
                </a>
              </div>
            </div>

            {/* Conference Info */}
            <div className={`${glassCard} p-6 sm:p-8 flex flex-col gap-4`}>
              <h2 className="heading text-foreground flex items-center">
                <span className="w-1.5 h-6 bg-primary rounded-full mr-4" />
                {t("conferenceInfo")}
              </h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="body text-foreground">{conf.dates}</p>
                    <small className="caption text-muted-foreground">{t("conferenceDates")}</small>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="body text-foreground">{conf.venue}</p>
                    <small className="caption text-muted-foreground">{conf.location}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Response Note */}
          <div className={`${glassCard} p-6 sm:p-8 text-center`}>
            <p className="body text-muted-foreground">{t("responseNote")}</p>
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
              <p className="body text-primary-foreground/80 max-w-2xl">
                {t("ctaDescription", { year })}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild variant="secondaryOutline">
                  <Link href={`/${year}/author-instruction`}>{tCommon("authorInstructions")}</Link>
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

export default ContactPage;
