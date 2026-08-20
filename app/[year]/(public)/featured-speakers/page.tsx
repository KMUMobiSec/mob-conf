import type { Metadata } from "next";
import type { ValidYear } from "@/constants/config";
import { YEAR_CONFIG } from "@/constants/config";
import { SITE_URL } from "@/constants/seo";
import FeaturedSpeakersPage from "@/modules/landing/featured-speakers/components/FeaturedSpeakersPage";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  const config = YEAR_CONFIG[Number(year) as ValidYear];
  const pageUrl = `${SITE_URL}/${year}/featured-speakers`;
  const description = `Meet the EBISION ${year} keynote speakers, invited speakers, and industrial session companies. ${config.venue}, ${config.location}, ${config.dates}.`;

  return {
    title: "Featured Speakers & Sessions",
    description,
    keywords: [
      `EBISION ${year} speakers`,
      "keynote speakers",
      "invited speakers",
      "industrial session",
      config.venue,
    ],
    openGraph: {
      url: pageUrl,
      title: `Featured Speakers & Sessions | EBISION ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    twitter: {
      title: `Featured Speakers & Sessions | EBISION ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    alternates: { canonical: `/${year}/featured-speakers` },
  };
}

export default async function FeaturedSpeakersRoute({ params }: PageProps) {
  const { year } = await params;
  const yearNum = Number(year) as ValidYear;
  return <FeaturedSpeakersPage year={yearNum} />;
}
