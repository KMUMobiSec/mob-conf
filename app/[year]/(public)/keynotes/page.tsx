import type { Metadata } from "next";
import type { ValidYear } from "@/constants/config";
import { YEAR_CONFIG } from "@/constants/config";
import { SITE_URL } from "@/constants/seo";
import KeynotesPage from "@/modules/landing/keynotes/components/KeynotesPage";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  const config = YEAR_CONFIG[Number(year) as ValidYear];
  const pageUrl = `${SITE_URL}/${year}/keynotes`;
  const description = `Meet the distinguished keynote speakers at MOBISEC ${year}. ${config.venue}, ${config.location}, ${config.dates}.`;

  return {
    title: "Keynote Speakers",
    description,
    keywords: [`MOBISEC ${year} keynotes`, "keynote speakers", config.venue],
    openGraph: {
      url: pageUrl,
      title: `Keynote Speakers | MOBISEC ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    twitter: {
      title: `Keynote Speakers | MOBISEC ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    alternates: { canonical: `/${year}/keynotes` },
  };
}

export default function Page() {
  return <KeynotesPage />;
}
