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
  const description = `MOBISEC ${year} Lifetime Achievement Award — Recognizing outstanding contributions to Mobile Internet Security. ${config.venue}, ${config.dates}.`;

  return {
    title: "Lifetime Achievement Award",
    description,
    keywords: [`MOBISEC ${year} lifetime achievement`, "conference award", "KIISC"],
    openGraph: {
      url: pageUrl,
      title: `Lifetime Achievement Award | MOBISEC ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    twitter: {
      title: `Lifetime Achievement Award | MOBISEC ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    alternates: { canonical: `/${year}/lifetime-achievement` },
  };
}

export default function Page() {
  return <LifetimeAchievementPage />;
}
