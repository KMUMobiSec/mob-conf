import { BookOpen, Calendar, ExternalLink, MapPin, Users } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { CURRENT_YEAR, VALID_YEARS, type ValidYear, YEAR_CONFIG } from "@/constants/config";

import { loadData } from "@/lib/data";

const glassCard = "bg-card/60 backdrop-blur-xl border border-border/60 rounded-lg shadow-sm";

interface PreviousEventsData {
  conferences: {
    year: string;
    title: string;
    dates: string;
    location: string;
    venue: string;
    status: string;
    website: string;
    image: string;
    description: string;
    proceedings: string;
    topics: string[];
    organizedBy: string;
    inConjunction: string;
  }[];
  statistics: {
    totalEditions: number;
    countries: number;
    description: string;
  };
}

const PreviousEventsPage = async ({ year }: { year: ValidYear }) => {
  const t = await getTranslations("PreviousEventsPage");
  const tCommon = await getTranslations("Common");
  const previousEventsData = await loadData<PreviousEventsData>("previous-events", year);

  const currentConfig = YEAR_CONFIG[CURRENT_YEAR];

  // Build host locations from YEAR_CONFIG — current year is upcoming, rest are past
  const hostLocations = [...VALID_YEARS]
    .sort((a, b) => b - a) // newest first
    .map((y) => {
      const config = YEAR_CONFIG[y];
      return {
        year: y,
        city: config.city,
        location: config.location,
        isUpcoming: y === CURRENT_YEAR,
      };
    });

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-24">
        <div className="max-w-8xl mx-auto flex flex-col gap-4">
          <p className="tag text-primary">{t("label")}</p>
          <h1 className="display text-foreground">{t("title")}</h1>
          <p className="body text-muted-foreground max-w-3xl">
            {previousEventsData.statistics.description}
          </p>
        </div>
      </section>

      {/* Host Locations */}
      <section className="px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24">
        <div className="max-w-8xl mx-auto flex flex-col gap-6">
          <h2 className="heading text-foreground flex items-center">
            <span className="w-1.5 h-6 bg-primary rounded-full mr-4" />
            {t("hostLocations")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hostLocations.map((loc) => (
              <div key={loc.year} className={`${glassCard} p-5 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-8 rounded overflow-hidden shrink-0">
                    <Image
                      src={`/assets/venue/${loc.year}/venue.jpg`}
                      alt={`EBISION ${loc.year}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="body text-foreground">{loc.location}</p>
                    <small className="caption text-muted-foreground">EBISION {loc.year}</small>
                  </div>
                </div>
                {loc.isUpcoming ? (
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {tCommon("upcoming")}
                  </span>
                ) : (
                  <span className="bg-muted text-muted-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {t("past")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Event */}
      <section className="px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24">
        <div className="max-w-8xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <p className="tag text-primary">{t("upcomingLabel")}</p>
            <h2 className="title text-foreground">{t("upcomingTitle", { year: CURRENT_YEAR })}</h2>
            <p className="body text-muted-foreground max-w-3xl">
              {t("upcomingSubtitle", { edition: currentConfig.edition })}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Event Image */}
            <div className="relative w-full lg:w-1/2 aspect-video rounded-lg overflow-hidden border-2 border-primary/40">
              <Image
                src={`/assets/venue/${CURRENT_YEAR}/venue.jpg`}
                alt={`EBISION ${CURRENT_YEAR} — ${currentConfig.venue}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                <h3 className="subheading text-white mb-1">{currentConfig.venue}</h3>
                <p className="body text-white/80 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {currentConfig.location}
                </p>
              </div>
              <div className="absolute top-4 left-4">
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  {tCommon("upcoming")}
                </span>
              </div>
            </div>

            {/* Event Details */}
            <div className="flex flex-col gap-4 w-full lg:w-1/2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`${glassCard} p-4 flex items-start gap-3`}>
                  <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <small className="caption text-muted-foreground">{t("datesLabel")}</small>
                    <p className="body text-foreground">{currentConfig.dates}</p>
                  </div>
                </div>
                <div className={`${glassCard} p-4 flex items-start gap-3`}>
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <small className="caption text-muted-foreground">{t("venueLabel")}</small>
                    <p className="body text-foreground">{currentConfig.venue}</p>
                  </div>
                </div>
                <div className={`${glassCard} p-4 flex items-start gap-3`}>
                  <Users className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <small className="caption text-muted-foreground">{t("organizedByLabel")}</small>
                    <p className="body text-foreground">IFIP WG 8.4</p>
                  </div>
                </div>
                <div className={`${glassCard} p-4 flex items-start gap-3`}>
                  <BookOpen className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <small className="caption text-muted-foreground">{t("proceedingsLabel")}</small>
                    <p className="body text-foreground">Springer IFIP AICT Series</p>
                  </div>
                </div>
              </div>
              <Button asChild variant="outline" className="w-fit">
                <a href={`/${CURRENT_YEAR}`}>
                  {t("visitWebsite", { year: String(CURRENT_YEAR) })}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Past Conferences */}
      {previousEventsData.conferences.length > 0 && (
        <section className="px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24">
          <div className="max-w-8xl mx-auto flex flex-col gap-12">
            {previousEventsData.conferences.map((conference, index) => (
              <div key={conference.year} className="flex flex-col gap-8">
                {/* Conference Header */}
                <div
                  className={`flex flex-col gap-2 ${index % 2 === 0 ? "items-end text-right" : ""}`}
                >
                  <p className="tag text-primary">{conference.year}</p>
                  <h2 className="title text-foreground">EBISION {conference.year}</h2>
                  <p className="body text-muted-foreground max-w-3xl">{conference.title}</p>
                </div>

                <div
                  className={`flex flex-col gap-8 ${index % 2 === 0 ? "lg:flex-row-reverse" : "lg:flex-row"}`}
                >
                  {/* Event Image */}
                  <div className="relative w-full lg:w-1/2 aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={conference.image}
                      alt={`EBISION ${conference.year}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                      <h3 className="subheading text-white mb-1">{conference.venue}</h3>
                      <p className="body text-white/80 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {conference.location}
                      </p>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="flex flex-col gap-4 w-full lg:w-1/2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className={`${glassCard} p-4 flex items-start gap-3`}>
                        <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <small className="caption text-muted-foreground">{t("datesLabel")}</small>
                          <p className="body text-foreground">{conference.dates}</p>
                        </div>
                      </div>
                      <div className={`${glassCard} p-4 flex items-start gap-3`}>
                        <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <small className="caption text-muted-foreground">
                            {t("locationLabel")}
                          </small>
                          <p className="body text-foreground">{conference.location}</p>
                        </div>
                      </div>
                      <div className={`${glassCard} p-4 flex items-start gap-3`}>
                        <Users className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <small className="caption text-muted-foreground">
                            {t("organizedByLabel")}
                          </small>
                          <p className="body text-foreground">{conference.organizedBy}</p>
                        </div>
                      </div>
                      <div className={`${glassCard} p-4 flex items-start gap-3`}>
                        <BookOpen className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <small className="caption text-muted-foreground">
                            {t("proceedingsLabel")}
                          </small>
                          <p className="body text-foreground">{conference.proceedings}</p>
                        </div>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="w-fit">
                      <a href={`/${conference.year}`}>
                        {t("visitWebsite", { year: conference.year })}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default PreviousEventsPage;
