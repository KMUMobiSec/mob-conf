import type { Metadata } from "next";
import type { ValidYear } from "@/constants/config";
import { YEAR_CONFIG } from "@/constants/config";
import { SITE_URL } from "@/constants/seo";
import ContactPage from "@/modules/landing/contact/components/ContactPage";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  const config = YEAR_CONFIG[Number(year) as ValidYear];
  const pageUrl = `${SITE_URL}/${year}/contact`;
  const description = `Get in touch with the EBISION ${year} organizing committee. ${config.venue}, ${config.location}.`;

  return {
    title: "Contact Us",
    description,
    keywords: [`EBISION ${year} contact`, "conference contact", "IFIP WG 8.4", config.venue],
    openGraph: {
      url: pageUrl,
      title: `Contact Us | EBISION ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    twitter: {
      title: `Contact Us | EBISION ${year}`,
      description,
      images: [`${SITE_URL}/${year}/opengraph-image`],
    },
    alternates: { canonical: `/${year}/contact` },
  };
}

export default async function Page({ params }: PageProps) {
  const { year } = await params;
  return <ContactPage year={Number(year) as ValidYear} />;
}
