"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
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

const RecipientCard = ({
  recipient,
  t,
}: {
  recipient: Recipient;
  t: ReturnType<typeof useTranslations>;
}) => (
  <div className="max-w-8xl mx-auto w-full flex flex-col gap-4 sm:gap-6">
    {/* Profile */}
    <div className="bg-background border border-border rounded-lg flex flex-row">
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="shrink-0 w-auto h-full md:hidden flex flex-col gap-2 justify-center items-center">
          <h2 className="subheading text-foreground text-center">{recipient.name}</h2>
          {recipient.title && (
            <p className="caption text-muted-foreground text-center">{recipient.title}</p>
          )}
          <Image
            src={recipient.imageMobile}
            alt={`${recipient.name} photo`}
            width={250}
            height={300}
            className="max-w-60 max-h-80 mx-auto w-auto h-full rounded-full object-cover border border-border"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
            }}
          />
        </div>

        <div className="hidden md:flex flex-col gap-1">
          <h2 className="subheading text-foreground">{recipient.name}</h2>
          {recipient.title && <p className="caption text-muted-foreground">{recipient.title}</p>}
        </div>
        {recipient.tagline && (
          <p className="body text-muted-foreground italic">{recipient.tagline}</p>
        )}
        <div className="flex flex-col gap-2">
          <h3 className="heading text-foreground">{t("about")}</h3>
          <p className="body text-muted-foreground">{recipient.about}</p>
        </div>
      </div>
      <div className="shrink-0 max-w-xs w-full h-full pr-4 sm:pr-6 md:block hidden self-end">
        <Image
          src={recipient.image}
          alt={`${recipient.name} photo`}
          width={300}
          height={300}
          className="w-auto lg:max-h-full max-h-10/12 object-cover mx-auto"
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
          }}
        />
      </div>
    </div>

    {/* Legacy & Achievements */}
    {recipient.achievements.length > 0 && (
      <div className="bg-background border border-border rounded-lg p-4 sm:p-6 flex flex-col gap-6">
        <h3 className="heading text-foreground">{t("legacyAchievements")}</h3>
        <div className="flex flex-col gap-5">
          {recipient.achievements.map((achievement, index) => (
            <div key={index} className="flex flex-col gap-2">
              <h4 className="small-heading text-foreground">{achievement.heading}</h4>
              {Array.isArray(achievement.text) ? (
                <ul className="list">
                  {achievement.text.map((line, lineIndex) => (
                    <li key={lineIndex} className="text-muted-foreground">
                      {line}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="body text-muted-foreground">{achievement.text}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const LifetimeAchievementPage = () => {
  const locale = useLocale();
  const year = useYear();
  const t = useTranslations("LifetimeAchievementPage");
  const data = getClientData<LifetimeAchievementData>(year, locale, "lifetime-achievement");

  if (!data || data.recipients.length === 0) {
    return <div>{t("noDataFound")}</div>;
  }

  return (
    <section className="px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-24 flex flex-col gap-8 sm:gap-12">
      {/* Header */}
      <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
        <h1 className="display text-foreground text-center">{t("title")}</h1>
        <p className="body text-muted-foreground text-center">{t("subtitle")}</p>
      </div>

      {data.recipients.map((recipient, index) => (
        <RecipientCard key={recipient.name ?? index} recipient={recipient} t={t} />
      ))}
    </section>
  );
};

export default LifetimeAchievementPage;
