import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VALID_YEARS, type ValidYear } from "@/constants/config";
import { SITE_URL } from "@/constants/seo";
import PresentationFormPage from "@/modules/landing/presentation-form/components/PresentationFormPage";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  const yearNum = Number(year);

  if (!VALID_YEARS.includes(yearNum as ValidYear)) {
    return {};
  }

  const pageUrl = `${SITE_URL}/${year}/presentation-upload`;
  const description = `Upload your presentation for MOBISEC ${year}. Submit your paper details and presentation file securely to the organizing committee.`;

  return {
    title: "Presentation Upload",
    description,
    keywords: [
      `MOBISEC ${year} presentation`,
      "presentation upload",
      "KIISC",
      "conference presentation",
    ],
    openGraph: {
      url: pageUrl,
      title: `Presentation Upload | MOBISEC ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    twitter: {
      title: `Presentation Upload | MOBISEC ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    alternates: { canonical: `/${year}/presentation-upload` },
  };
}

export default async function Page({ params }: PageProps) {
  const { year } = await params;
  const yearNum = Number(year);

  if (!VALID_YEARS.includes(yearNum as ValidYear)) {
    notFound();
  }

  return <PresentationFormPage year={yearNum as ValidYear} />;
}
