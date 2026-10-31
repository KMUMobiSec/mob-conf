import type { Metadata } from "next";
import type { ValidYear } from "@/constants/config";
import { YEAR_CONFIG } from "@/constants/config";
import { SITE_URL } from "@/constants/seo";
import RegistrationGuidePage from "@/modules/landing/registration-guide/components/RegistrationGuidePage";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  const config = YEAR_CONFIG[Number(year) as ValidYear];
  const pageUrl = `${SITE_URL}/${year}/registration-guide`;
  const description = `How to register for MOBISEC ${year}, ${config.venue}, ${config.location} — local (Korea) and foreign registration options.`;

  return {
    title: "Registration",
    description,
    keywords: [`MOBISEC ${year} registration`, "conference registration", "KIISC"],
    openGraph: {
      url: pageUrl,
      title: `Registration | MOBISEC ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    twitter: {
      title: `Registration | MOBISEC ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    alternates: { canonical: `/${year}/registration-guide` },
  };
}

export default async function Page({ params }: PageProps) {
  const { year } = await params;
  return <RegistrationGuidePage year={Number(year) as ValidYear} />;
}
