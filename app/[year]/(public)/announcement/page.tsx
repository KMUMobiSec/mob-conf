import type { Metadata } from "next";
import type { ValidYear } from "@/constants/config";
import { YEAR_CONFIG } from "@/constants/config";
import { SITE_URL } from "@/constants/seo";
import AnnouncementPage from "@/modules/landing/announcement/components/AnnouncementPage";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  const config = YEAR_CONFIG[Number(year) as ValidYear];
  const pageUrl = `${SITE_URL}/${year}/announcement`;
  const description = `EBISION ${year} Awards Nomination — Best Paper, Best Student Paper, Distinguished Lecturer, Young Researcher, Promising Graduate Student, Industry Pioneer. ${config.venue}, ${config.dates}.`;

  return {
    title: "Awards Nomination",
    description,
    keywords: [
      `EBISION ${year} awards`,
      "awards nomination",
      "best paper award",
      "conference awards",
    ],
    openGraph: {
      url: pageUrl,
      title: `Awards Nomination | EBISION ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    twitter: {
      title: `Awards Nomination | EBISION ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    alternates: { canonical: `/${year}/announcement` },
  };
}

export default async function Page({ params }: PageProps) {
  const { year } = await params;
  return <AnnouncementPage year={Number(year) as ValidYear} />;
}
