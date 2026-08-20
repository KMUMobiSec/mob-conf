import { CURRENT_YEAR, type ValidYear } from "@/constants/config";

export type AnnouncementSubmissionAction = {
  href: string;
  labelKey: "goToPortal" | "nominateSomeoneForAward";
  opensInNewTab: true;
};

export function getAnnouncementSubmissionAction(year: ValidYear): AnnouncementSubmissionAction {
  if (year === CURRENT_YEAR) {
    return {
      href: `/${year}/nomination-form`,
      labelKey: "nominateSomeoneForAward",
      opensInNewTab: true,
    };
  }

  return {
    href: `/${year}/portal`,
    labelKey: "goToPortal",
    opensInNewTab: true,
  };
}
