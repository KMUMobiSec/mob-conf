import { getTranslations } from "next-intl/server";
import type { ValidYear } from "@/constants/config";
import { wayfinderConfigByYear } from "@/constants/wayfinder";
import { GETTING_AROUND_ANCHOR } from "@/lib/routes/getting-around";
import WayfinderClient from "./WayfinderClient";

/**
 * Server wrapper for the campus wayfinding guide. Renders the section chrome
 * and hands the geometry config to the interactive client island (the map).
 * Map attribution (© Mapbox / © OpenStreetMap) is rendered by Mapbox's own
 * attribution control. Looks up the config for the given year; years without
 * one (e.g. a hotel venue with no campus to navigate) render nothing rather
 * than showing another year's building layout.
 */
const CampusWayfinder = async ({ year }: { year: ValidYear }) => {
  const config = wayfinderConfigByYear[year];
  if (!config) return null;

  const t = await getTranslations("Wayfinder");

  return (
    <div
      id={GETTING_AROUND_ANCHOR}
      className="flex scroll-mt-24 flex-col gap-6 border-t border-border pt-6"
    >
      <div className="flex flex-col gap-2">
        <p className="tag text-primary">{t("sectionLabel")}</p>
        <h4 className="subheading text-foreground">{t("title")}</h4>
        <p className="body text-muted-foreground">{t("description")}</p>
      </div>

      <WayfinderClient config={config} />
    </div>
  );
};

export default CampusWayfinder;
