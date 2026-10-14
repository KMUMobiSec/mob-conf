export const MOBISEC_2026_SUBMISSION_URL = "https://easychair.org/conferences/?conf=mobisec2026";
export const MOBISEC_2026_CFP_URL = "/assets/files/2026/mobisec-cfp-2026.pdf";
export const MOBISEC_2026_CFP_LEAFLET_URL = "/assets/files/2026/mobisec-cfp-2026.pdf";

export const MOBISEC_2026_REGISTRATION_URL = "https://public.thinkonweb.com/sites/mobisec2026";

export const CURRENT_YEAR = 2026;
export const VALID_YEARS = [2025, 2026] as const;
export type ValidYear = (typeof VALID_YEARS)[number];

export function isValidYear(year: unknown): year is ValidYear {
  return typeof year === "number" && VALID_YEARS.includes(year as ValidYear);
}

/** Route keys that can be disabled per year in navigation. */
export type NavRouteKey =
  | "home"
  | "overview"
  | "proceedings"
  | "organization"
  | "previousEvents"
  | "program"
  | "featuredSpeakers"
  | "programFlow"
  | "keynotes"
  | "announcement"
  | "rollOfHonors"
  | "authorInstructions"
  | "contact"
  | "lifetimeAchievement";

export const YEAR_CONFIG: Record<
  ValidYear,
  {
    conferenceName: string;
    edition: string;
    dates: string;
    startDate: string;
    endDate: string;
    location: string;
    city: string;
    countryCode: string;
    venue: string;
    submissionUrl: string;
    cfpUrl: string;
    cfpLeafletUrl: string;
    /** URL to the program book PDF/CSV. Empty string if not yet available. */
    programBookUrl: string;
    /** External registration & payment portal. Empty string hides the Registration nav link. */
    registrationUrl: string;
    /** Routes to disable in navigation for this year. */
    disabledRoutes: NavRouteKey[];
  }
> = {
  2025: {
    conferenceName: "MOBISEC 2025",
    edition: "1st",
    dates: "December 16–18, 2025",
    startDate: "2025-12-16",
    endDate: "2025-12-18",
    location: "Sapporo, Japan",
    city: "Sapporo",
    countryCode: "JP",
    venue: "Hotel Emisia Sapporo",
    submissionUrl: "https://easychair.org/conferences?conf=mobisec2025",
    cfpUrl: "/assets/files/2025/mobisec-cfp-2025.pdf",
    cfpLeafletUrl: "/assets/files/2025/mobisec-cfp-2025.pdf",
    programBookUrl: "/data/2025/program-book-table.csv",
    registrationUrl: "",
    disabledRoutes: ["featuredSpeakers", "programFlow"],
  },
  2026: {
    conferenceName: "MOBISEC 2026",
    edition: "2nd",
    dates: "July 8–10, 2026",
    startDate: "2026-07-08",
    endDate: "2026-07-10",
    location: "Seoul, South Korea",
    city: "Seoul",
    countryCode: "KR",
    venue: "Kookmin University",
    submissionUrl: MOBISEC_2026_SUBMISSION_URL,
    cfpUrl: "/assets/files/2026/mobisec-cfp-2026.pdf",
    cfpLeafletUrl: "/assets/files/2026/mobisec-cfp-2026.pdf",
    programBookUrl: "",
    registrationUrl: MOBISEC_2026_REGISTRATION_URL,
    disabledRoutes: ["program", "lifetimeAchievement"],
  },
};
