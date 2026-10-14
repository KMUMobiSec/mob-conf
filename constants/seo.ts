import type { Metadata } from "next";
import { CURRENT_YEAR, YEAR_CONFIG } from "@/constants/config";

const currentConfig = YEAR_CONFIG[CURRENT_YEAR];

export const SITE_URL = "https://mobisec-conference.com";
export const SITE_NAME = `MOBISEC ${CURRENT_YEAR}`;
export const SITE_DESCRIPTION = `The ${currentConfig.edition} KIISC International Conference on Mobile Internet Security — ${currentConfig.venue}, ${currentConfig.location}, ${currentConfig.dates}`;

export const OG_IMAGE = {
  url: `${SITE_URL}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: `MOBISEC ${CURRENT_YEAR} — The ${currentConfig.edition} KIISC International Conference on Mobile Internet Security`,
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
    `MOBISEC ${CURRENT_YEAR}`,
    "MOBISEC",
    "KIISC",
    "Mobile Internet Security",
    "digital transformation",
    "international conference",
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
  authors: [{ name: "KIISC (Korea Institute of Information Security and Cryptology)" }],
  creator: `MOBISEC ${CURRENT_YEAR} Organizing Committee`,
  publisher: "KIISC (Korea Institute of Information Security and Cryptology)",
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
