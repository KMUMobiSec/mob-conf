import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // @react-pdf/renderer relies on Node built-ins and its own reconciler/fonts; keep it external so
  // Next doesn't try to bundle it into the banquet export route.
  serverExternalPackages: ["@react-pdf/renderer"],
  // The banquet PDF route reads IBM Plex TTFs and the logo from disk at runtime; make sure the
  // production trace for that route includes them.
  outputFileTracingIncludes: {
    "/admin/banquet-survey/export": [
      "./assets/fonts/ibm-plex/**",
      "./public/assets/email/ebision-logo-email.png",
    ],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
