import { describe, expect, it } from "vitest";

import recipients2025En from "@/data/2025/en/award-recipients.json";
import recipients2025Kr from "@/data/2025/kr/award-recipients.json";
import enMessages from "@/messages/en.json";
import { AWARDS } from "@/modules/landing/nomination-form/lib/constants";

describe("award copy", () => {
  it("uses Distinguished Lecturer Award for the lecturer award", () => {
    const lecturerAward = AWARDS.find((award) => award.id === "exemplary_lecturer");

    expect(lecturerAward?.name).toBe("Distinguished Lecturer Award");
    expect(enMessages.AwardRecipientsPage.categoryExemplaryLecturer).toBe(
      "Distinguished Lecturer Award",
    );
    expect(enMessages.AnnouncementPage.awardExemplaryLecturer).toBe("Distinguished Lecturer Award");
    expect(enMessages.AnnouncementPage.nominationRequirementsIntro).toContain(
      "Distinguished Lecturer",
    );
    expect(enMessages.AnnouncementPage.nominationRequirementsIntro).not.toContain(
      "Exemplary Lecturer",
    );

    const recipientCategories = [
      ...recipients2025En.recipients,
      ...recipients2025Kr.recipients,
    ].map((recipient) => recipient.category);

    expect(recipientCategories).toContain("Distinguished Lecturer Award");
    expect(recipientCategories).not.toContain("Exemplary Lecturer Award");
  });
});
