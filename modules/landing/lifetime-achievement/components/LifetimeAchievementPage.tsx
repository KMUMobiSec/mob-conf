"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { getClientData } from "@/lib/data-registry";
import { useYear } from "@/providers/year-provider";

interface LifetimeAchievementData {
  name: string;
  image: string;
  imageMobile: string;
  about: string;
  researchPublications: string[];
  drivingResearchProjects: string[];
  contributionsToSociety: string[];
}

const LifetimeAchievementPage = () => {
  const locale = useLocale();
  const year = useYear();
  const t = useTranslations("LifetimeAchievementPage");
  const data = getClientData<LifetimeAchievementData>(year, locale, "lifetime-achievement");

  if (!data) {
    return <div>{t("noDataFound")}</div>;
  }

  return (
    <section className="px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-24 flex flex-col gap-8 sm:gap-12">
      {/* Header */}
      <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
        <h1 className="display text-foreground text-center">{t("title")}</h1>
        <p className="body text-muted-foreground text-center">{t("subtitle")}</p>
      </div>

      {/* Recipient Profile */}
      <div className="max-w-8xl mx-auto">
        <div className="bg-background border border-border rounded-lg flex flex-row">
          {/* About */}
          <div className="flex flex-col gap-4 p-4 sm:p-6">
            <div className="flex flex-col gap-2">
              <div className="shrink-0 w-auto h-full md:hidden flex flex-col gap-2 justify-center items-center">
                <h2 className="subheading text-foreground">{data.name}</h2>
                <Image
                  src={data.imageMobile}
                  alt={`${data.name} photo`}
                  width={250}
                  height={300}
                  className="max-w-60 max-h-80 mx-auto w-auto h-full rounded-full object-cover border border-border"
                  onError={(e) => {
                    // Fallback to a placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
                  }}
                />
              </div>
            </div>

            <h2 className="subheading text-foreground">{data.name}</h2>
            <div className="flex flex-col gap-2">
              <h3 className="heading text-foreground">{t("about")}</h3>
              <p className="body text-muted-foreground">{data.about}</p>
            </div>
          </div>
          <div className="shrink-0 max-w-xs w-full h-full pr-4 sm:pr-6 md:block hidden self-end">
            <Image
              src={data.image}
              alt={`${data.name} photo`}
              width={300}
              height={300}
              className="w-auto lg:max-h-full max-h-10/12 object-cover mx-auto"
              onError={(e) => {
                // Fallback to a placeholder if image fails to load
                const target = e.target as HTMLImageElement;
                target.src =
                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
              }}
            />
          </div>
        </div>
      </div>

      {/* Research Publications */}
      <div className="max-w-8xl mx-auto flex flex-col gap-4">
        <div className="bg-background border border-border rounded-lg p-4 sm:p-6 flex flex-col gap-4">
          <h3 className="heading text-foreground">{t("researchPublications")}</h3>
          <div className="flex flex-col gap-2">
            <ul className="list">
              {data.researchPublications.map((publication, index) => (
                <li key={index} className="text-muted-foreground">
                  {publication}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Research Projects */}
      <div className="max-w-8xl mx-auto">
        <div className="bg-background border border-border rounded-lg p-4 sm:p-6 flex flex-col gap-4">
          <h3 className="heading text-foreground">{t("researchProjects")}</h3>
          <div className="flex flex-col gap-2">
            <ul className="list">
              {data.drivingResearchProjects.map((project, index) => (
                <li key={index} className="text-muted-foreground">
                  {project}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Contributions to Society */}
      <div className="max-w-8xl mx-auto">
        <div className="bg-background border border-border rounded-lg p-4 sm:p-6 flex flex-col gap-4">
          <h3 className="heading text-foreground">{t("contributionsToSociety")}</h3>
          <div className="flex flex-col gap-2">
            <ul className="list">
              {data.contributionsToSociety.map((contribution, index) => (
                <li key={index} className="text-muted-foreground">
                  {contribution}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LifetimeAchievementPage;
