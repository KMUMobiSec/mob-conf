import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VALID_YEARS, type ValidYear } from "@/constants/config";
import { SITE_URL } from "@/constants/seo";
import NominationFormPage from "@/modules/landing/nomination-form/components/NominationFormPage";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  const yearNum = Number(year);

  if (!VALID_YEARS.includes(yearNum as ValidYear)) {
    return {};
  }

  const pageUrl = `${SITE_URL}/${year}/nomination-form`;
  const description = `Submit a nomination for the EBISION ${year} awards. Nominate an outstanding individual and attach the required supporting documents.`;

  return {
    title: "Award Nomination",
    description,
    keywords: [
      `EBISION ${year} nomination`,
      "award nomination",
      "IFIP WG 8.4",
      "conference awards",
    ],
    openGraph: {
      url: pageUrl,
      title: `Award Nomination | EBISION ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    twitter: {
      title: `Award Nomination | EBISION ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    alternates: { canonical: `/${year}/nomination-form` },
  };
}

export default async function Page({ params }: PageProps) {
  const { year } = await params;
  const yearNum = Number(year);

  if (!VALID_YEARS.includes(yearNum as ValidYear)) {
    notFound();
  }

  return <NominationFormPage year={yearNum as ValidYear} />;
}
