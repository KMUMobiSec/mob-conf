import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VALID_YEARS, type ValidYear, YEAR_CONFIG } from "@/constants/config";
import { SITE_URL } from "@/constants/seo";
import { YearProvider } from "@/providers/year-provider";

export function generateStaticParams() {
  return VALID_YEARS.map((year) => ({ year: String(year) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  const yearNum = Number(year);

  if (!VALID_YEARS.includes(yearNum as ValidYear)) {
    return {};
  }

  return {
    title: {
      template: `%s | MOBISEC ${year}`,
      default: `MOBISEC ${year}`,
    },
  };
}

export default async function YearLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ year: string }>;
}) {
  const { year: yearStr } = await params;
  const yearNum = Number(yearStr);

  if (!VALID_YEARS.includes(yearNum as ValidYear)) {
    notFound();
  }

  const year = yearNum as ValidYear;
  const config = YEAR_CONFIG[year];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: config.conferenceName,
    description: `The ${config.edition} KIISC International Conference on Mobile Internet Security`,
    startDate: config.startDate,
    endDate: config.endDate,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: config.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: config.city,
        addressCountry: config.countryCode,
      },
    },
    organizer: {
      "@type": "Organization",
      name: "KIISC (Korea Institute of Information Security and Cryptology)",
      url: "https://www.kiisc.or.kr",
    },
    url: `${SITE_URL}/${year}`,
    image: `${SITE_URL}/opengraph-image`,
  };

  return (
    <YearProvider year={year}>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is statically defined and safe
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </YearProvider>
  );
}
