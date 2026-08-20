import type { Metadata } from "next";
import type { ValidYear } from "@/constants/config";
import { YEAR_CONFIG } from "@/constants/config";
import { SITE_URL } from "@/constants/seo";
import AuthorInstructionPage from "@/modules/landing/author-instruction/components/AuthorInstructionPage";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  const config = YEAR_CONFIG[Number(year) as ValidYear];
  const pageUrl = `${SITE_URL}/${year}/author-instruction`;
  const description = `Author instructions and paper submission guidelines for EBISION ${year}. ${config.dates}, ${config.venue}, ${config.location}.`;

  return {
    title: "Author Instructions",
    description,
    keywords: [
      `EBISION ${year} author instructions`,
      "paper submission",
      "conference submission",
      "IFIP WG 8.4",
    ],
    openGraph: {
      url: pageUrl,
      title: `Author Instructions | EBISION ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    twitter: {
      title: `Author Instructions | EBISION ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    alternates: { canonical: `/${year}/author-instruction` },
  };
}

export default async function Page({ params }: PageProps) {
  const { year } = await params;
  return <AuthorInstructionPage year={Number(year) as ValidYear} />;
}
