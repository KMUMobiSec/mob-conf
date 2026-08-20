import type { Metadata } from "next";
import type { ValidYear } from "@/constants/config";
import { YEAR_CONFIG } from "@/constants/config";
import { SITE_URL } from "@/constants/seo";
import ProgramSchedulePage from "@/modules/landing/program/ProgramSchedulePage";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  const config = YEAR_CONFIG[Number(year) as ValidYear];
  const pageUrl = `${SITE_URL}/${year}/program`;
  const description = `View the EBISION ${year} program schedule. Conference sessions, keynote talks, and paper presentations. ${config.venue}, ${config.location}, ${config.dates}.`;

  return {
    title: "Program Schedule",
    description,
    keywords: [`EBISION ${year} program`, "conference schedule", "session program", config.venue],
    openGraph: {
      url: pageUrl,
      title: `Program Schedule | EBISION ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    twitter: {
      title: `Program Schedule | EBISION ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    alternates: { canonical: `/${year}/program` },
  };
}

export default function ProgramRoute() {
  return <ProgramSchedulePage />;
}
