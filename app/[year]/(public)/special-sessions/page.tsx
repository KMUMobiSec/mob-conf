import type { Metadata } from "next";
import type { ValidYear } from "@/constants/config";
import { YEAR_CONFIG } from "@/constants/config";
import { SITE_URL } from "@/constants/seo";
import SpecialSessionsPage from "@/modules/landing/special-sessions/components/SpecialSessionsPage";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  const config = YEAR_CONFIG[Number(year) as ValidYear];
  const pageUrl = `${SITE_URL}/${year}/special-sessions`;
  const description = `Special sessions at MOBISEC ${year}, ${config.venue}, ${config.location} — session chairs, scope, and submission links.`;

  return {
    title: "Special Sessions",
    description,
    keywords: [`MOBISEC ${year} special sessions`, "conference special sessions", "KIISC"],
    openGraph: {
      url: pageUrl,
      title: `Special Sessions | MOBISEC ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    twitter: {
      title: `Special Sessions | MOBISEC ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    alternates: { canonical: `/${year}/special-sessions` },
  };
}

export default async function Page({ params }: PageProps) {
  const { year } = await params;
  return <SpecialSessionsPage year={Number(year) as ValidYear} />;
}
