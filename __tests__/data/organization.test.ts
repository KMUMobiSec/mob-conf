import organization2026 from "@/data/2026/en/organization.json";
import organization2026Kr from "@/data/2026/kr/organization.json";

describe("2026 organization data", () => {
  it("lists both publicity chairs under the plural role title", () => {
    const publicityChairs = organization2026.find(
      (organization) => organization.title === "Publicity Chairs",
    );

    expect(publicityChairs?.members).toEqual([
      {
        name: "I Wayan Adi Juliawan Pawana",
        affiliation: "Udayana University, Indonesia",
      },
      {
        name: "Godwin Monserate",
        affiliation: "University of San Carlos, Philippines",
      },
    ]);
  });

  it("places the poster chairs section after publicity chairs", () => {
    const publicityChairsIndex = organization2026.findIndex(
      (organization) => organization.title === "Publicity Chairs",
    );
    const posterChairsIndex = organization2026.findIndex(
      (organization) => organization.title === "Poster Chairs",
    );

    expect(posterChairsIndex).toBe(publicityChairsIndex + 1);
    expect(organization2026[posterChairsIndex]?.members).toEqual([
      {
        name: "Philip V. Astillo",
        affiliation: "University of San Carlos, Philippines",
      },
      {
        name: "Sohyun Park",
        affiliation: "Sungshin Women's University, South Korea",
      },
    ]);
  });

  it("places the web chairs section after the poster chairs", () => {
    const posterChairsIndex = organization2026.findIndex(
      (organization) => organization.title === "Poster Chairs",
    );
    const webChairsIndex = organization2026.findIndex(
      (organization) => organization.title === "Web Chairs",
    );
    const programCommitteeIndex = organization2026.findIndex(
      (organization) => organization.title === "Program Committee",
    );

    expect(webChairsIndex).toBe(posterChairsIndex + 1);
    expect(programCommitteeIndex).toBe(webChairsIndex + 1);
    expect(organization2026[webChairsIndex]?.members).toEqual([
      {
        name: "Jhury Kevin Lastre",
        affiliation: "Kookmin University, South Korea",
      },
      {
        name: "Vincent Abella",
        affiliation: "Kookmin University, South Korea",
      },
    ]);
  });

  it("keeps the poster chair section in the same position for Korean organization data", () => {
    const publicityChairIndex = organization2026Kr.findIndex(
      (organization) => organization.title === "홍보 위원장",
    );
    const posterChairIndex = organization2026Kr.findIndex(
      (organization) => organization.title === "포스터 위원장",
    );

    expect(posterChairIndex).toBe(publicityChairIndex + 1);
    expect(organization2026Kr[posterChairIndex]?.members).toEqual([
      {
        name: "Philip V. Astillo",
        affiliation: "University of San Carlos, Philippines",
      },
      {
        name: "Sohyun Park",
        affiliation: "Sungshin Women's University, South Korea",
      },
    ]);
  });

  it("keeps the web chairs section in the same position for Korean organization data", () => {
    const posterChairIndex = organization2026Kr.findIndex(
      (organization) => organization.title === "포스터 위원장",
    );
    const webChairsIndex = organization2026Kr.findIndex(
      (organization) => organization.title === "웹 위원장",
    );
    const programCommitteeIndex = organization2026Kr.findIndex(
      (organization) => organization.title === "프로그램 위원회",
    );

    expect(webChairsIndex).toBe(posterChairIndex + 1);
    expect(programCommitteeIndex).toBe(webChairsIndex + 1);
    expect(organization2026Kr[webChairsIndex]?.members).toEqual([
      {
        name: "Jhury Kevin Lastre",
        affiliation: "Kookmin University, South Korea",
      },
      {
        name: "Vincent Abella",
        affiliation: "Kookmin University, South Korea",
      },
    ]);
  });
});
