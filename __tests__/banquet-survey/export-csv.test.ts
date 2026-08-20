import { describe, expect, it } from "vitest";
import { type BanquetCsvRow, toBanquetCsv } from "@/modules/admin/banquet-survey/lib/export-csv";

const row = (over: Partial<BanquetCsvRow> = {}): BanquetCsvRow => ({
  name: "Ada Lovelace",
  affiliation: "Analytical Engine Co.",
  email: "ada@example.com",
  attending: true,
  respondedAt: new Date("2026-06-01T10:30:00Z"),
  allergens: ["nuts", "dairy"],
  allergenOther: null,
  message: null,
  invitationsSentCount: 1,
  invitationSentAt: new Date("2026-05-01T09:00:00Z"),
  emailsSentCount: 2,
  confirmationSentAt: new Date("2026-06-01T11:00:00Z"),
  ...over,
});

function parse(csv: string): string[][] {
  return csv.split("\r\n").map((line) => line.split(","));
}

describe("toBanquetCsv", () => {
  it("emits a header row and one row per response", () => {
    const csv = toBanquetCsv([row(), row({ name: "Alan Turing" })]);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[0].startsWith("Name,Affiliation,Email,Status,Attending,Allergens")).toBe(true);
  });

  it("derives status and attending from respondedAt + attending", () => {
    const invited = parse(toBanquetCsv([row({ respondedAt: null })]))[1];
    const not = parse(toBanquetCsv([row({ attending: false })]))[1];
    const yes = parse(toBanquetCsv([row()]))[1];
    expect(invited[3]).toBe("Invited");
    expect(invited[4]).toBe(""); // no attending answer while invited
    expect(not[3]).toBe("Not attending");
    expect(not[4]).toBe("No");
    expect(yes[3]).toBe("Attending");
    expect(yes[4]).toBe("Yes");
  });

  it("joins allergen labels with semicolons (unquoted — no comma)", () => {
    const cols = parse(toBanquetCsv([row({ allergens: ["nuts", "dairy"] })]))[1];
    expect(cols[5]).toBe("Nuts; Dairy");
  });

  it("quotes and escapes fields containing commas, quotes, or newlines", () => {
    const csv = toBanquetCsv([
      row({ affiliation: "Kookmin, Korea", message: 'She said "hi"\nthanks' }),
    ]);
    expect(csv).toContain('"Kookmin, Korea"');
    expect(csv).toContain('"She said ""hi""\nthanks"');
  });

  it("renders timestamps as ISO strings and blanks for nulls", () => {
    const cols = parse(toBanquetCsv([row({ confirmationSentAt: null })]))[1];
    expect(cols[8]).toBe("2026-06-01T10:30:00.000Z"); // responded at
    expect(cols[12]).toBe(""); // confirmation last sent (null)
  });
});
