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
  const description = `Meet the MOBISEC ${year} organizing committee. Organized and hosted by KIISC — Mobile Internet Security.`;

  return {
    title: "Conference Organization",
    description,
    keywords: [`MOBISEC ${year} organization`, "conference committee", "KIISC"],
    openGraph: {
      url: pageUrl,
      title: `Conference Organization | MOBISEC ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    twitter: {
      title: `Conference Organization | MOBISEC ${year}`,
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
