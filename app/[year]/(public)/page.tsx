import type { Metadata } from "next";
import { type ValidYear, YEAR_CONFIG } from "@/constants/config";
import { SITE_URL } from "@/constants/seo";
import HomePage from "@/modules/landing/home/components/HomePage";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  const yearNum = Number(year) as ValidYear;
  const config = YEAR_CONFIG[yearNum];
  const description = `The ${config.edition} KIISC International Conference on Mobile Internet Security — ${config.venue}, ${config.location}, ${config.dates}`;
  const pageUrl = `${SITE_URL}/${year}`;

  return {
    title: {
      absolute: `MOBISEC ${year} — International Conference on Mobile Internet Security`,
    },
    description,
    openGraph: {
      url: pageUrl,
      title: `MOBISEC ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    twitter: {
      title: `MOBISEC ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    alternates: { canonical: `/${year}` },
  };
}

export default async function Home({ params }: PageProps) {
  const { year } = await params;
  const yearNum = Number(year) as ValidYear;
  return <HomePage year={yearNum} />;
}
