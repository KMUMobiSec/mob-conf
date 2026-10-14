import { existsSync } from "node:fs";
import path from "node:path";
import { Font } from "@react-pdf/renderer";

// react-pdf embeds TTF/OTF only, so we ship IBM Plex as TTFs vendored from @fontsource via
// `pnpm pdf-fonts:build`. Registration is server-side (Node route handler) and runs once on import.
const FONT_DIR = path.join(process.cwd(), "assets/fonts/ibm-plex");
const LOGO_CANDIDATE = path.join(process.cwd(), "public/assets/email/ebision-logo-email.png");

const SANS = [
  { file: "ibm-plex-sans-300.ttf", weight: 300 },
  { file: "ibm-plex-sans-400.ttf", weight: 400 },
  { file: "ibm-plex-sans-500.ttf", weight: 500 },
  { file: "ibm-plex-sans-600.ttf", weight: 600 },
  { file: "ibm-plex-sans-700.ttf", weight: 700 },
] as const;

const MONO = [
  { file: "ibm-plex-mono-400.ttf", weight: 400 },
  { file: "ibm-plex-mono-500.ttf", weight: 500 },
] as const;

export interface ReportFonts {
  sans: string;
  mono: string;
}

/**
 * Register the IBM Plex families and return their names. Falls back to the built-in Helvetica/
 * Courier (so the report still renders) when the vendored TTFs are absent or fail to load.
 */
function registerReportFonts(): ReportFonts {
  const files = [...SANS, ...MONO];
  if (!files.every((f) => existsSync(path.join(FONT_DIR, f.file)))) {
    return { sans: "Helvetica", mono: "Courier" };
  }
  try {
    Font.register({
      family: "IBM Plex Sans",
      fonts: SANS.map((f) => ({ src: path.join(FONT_DIR, f.file), fontWeight: f.weight })),
    });
    Font.register({
      family: "IBM Plex Mono",
      fonts: MONO.map((f) => ({ src: path.join(FONT_DIR, f.file), fontWeight: f.weight })),
    });
    // Don't hyphenate — keep hyphenated names (e.g. "Berners-Lee") and emails intact in cells.
    Font.registerHyphenationCallback((word) => [word]);
    return { sans: "IBM Plex Sans", mono: "IBM Plex Mono" };
  } catch {
    return { sans: "Helvetica", mono: "Courier" };
  }
}

export const REPORT_FONTS: ReportFonts = registerReportFonts();

/** Absolute path to the MOBISEC logo for the report masthead, or null when unavailable. */
export const LOGO_PATH: string | null = existsSync(LOGO_CANDIDATE) ? LOGO_CANDIDATE : null;
