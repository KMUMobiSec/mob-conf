import { ArrowRight, Calendar, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CURRENT_YEAR, VALID_YEARS, YEAR_CONFIG } from "@/constants/config";

export const metadata: Metadata = {
  title: "MOBISEC — International Conference on Mobile Internet Security",
  description:
    "The KIISC International Conference on Mobile Internet Security. Browse all editions.",
  alternates: { canonical: "/" },
};

const glassCard = "bg-card/60 backdrop-blur-xl border border-border/60 rounded-lg shadow-sm";

export default function RootPage() {
  const years = [...VALID_YEARS].sort((a, b) => b - a);

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

      <div className="relative z-10 max-w-4xl w-full mx-auto px-4 sm:px-8 py-16 sm:py-24 flex flex-col items-center gap-12">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-6">
          <Image
            src="/assets/logo/ebision-logo.svg"
            alt="MOBISEC Logo"
            width={160}
            height={60}
            priority
            className="h-14 w-auto"
          />
          <div className="flex flex-col gap-2">
            <p className="tag text-primary">KIISC</p>
            <h1 className="display text-foreground">
              International Conference on Mobile Internet Security
            </h1>
            <p className="body text-muted-foreground max-w-xl mx-auto">
              Browse all editions of the MOBISEC symposium. Select an event to view its program,
              keynotes, and more.
            </p>
          </div>
        </div>

        {/* Event Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {years.map((year) => {
            const config = YEAR_CONFIG[year];
            const isUpcoming = year >= CURRENT_YEAR;

            return (
              <Link
                key={year}
                href={`/${year}`}
                className={`${glassCard} group flex flex-col overflow-hidden transition-all hover:shadow-md ${
                  isUpcoming ? "border-primary/60 hover:border-primary" : "hover:border-border"
                }`}
              >
                {/* Venue Image */}
                <div className="relative w-full aspect-video overflow-hidden">
                  <Image
                    src={`/assets/venue/${year}/venue.jpg`}
                    alt={`${config.conferenceName} — ${config.venue}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />

                  {/* Badge */}
                  <div className="absolute top-3 left-3">
                    {isUpcoming ? (
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
                    <h2 className="subheading text-white">{config.conferenceName}</h2>
                    <small className="caption text-white/70">The {config.edition} Edition</small>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col gap-3 p-5">
                  <div className="flex flex-col gap-2">
                    <p className="caption text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                      {config.dates}
                    </p>
                    <p className="caption text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      {config.venue}, {config.location}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-primary text-sm font-medium mt-1 group-hover:gap-2.5 transition-all">
                    View Event
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer note */}
        <small className="caption text-muted-foreground text-center">
          © {CURRENT_YEAR} MOBISEC. All rights reserved.
        </small>
      </div>
    </main>
  );
}
