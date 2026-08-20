import type { Metadata } from "next";
import { CURRENT_YEAR, YEAR_CONFIG } from "@/constants/config";

const currentConfig = YEAR_CONFIG[CURRENT_YEAR];

export const SITE_URL = "https://ebision.ifip-wg84.org";
export const SITE_NAME = `EBISION ${CURRENT_YEAR}`;
export const SITE_DESCRIPTION = `The ${currentConfig.edition} IFIP WG 8.4 International Symposium on E-Business Information Systems Evolution — ${currentConfig.venue}, ${currentConfig.location}, ${currentConfig.dates}`;

export const OG_IMAGE = {
  url: `${SITE_URL}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: `EBISION ${CURRENT_YEAR} — The ${currentConfig.edition} IFIP WG 8.4 International Symposium on E-Business Information Systems Evolution`,
  type: "image/png",
};

/** Shared metadata defaults inherited by all pages via root layout. */
export const sharedMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    `EBISION ${CURRENT_YEAR}`,
    "EBISION",
    "IFIP WG 8.4",
    "E-Business Information Systems",
    "digital transformation",
    "international symposium",
    currentConfig.venue,
    ...currentConfig.location.split(", "),
    "conference",
    "research",
    "AI",
    "blockchain",
    "cybersecurity",
    "6G",
    "quantum computing",
  ],
  authors: [{ name: "IFIP Working Group 8.4" }],
  creator: `EBISION ${CURRENT_YEAR} Organizing Committee`,
  publisher: "IFIP Working Group 8.4",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Canonical is set per-page via generateMetadata; avoid wrong default here
};
