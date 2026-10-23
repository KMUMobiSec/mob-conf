import type { MetadataRoute } from "next";
import { CURRENT_YEAR, type NavRouteKey, VALID_YEARS, YEAR_CONFIG } from "@/constants/config";
import { SITE_URL } from "@/constants/seo";

const ROUTE_CONFIG: Record<
  NavRouteKey,
  { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }
> = {
  home: { path: "", priority: 1.0, changeFrequency: "weekly" },
  overview: { path: "/overview", priority: 0.9, changeFrequency: "monthly" },
  proceedings: { path: "/proceedings", priority: 0.8, changeFrequency: "monthly" },
  organization: { path: "/organization", priority: 0.7, changeFrequency: "monthly" },
  previousEvents: { path: "/previous-events", priority: 0.6, changeFrequency: "yearly" },
  program: { path: "/program", priority: 0.8, changeFrequency: "weekly" },
  featuredSpeakers: { path: "/featured-speakers", priority: 0.9, changeFrequency: "monthly" },
  programFlow: { path: "/program-schedule", priority: 0.9, changeFrequency: "weekly" },
  keynotes: { path: "/keynotes", priority: 0.8, changeFrequency: "monthly" },
  lifetimeAchievement: { path: "/lifetime-achievement", priority: 0.6, changeFrequency: "yearly" },
  announcement: { path: "/announcement", priority: 0.7, changeFrequency: "monthly" },
  rollOfHonors: { path: "/roll-of-honors", priority: 0.7, changeFrequency: "yearly" },
  authorInstructions: { path: "/author-instruction", priority: 0.9, changeFrequency: "monthly" },
  contact: { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  specialSessions: { path: "/special-sessions", priority: 0.8, changeFrequency: "monthly" },
};

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Root page (event selector)
  const rootEntry: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1.0,
    },
  ];

  // Generate entries for each valid year, excluding disabled routes
  const yearEntries = VALID_YEARS.flatMap((year) => {
    const disabledRoutes = YEAR_CONFIG[year].disabledRoutes;

    return (Object.entries(ROUTE_CONFIG) as [NavRouteKey, (typeof ROUTE_CONFIG)[NavRouteKey]][])
      .filter(([key]) => !disabledRoutes.includes(key))
      .map(([_, route]) => ({
        url: `${SITE_URL}/${year}${route.path}`,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: year === CURRENT_YEAR ? route.priority : route.priority * 0.6,
      }));
  });

  return [...rootEntry, ...yearEntries];
}
