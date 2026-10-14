import type { Metadata } from "next";
import { type ValidYear, YEAR_CONFIG } from "@/constants/config";
import { SITE_URL } from "@/constants/seo";
import OverviewPage from "@/modules/landing/overview/components/OverviewPage";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  const config = YEAR_CONFIG[Number(year) as ValidYear];
  const pageUrl = `${SITE_URL}/${year}/overview`;
  const description = `MOBISEC ${year} — Explore the paradigm shift in Mobile Internet Security through multidisciplinary perspectives. ${config.venue}, ${config.location}, ${config.dates}.`;

  return {
    title: "Overview",
    description,
    keywords: [
      `MOBISEC ${year}`,
      "Mobile Internet Security",
      "KIISC",
      config.venue,
      config.location,
    ],
    openGraph: {
      url: pageUrl,
      title: `Overview | MOBISEC ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    twitter: {
      title: `Overview | MOBISEC ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    alternates: { canonical: `/${year}/overview` },
  };
}

export default async function Page({ params }: PageProps) {
  const { year } = await params;
  return <OverviewPage year={Number(year) as ValidYear} />;
}
