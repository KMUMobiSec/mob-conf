import announcement2026 from "@/data/2026/en/announcement.json";

describe("2026 announcement dates", () => {
  it("uses the current nomination and awarding schedule", () => {
    expect(announcement2026.importantDates).toEqual([
      {
        title: "Start Submission",
        date: "June 03, 2026 (KST/JST)",
      },
      {
        title: "Decision",
        date: "June 20, 2026 (KST/JST)",
      },
      {
        title: "Email Notification",
        date: "June 22, 2026 (KST/JST)",
      },
      {
        title: "Awarding",
        date: "July 09, 2026",
      },
    ]);
  });
});
