import type { Metadata } from "next";
import type { ValidYear } from "@/constants/config";
import { YEAR_CONFIG } from "@/constants/config";
import { SITE_URL } from "@/constants/seo";
import LifetimeAchievementPage from "@/modules/landing/lifetime-achievement/components/LifetimeAchievementPage";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  const config = YEAR_CONFIG[Number(year) as ValidYear];
  const pageUrl = `${SITE_URL}/${year}/lifetime-achievement`;
  const description = `EBISION ${year} Lifetime Achievement Award — Recognizing outstanding contributions to E-Business Information Systems. ${config.venue}, ${config.dates}.`;

  return {
    title: "Lifetime Achievement Award",
    description,
    keywords: [`EBISION ${year} lifetime achievement`, "conference award", "IFIP WG 8.4"],
    openGraph: {
      url: pageUrl,
      title: `Lifetime Achievement Award | EBISION ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    twitter: {
      title: `Lifetime Achievement Award | EBISION ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    alternates: { canonical: `/${year}/lifetime-achievement` },
  };
}

export default function Page() {
  return <LifetimeAchievementPage />;
}
