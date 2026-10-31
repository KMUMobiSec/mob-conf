import { ExternalLink, Globe2, Mail } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import type { ValidYear } from "@/constants/config";
import { loadRegistrationYearData } from "@/modules/landing/registration-payment/lib/categories";

const glassCard = "bg-card/60 backdrop-blur-xl border border-border/60 rounded-lg shadow-sm";

const RegistrationGuidePage = async ({ year }: { year: ValidYear }) => {
  const t = await getTranslations("RegistrationGuidePage");
  const tCommon = await getTranslations("Common");
  const data = await loadRegistrationYearData(year);

  const deadline = new Date(`${data.registrationEnd}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="flex flex-col">
      <section className="px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-24">
        <div className="max-w-8xl mx-auto flex flex-col gap-4 items-center text-center">
          <h1 className="display text-foreground">{t("title")}</h1>
          <p className="body text-muted-foreground max-w-xl">{t("subtitle")}</p>
        </div>
      </section>

      <section className="px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24">
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <p className="tag text-primary">MOBISEC {year}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Local — Residing in Korea */}
            <div className={`${glassCard} p-6 sm:p-8 flex flex-col gap-5`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">
                  🇰🇷
                </span>
                <div>
                  <p className="caption text-muted-foreground">MOBISEC {year}</p>
                  <h2 className="subheading text-foreground">{t("localTitle")}</h2>
                </div>
              </div>
              <p className="body text-muted-foreground flex-1">{t("localDescription")}</p>
              <Button asChild size="lg">
                <a href={data.localRegistrationUrl} target="_blank" rel="noopener noreferrer">
                  {t("localButton")}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>

            {/* Foreign — Outside Korea */}
            <div className={`${glassCard} p-6 sm:p-8 flex flex-col gap-5`}>
              <div className="flex items-center gap-3">
                <Globe2 className="h-7 w-7 text-primary shrink-0" />
                <div>
                  <p className="caption text-muted-foreground">MOBISEC {year}</p>
                  <h2 className="subheading text-foreground">{t("foreignTitle")}</h2>
                </div>
              </div>
              <p className="body text-muted-foreground flex-1">{t("foreignDescription")}</p>
              <Button asChild size="lg" variant="secondary">
                <Link href={`/${year}/registration-payment`}>{t("foreignButton")}</Link>
              </Button>
            </div>
          </div>

          <ul className="list flex flex-col gap-2 text-muted-foreground">
            <li>• {t("noteDeadline", { date: deadline })}</li>
            <li>• {t("noteNoCancel")}</li>
            <li>• {t("noteNoRefund")}</li>
          </ul>

          <div className="flex flex-col items-center gap-3 border-t border-border pt-8 text-center">
            <p className="body text-muted-foreground">{t("questions")}</p>
            <Button asChild variant="outline">
              <a href={`mailto:${tCommon("email")}`}>
                <Mail className="h-4 w-4" />
                {tCommon("email")}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RegistrationGuidePage;
