import { ArrowRight, Building2, Calendar, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CURRENT_YEAR, VALID_YEARS, type ValidYear, YEAR_CONFIG } from "@/constants/config";
import { loadData } from "@/lib/data";

export const metadata: Metadata = {
  title: "MOBISEC — International Conference on Mobile Internet Security",
  description:
    "The KIISC International Conference on Mobile Internet Security. Browse all editions.",
  alternates: { canonical: "/" },
};

const glassCard = "bg-card/60 backdrop-blur-xl border border-border/60 rounded-lg shadow-sm";

interface PreviousEventsData {
  conferences: {
    year: string;
    title: string;
    dates: string;
    location: string;
    venue: string;
    website: string;
    image?: string;
  }[];
}

interface EditionCard {
  year: string;
  conferenceName: string;
  edition: string;
  dates: string;
  venue: string;
  location: string;
  image?: string;
  href: string;
  external: boolean;
  isUpcoming: boolean;
}

function isExternalHref(href: string): boolean {
  return /^https?:\/\//.test(href);
}

export default async function RootPage() {
  // Years with a full microsite on this domain (nav, forms, registration, etc).
  const hostedYears = new Set<ValidYear>(VALID_YEARS);

  const hostedEditions: EditionCard[] = [...VALID_YEARS].map((year) => {
    const config = YEAR_CONFIG[year];
    return {
      year: String(year),
      conferenceName: config.conferenceName,
      edition: config.edition,
      dates: config.dates,
      venue: config.venue,
      location: config.location,
      image: `/assets/venue/${year}/venue.jpg`,
      href: `/${year}`,
      external: false,
      isUpcoming: year >= CURRENT_YEAR,
    };
  });

  let archiveEditions: EditionCard[] = [];
  try {
    const previousEvents = await loadData<PreviousEventsData>("previous-events", CURRENT_YEAR);
    archiveEditions = previousEvents.conferences
      .filter((c) => !hostedYears.has(Number(c.year) as ValidYear))
      .map((c) => ({
        year: c.year,
        conferenceName: `MOBISEC ${c.year}`,
        edition: "",
        dates: c.dates,
        venue: c.venue,
        location: c.location,
        image: c.image,
        href: c.website,
        external: isExternalHref(c.website),
        isUpcoming: false,
      }));
  } catch {
    archiveEditions = [];
  }

  const editions = [...hostedEditions, ...archiveEditions].sort(
    (a, b) => Number(b.year) - Number(a.year),
  );

  return (
    <main className="relative min-h-screen">
      {/* Background grid lines */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 mx-auto max-w-8xl">
        <div className="flex h-full justify-evenly">
          <div className="w-px bg-foreground/10" />
          <div className="w-px bg-foreground/10" />
          <div className="w-px bg-foreground/10" />
        </div>
      </div>

      <div className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-8 py-16 sm:py-24 flex flex-col items-center gap-12">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-6">
          <Image
            src="/assets/logo/mobisec-logo.png"
            alt="MOBISEC Logo"
            width={160}
            height={120}
            priority
            className="h-14 w-auto dark:hidden"
          />
          <Image
            src="/assets/logo/mobisec-logo-white.png"
            alt="MOBISEC Logo"
            width={160}
            height={120}
            priority
            className="hidden h-14 w-auto dark:block"
          />
          <div className="flex flex-col gap-2">
            <p className="tag text-primary">KIISC</p>
            <h1 className="display text-foreground">
              International Conference on Mobile Internet Security
            </h1>
            <p className="body text-muted-foreground max-w-xl mx-auto">
              Browse all editions of the MOBISEC symposium since 2016. Select an event to view its
              program, keynotes, and more.
            </p>
          </div>
        </div>

        {/* Event Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {editions.map((ed) => (
            <Link
              key={ed.year}
              href={ed.href}
              target={ed.external ? "_blank" : undefined}
              rel={ed.external ? "noopener noreferrer" : undefined}
              className={`${glassCard} group flex flex-col overflow-hidden transition-all hover:shadow-md ${
                ed.isUpcoming ? "border-primary/60 hover:border-primary" : "hover:border-border"
              }`}
            >
              {/* Venue Image */}
              <div className="relative w-full aspect-video overflow-hidden bg-muted">
                {ed.image ? (
                  <Image
                    src={ed.image}
                    alt={`${ed.conferenceName} — ${ed.venue}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Building2 className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />

                {/* Badge */}
                <div className="absolute top-3 left-3">
                  {ed.isUpcoming ? (
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      Upcoming
                    </span>
                  ) : (
                    <span className="bg-muted text-muted-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      Past
                    </span>
                  )}
                </div>

                {/* Year overlay */}
                <div className="absolute bottom-3 left-4">
                  <h2 className="subheading text-white">{ed.conferenceName}</h2>
                  {ed.edition && (
                    <small className="caption text-white/70">The {ed.edition} Edition</small>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-col gap-3 p-5">
                <div className="flex flex-col gap-2">
                  <p className="caption text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                    {ed.dates}
                  </p>
                  <p className="caption text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    {ed.venue ? `${ed.venue}, ${ed.location}` : ed.location}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-primary text-sm font-medium mt-1 group-hover:gap-2.5 transition-all">
                  View Event
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer note */}
        <small className="caption text-muted-foreground text-center">
          © {CURRENT_YEAR} MOBISEC. All rights reserved.
        </small>
      </div>
    </main>
  );
}
