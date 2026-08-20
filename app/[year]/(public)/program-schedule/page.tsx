import type { Metadata } from "next";
import type { ValidYear } from "@/constants/config";
import { YEAR_CONFIG } from "@/constants/config";
import { SITE_URL } from "@/constants/seo";
import ProgramFlowPage from "@/modules/landing/program-flow/components/ProgramFlowPage";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  const config = YEAR_CONFIG[Number(year) as ValidYear];
  const pageUrl = `${SITE_URL}/${year}/program-schedule`;
  const description = `Program overview and highlights for EBISION ${year} — the three-day schedule, sessions, and event details. ${config.venue}, ${config.location}, ${config.dates}.`;

  return {
    title: "Program Schedule",
    description,
    keywords: [
      `EBISION ${year} program`,
      "program overview",
      "conference schedule",
      "program schedule",
      config.venue,
    ],
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
    alternates: { canonical: `/${year}/program-schedule` },
  };
}

export default async function ProgramFlowRoute({ params }: PageProps) {
  const { year } = await params;
  const yearNum = Number(year) as ValidYear;
  return <ProgramFlowPage year={yearNum} />;
}
