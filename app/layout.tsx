import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { AppProvider } from "@/providers";
import "@/styles/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { sharedMetadata } from "@/constants/seo";
import { ThemeProvider } from "@/providers/theme-provider";

export const metadata: Metadata = sharedMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        style={{ scrollBehavior: "smooth" }}
        className={` antialiased min-h-screen bg-background`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            <AppProvider>{children}</AppProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
