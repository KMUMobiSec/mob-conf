import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VALID_YEARS, type ValidYear } from "@/constants/config";
import { SITE_URL } from "@/constants/seo";
import BanquetSurveyPage from "@/modules/landing/banquet-survey/components/BanquetSurveyPage";

interface PageProps {
  params: Promise<{ year: string }>;
  searchParams: Promise<{ email?: string; name?: string; affiliation?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  const yearNum = Number(year);

  if (!VALID_YEARS.includes(yearNum as ValidYear)) {
    return {};
  }

  const pageUrl = `${SITE_URL}/${year}/banquet-survey`;
  const description = `RSVP for the MOBISEC ${year} banquet. Let the organizing committee know if you will attend and share any dietary needs.`;

  return {
    title: "Banquet RSVP",
    description,
    keywords: [`MOBISEC ${year} banquet`, "banquet RSVP", "KIISC", "conference banquet"],
    openGraph: {
      url: pageUrl,
      title: `Banquet RSVP | MOBISEC ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    twitter: {
      title: `Banquet RSVP | MOBISEC ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    alternates: { canonical: `/${year}/banquet-survey` },
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { year } = await params;
  const yearNum = Number(year);

  if (!VALID_YEARS.includes(yearNum as ValidYear)) {
    notFound();
  }

  const { email, name, affiliation } = await searchParams;

  return (
    <BanquetSurveyPage
      year={yearNum as ValidYear}
      email={typeof email === "string" ? email : undefined}
      name={typeof name === "string" ? name : undefined}
      affiliation={typeof affiliation === "string" ? affiliation : undefined}
    />
  );
}
