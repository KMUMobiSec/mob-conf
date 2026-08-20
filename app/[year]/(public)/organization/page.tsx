import type { Metadata } from "next";
import type { ValidYear } from "@/constants/config";
import { SITE_URL } from "@/constants/seo";
import OrganizationPage from "@/modules/landing/organization/components/OrganizationPage";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  const pageUrl = `${SITE_URL}/${year}/organization`;
  const description = `Meet the EBISION ${year} organizing committee. Organized and hosted by IFIP WG 8.4 — E-Business Information Systems.`;

  return {
    title: "Symposium Organization",
    description,
    keywords: [`EBISION ${year} organization`, "conference committee", "IFIP WG 8.4"],
    openGraph: {
      url: pageUrl,
      title: `Symposium Organization | EBISION ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    twitter: {
      title: `Symposium Organization | EBISION ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    alternates: { canonical: `/${year}/organization` },
  };
}

export default async function Page({ params }: PageProps) {
  const { year } = await params;
  return <OrganizationPage year={Number(year) as ValidYear} />;
}
