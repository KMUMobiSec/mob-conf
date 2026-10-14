import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { type NavRouteKey, type ValidYear, YEAR_CONFIG } from "@/constants/config";
import { loadData } from "@/lib/data";

interface ConferenceData {
  conferenceName: string;
  conferenceFullTitle: string;
}

const categoryKeys = {
  about: "about",
  program: "program",
  awards: "awards",
  participate: "participate",
} as const;

const Footer = async ({ year }: { year: ValidYear }) => {
  const t = await getTranslations("Footer");
  const conf = await loadData<ConferenceData>("conference", year);

  const disabledRoutes = YEAR_CONFIG[year].disabledRoutes;
  const isDisabled = (key: NavRouteKey) => disabledRoutes.includes(key);

  const footerLinks = {
    about: [
      { key: "overview" as const, href: `/${year}/overview`, disabled: isDisabled("overview") },
      {
        key: "organization" as const,
        href: `/${year}/organization`,
        disabled: isDisabled("organization"),
      },
      {
        key: "lifetimeAchievement" as const,
        href: `/${year}/lifetime-achievement`,
        disabled: isDisabled("lifetimeAchievement"),
      },
      {
        key: "previousEvents" as const,
        href: `/${year}/previous-events`,
        disabled: isDisabled("previousEvents"),
      },
    ],
    program: [
      {
        key: "featuredSpeakers" as const,
        href: `/${year}/featured-speakers`,
        disabled: isDisabled("featuredSpeakers"),
      },
      // Single "Program Schedule" entry → active schedule route for the year.
      isDisabled("programFlow")
        ? {
            key: "programSchedule" as const,
            href: `/${year}/program`,
            disabled: isDisabled("program"),
          }
        : {
            key: "programSchedule" as const,
            href: `/${year}/program-schedule`,
            disabled: false,
          },
      { key: "keynotes" as const, href: `/${year}/keynotes`, disabled: isDisabled("keynotes") },
    ],
    awards: [
      {
        key: "announcement" as const,
        href: `/${year}/announcement`,
        disabled: isDisabled("announcement"),
      },
      {
        key: "rollOfHonors" as const,
        href: `/${year}/roll-of-honors`,
        disabled: isDisabled("rollOfHonors"),
      },
    ],
    participate: [
      {
        key: "authorInstructions" as const,
        href: `/${year}/author-instruction`,
        disabled: isDisabled("authorInstructions"),
      },
      { key: "contact" as const, href: `/${year}/contact`, disabled: isDisabled("contact") },
    ],
  };

  return (
    <footer className="w-full bg-background border-t border-border">
      <div className="max-w-8xl mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* Logo and Conference Info */}
          <div className="flex flex-col md:items-start items-center md:text-left text-center gap-4">
            <Image
              src="/assets/logo/mobisec-logo.png"
              alt="MOBISEC Logo"
              width={120}
              height={90}
              className="h-10 w-auto dark:hidden"
            />
            <Image
              src="/assets/logo/mobisec-logo-white.png"
              alt="MOBISEC Logo"
              width={120}
              height={90}
              className="hidden h-10 w-auto dark:block"
            />
            <div className="flex flex-col gap-1">
              <p className="small-heading text-foreground">{conf.conferenceName}</p>
              <p className="caption text-muted-foreground">{conf.conferenceFullTitle}</p>
            </div>
          </div>

          {/* Link Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {(
              Object.entries(footerLinks) as [
                keyof typeof categoryKeys,
                (typeof footerLinks)[keyof typeof footerLinks],
              ][]
            ).map(([category, links]) => (
              <div key={category}>
                <p className="tag text-foreground mb-4">{t(categoryKeys[category])}</p>
                <ul className="flex flex-col gap-2">
                  {links.map((link) => (
                    <li key={link.key}>
                      {link.disabled ? (
                        <span className="caption text-muted-foreground/50 cursor-not-allowed pointer-events-none">
                          {t(link.key)}
                        </span>
                      ) : (
                        <Link
                          href={link.href}
                          className="caption text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {t(link.key)}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-border pt-8 flex justify-center items-center">
          <small className="caption text-muted-foreground">{t("copyright", { year })}</small>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
