export const AWARD_CATEGORY_ORDER = [
  { key: "Distinguished Lecturer Award", tKey: "categoryExemplaryLecturer" },
  { key: "Industry Pioneer Award", tKey: "categoryIndustryPioneer" },
  { key: "Young Researcher Award", tKey: "categoryYoungResearcher" },
  { key: "Promising Graduate Student Award", tKey: "categoryPromisingGraduate" },
  { key: "Best Paper Award", tKey: "categoryBestPaper" },
  { key: "Best Student Paper Award", tKey: "categoryBestStudent" },
] as const;

export const AWARD_DESCRIPTION_ORDER = [
  "Distinguished Lecturer",
  "Industry Pioneer",
  "Young Researcher",
  "Promising Graduate Student",
  "Best Paper",
  "Best Student Paper",
] as const;

export function buildRollOfHonorsDescription(year: string, venue: string, dates: string) {
  return `MOBISEC ${year} Roll of Honors — ${AWARD_DESCRIPTION_ORDER.join(", ")}. ${venue}, ${dates}.`;
}
