import type { Metadata } from "next";
import type { ValidYear } from "@/constants/config";
import { SITE_URL } from "@/constants/seo";
import PreviousEventsPage from "@/modules/landing/previous-events/components/PreviousEventsPage";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  const pageUrl = `${SITE_URL}/${year}/previous-events`;
  const description =
    "Explore the history of EBISION conferences. View past events, host locations, proceedings, and the upcoming edition.";

  return {
    title: "Previous Events",
    description,
    keywords: [
      `EBISION ${year}`,
      "EBISION previous events",
      "EBISION history",
      "past conferences",
      "IFIP WG 8.4",
    ],
    openGraph: {
      url: pageUrl,
      title: `Previous Events | EBISION ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    twitter: {
      title: `Previous Events | EBISION ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    alternates: { canonical: `/${year}/previous-events` },
  };
}

export default async function Page({ params }: PageProps) {
  const { year } = await params;
  return <PreviousEventsPage year={Number(year) as ValidYear} />;
}
