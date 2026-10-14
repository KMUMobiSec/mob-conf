import { ArrowRight, CalendarDays } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { RegistrationComingSoon } from "@/components/ui/RegistrationComingSoon";
import { CURRENT_YEAR, type ValidYear, YEAR_CONFIG } from "@/constants/config";
import { loadData } from "@/lib/data";
import CallForPapers from "./CallForPapers";
import ImageCarousel from "./ImageCarousel";
import Venue from "./Venue";

interface Collaborator {
  name: string;
  subtitle: string;
  role: string;
  logo: string;
  logoDark?: string;
}

interface ConferenceData {
  conferenceName: string;
  conferenceFullTitle: string;
  dates: string;
  venue: string;
  location: string;
  collaborators?: Collaborator[];
}

const HomePage = async ({ year }: { year: ValidYear }) => {
  const t = await getTranslations("HomePage");
  const tCommon = await getTranslations("Common");
  const conf = await loadData<ConferenceData>("conference", year);

  // "By the numbers" stats live in the program data; absent for some years.
  let stats: { value: string; label: string }[] = [];
  try {
    const program = await loadData<{ stats?: { value: string; label: string }[] }>(
      "program-flow",
      year,
    );
    stats = program.stats ?? [];
  } catch {
    stats = [];
  }
  const featuredSpeakersEnabled = !YEAR_CONFIG[year].disabledRoutes.includes("featuredSpeakers");
  return (
    <div className="flex flex-col">
      {/* ── Hero Section ── */}
      <section className="px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-24">
        <div className="max-w-8xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Left: Conference Info */}
          <div className="flex flex-col gap-8 w-full lg:w-1/2">
            <div className="flex flex-col gap-3">
              <p className="tag text-muted-foreground">{t("heroLabel")}</p>
              <h1 className="display text-primary">{conf.conferenceName}</h1>
              <p className="body text-foreground max-w-xl">{conf.conferenceFullTitle}</p>
            </div>

            <div className="flex flex-col gap-3 border-l-2 border-primary/30 pl-5">
              <p className="body text-muted-foreground">
                <span className="text-foreground font-medium">{t("dateLabel")}</span> {conf.dates}
              </p>
              <p className="body text-muted-foreground">
                <span className="text-foreground font-medium">{t("venueLabel")}</span> {conf.venue},{" "}
                {conf.location}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <RegistrationComingSoon
                title={tCommon("registrationComingSoonTitle")}
                description={tCommon("registrationComingSoonDescription", { year })}
                closeLabel={tCommon("close")}
              >
                <Button size="lg">
                  {tCommon("register")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </RegistrationComingSoon>
              {featuredSpeakersEnabled ? (
                <Button asChild size="lg" variant="outline">
                  <Link href={`/${year}/featured-speakers`}>
                    {tCommon("featuredSpeakers")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" variant="outline">
                  <Link href={`/${year}/author-instruction`}>
                    {tCommon("submitPaper")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="lg">
                <Link href={`/${year}/overview`}>{tCommon("learnMore")}</Link>
              </Button>
              {year < CURRENT_YEAR && (
                <Button asChild variant="secondary" size="lg">
                  <Link href={`/${CURRENT_YEAR}`}>
                    <CalendarDays className="h-4 w-4" />
                    {t("goToUpcomingEvent", { year: String(CURRENT_YEAR) })}
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Right: Image Carousel */}
          <div className="w-full lg:w-1/2">
            <ImageCarousel />
          </div>
        </div>
      </section>

      {/* ── By the Numbers (stats) ── */}
      {stats.length > 0 && (
        <section className="px-4 sm:px-8 lg:px-12 py-12 sm:py-16">
          <div className="max-w-8xl mx-auto flex flex-col gap-8">
            <div className="text-center">
              <p className="tag text-primary mb-2">{t("statsLabel")}</p>
              <h2 className="heading text-foreground">{t("statsTitle")}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-card/60 p-5 text-center shadow-sm backdrop-blur-xl transition-all hover:border-primary/30"
                >
                  <span className="display-number text-4xl text-primary sm:text-5xl">
                    {stat.value}
                  </span>
                  <span className="caption text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Organized By ── */}
      <section className=" border-y border-border/40 px-4 sm:px-8 lg:px-12 py-12 sm:py-16">
        <div className="max-w-8xl mx-auto flex flex-col gap-8">
          <div className="text-center">
            <p className="tag text-primary mb-2">{t("collaboratorsLabel")}</p>
            <h2 className="heading text-foreground">{t("collaboratorsTitle")}</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {(conf.collaborators ?? []).map((collab) => (
              <div
                key={collab.name}
                className="bg-background/60 backdrop-blur-md border border-border/50 rounded-lg p-6 sm:p-8 flex flex-col items-center text-center gap-4 max-w-sm w-full transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <small className="caption text-primary">{collab.role}</small>
                <Image
                  src={collab.logo}
                  alt={`${collab.name} Logo`}
                  width={80}
                  height={80}
                  loading="lazy"
                  className={`object-contain w-24 h-16 ${collab.logoDark ? "dark:hidden" : ""}`}
                />
                {collab.logoDark && (
                  <Image
                    src={collab.logoDark}
                    alt={`${collab.name} Logo`}
                    width={80}
                    height={80}
                    loading="lazy"
                    className="hidden object-contain w-24 h-16 dark:block"
                  />
                )}
                <div className="flex flex-col gap-1">
                  <h3 className="subheading text-foreground">{collab.name}</h3>
                  <small className="caption text-muted-foreground">{collab.subtitle}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Venue Section ── */}
      <section className="px-4 sm:px-8 lg:px-12 py-16 sm:py-24">
        <div className="max-w-8xl mx-auto">
          <Venue year={year} />
        </div>
      </section>

      {/* ── Call for Papers Section ── */}
      <section className="px-4 sm:px-8 lg:px-12 py-16 sm:py-24">
        <div className="max-w-8xl mx-auto">
          <CallForPapers year={year} />
        </div>
      </section>
    </div>
  );
};

export default HomePage;
