"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { YEAR_CONFIG } from "@/constants/config";
import { getClientData } from "@/lib/data-registry";
import { useYear } from "@/providers/year-provider";

interface Achievement {
  heading: string;
  text: string | string[];
}

interface Recipient {
  name: string;
  title?: string;
  tagline?: string;
  image: string;
  imageMobile: string;
  about: string;
  achievements: Achievement[];
}

interface LifetimeAchievementData {
  recipients: Recipient[];
}

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";

const ROMAN = ["I", "II", "III", "IV", "V", "VI"] as const;

/** Concentric wax-seal motif, matching the Roll of Honors laureate cards. */
const CardSeal = () => (
  <span
    aria-hidden="true"
    className="absolute right-6 top-6 flex size-10 items-center justify-center rounded-full border border-primary/50"
  >
    <span className="flex size-7 items-center justify-center rounded-full border border-primary/40">
      <span className="size-2 rotate-45 bg-primary/70" />
    </span>
  </span>
);

const RecipientCard = ({
  recipient,
  roman,
  t,
}: {
  recipient: Recipient;
  roman: string;
  t: ReturnType<typeof useTranslations>;
}) => (
  <article className="group relative overflow-hidden rounded-sm border border-primary/15 bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg sm:p-9">
    <span
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary to-primary/60"
    />
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-5 right-4 select-none text-[7rem] font-bold leading-none text-primary/[0.05]"
    >
      {roman}
    </span>
    <CardSeal />

    <div className="relative flex flex-col gap-6 lg:flex-row">
      {/* Photo */}
      <div className="mx-auto w-full max-w-60 shrink-0 lg:mx-0 lg:max-w-56">
        <Image
          src={recipient.image}
          alt={`${recipient.name} photo`}
          width={300}
          height={300}
          className="w-full rounded-sm border border-primary/15 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
          }}
        />
      </div>

      {/* Profile */}
      <div className="flex min-w-0 flex-col gap-4 pr-10">
        <div>
          <h2 className="subheading font-semibold text-foreground">{recipient.name}</h2>
          {recipient.title && (
            <div className="mt-2 flex items-center gap-2">
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-primary/80" />
              <span className="mono text-xs text-muted-foreground">{recipient.title}</span>
            </div>
          )}
        </div>

        {recipient.tagline && (
          <p className="body text-sm italic text-foreground">{recipient.tagline}</p>
        )}

        <span aria-hidden="true" className="block h-px w-9 bg-primary/60" />

        <div className="flex flex-col gap-2">
          <h3 className="small-heading text-foreground">{t("about")}</h3>
          <p className="body text-sm leading-relaxed text-muted-foreground">{recipient.about}</p>
        </div>
      </div>
    </div>

    {/* Legacy & Achievements */}
    {recipient.achievements.length > 0 && (
      <div className="relative mt-8 flex flex-col gap-5 border-t border-primary/10 pt-6">
        <h3 className="small-heading text-foreground">{t("legacyAchievements")}</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {recipient.achievements.map((achievement, index) => (
            <div
              key={index}
              className="rounded-sm border border-primary/10 bg-primary/[0.03] p-4 sm:p-5"
            >
              <h4 className="mono mb-2 text-xs uppercase tracking-wide text-primary">
                {achievement.heading}
              </h4>
              {Array.isArray(achievement.text) ? (
                <ul className="list text-sm">
                  {achievement.text.map((line, lineIndex) => (
                    <li key={lineIndex} className="text-muted-foreground">
                      {line}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="body text-sm leading-relaxed text-muted-foreground">
                  {achievement.text}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
  </article>
);

const LifetimeAchievementPage = () => {
  const locale = useLocale();
  const year = useYear();
  const t = useTranslations("LifetimeAchievementPage");
  const config = YEAR_CONFIG[year];
  const data = getClientData<LifetimeAchievementData>(year, locale, "lifetime-achievement");
  const recipients = data?.recipients ?? [];

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-12 text-center sm:px-10 sm:pt-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[540px] max-w-[92vw] -translate-x-1/2 -translate-y-[46%] rounded-full border border-primary/10"
        >
          <div className="absolute inset-11 rounded-full border border-primary/[0.08]" />
          <div className="absolute inset-24 rounded-full border border-primary/[0.05]" />
        </div>

        <div className="mb-7 flex items-center justify-center gap-4">
          <span
            aria-hidden="true"
            className="h-px w-12 bg-gradient-to-r from-transparent to-primary/60 sm:w-14"
          />
          <span className="tag tracking-[0.28em] text-primary">{t("title")}</span>
          <span
            aria-hidden="true"
            className="h-px w-12 bg-gradient-to-l from-transparent to-primary/60 sm:w-14"
          />
        </div>

        <h1 className="display text-foreground">{t("title")}</h1>
        <p className="body mx-auto mt-5 max-w-xl text-muted-foreground">{t("subtitle")}</p>

        <div className="mono mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span>{config.dates}</span>
          <span aria-hidden="true" className="size-1.5 rotate-45 bg-primary/70" />
          <span>
            {config.venue}, {config.location}
          </span>
        </div>
      </section>

      {/* ── Recipients / Empty state ── */}
      {recipients.length === 0 ? (
        <div className="mx-auto w-full max-w-6xl px-6 pb-24 sm:px-10">
          <div className="relative overflow-hidden rounded-sm border border-primary/15 bg-card p-12 text-center shadow-sm sm:p-16">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary to-primary/60"
            />
            <h2 className="heading text-foreground">{t("noDataFound")}</h2>
          </div>
        </div>
      ) : (
        <main className="mx-auto w-full max-w-6xl px-6 pb-16 sm:px-10 sm:pb-24">
          <div className="flex flex-col gap-10">
            {recipients.map((recipient, index) => (
              <RecipientCard
                key={recipient.name ?? index}
                recipient={recipient}
                roman={ROMAN[index] ?? String(index + 1)}
                t={t}
              />
            ))}
          </div>
        </main>
      )}
    </div>
  );
};

export default LifetimeAchievementPage;
