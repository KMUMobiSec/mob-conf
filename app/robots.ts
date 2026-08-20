import type { MetadataRoute } from "next";
import { SITE_URL } from "@/constants/seo";

const HOST = new URL(SITE_URL).host;

/**
 * SEO-compliant robots.txt per Google's REP (RFC 9309).
 * - Do not disallow /_next/ — Google needs JS/CSS for proper page rendering.
 * - Sitemap URL must be absolute.
 * - Host directive helps Yandex and other crawlers that support it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    host: HOST,
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
