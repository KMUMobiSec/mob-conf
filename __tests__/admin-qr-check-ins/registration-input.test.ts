import { describe, expect, it } from "vitest";
import {
  dedupeRegistrationCsvRows,
  normalizeRegistrationEmail,
  normalizeRegistrationName,
  parseManualRegistrationInput,
  parseRegistrationCsv,
  registrationDedupeKey,
} from "@/modules/admin/qr-check-ins/lib/registration-input";

describe("registration input validation", () => {
  it("normalizes emails for per-year uniqueness", () => {
    expect(normalizeRegistrationEmail("  Person@Example.COM ")).toBe("person@example.com");
  });

  it("validates manual registration input (no ID number)", () => {
    expect(
      parseManualRegistrationInput({
        email: " ATTENDEE@Example.com ",
        name: " Ada Lovelace ",
        affiliation: " IFIP ",
      }),
    ).toEqual({
      ok: true,
      data: {
        email: "attendee@example.com",
        name: "Ada Lovelace",
        affiliation: "IFIP",
        idNumber: null,
      },
    });
  });

  it("accepts a positive ID number and rejects a non-positive/non-integer one", () => {
    expect(
      parseManualRegistrationInput({ email: null, name: "Ada", affiliation: null, idNumber: 7 }),
    ).toEqual({
      ok: true,
      data: { email: null, name: "Ada", affiliation: null, idNumber: 7 },
    });

    const zero = parseManualRegistrationInput({ name: "Ada", idNumber: 0 });
    expect(zero.ok).toBe(false);
    if (!zero.ok) expect(zero.errors.idNumber).toBe("ID number must be a positive whole number.");

    const fraction = parseManualRegistrationInput({ name: "Ada", idNumber: "1.5" });
    expect(fraction.ok).toBe(false);
  });

  it("parses CSV rows with case-insensitive headers and row errors", () => {
    const csv = [
      " Email , Name , Affiliation ",
      " one@example.com , One Person , University ",
      " bad-email , Missing Email Shape , Org ",
      " two@example.com , Two Person , ",
    ].join("\n");

    expect(parseRegistrationCsv(csv)).toEqual({
      validRows: [
        {
          rowNumber: 2,
          email: "one@example.com",
          name: "One Person",
          affiliation: "University",
          idNumber: null,
        },
        {
          rowNumber: 4,
          email: "two@example.com",
          name: "Two Person",
          affiliation: null,
          idNumber: null,
        },
      ],
      invalidRows: [{ rowNumber: 3, error: "Invalid email address." }],
    });
  });

  it("reads the participant number from a `No.` column and flags an invalid one", () => {
    const csv = [
      "No.,Name,Affiliation,Email",
      "1,Ilsun You,Kookmin,isyou@kookmin.ac.kr",
      "012,Ada Lovelace,IFIP,ada@example.com",
      ",No Number,Org,none@example.com",
      "abc,Bad Number,Org,bad-number@example.com",
    ].join("\n");

    expect(parseRegistrationCsv(csv)).toEqual({
      validRows: [
        {
          rowNumber: 2,
          email: "isyou@kookmin.ac.kr",
          name: "Ilsun You",
          affiliation: "Kookmin",
          idNumber: 1,
        },
        {
          rowNumber: 3,
          email: "ada@example.com",
          name: "Ada Lovelace",
          affiliation: "IFIP",
          idNumber: 12,
        },
        {
          rowNumber: 4,
          email: "none@example.com",
          name: "No Number",
          affiliation: "Org",
          idNumber: null,
        },
      ],
      invalidRows: [{ rowNumber: 5, error: "ID number must be a positive whole number." }],
    });
  });

  it("reads the reference list's hyphenated `E-mail` header so rows keep their address", () => {
    const csv = [
      "No.,Name,Affiliation,E-mail,Backup Email,Status",
      "1,Ilsun You,Kookmin University,ISYOU@kookmin.ac.kr,isyou@kookmin.ac.kr,VIP",
    ].join("\n");

    expect(parseRegistrationCsv(csv)).toEqual({
      validRows: [
        {
          rowNumber: 2,
          email: "isyou@kookmin.ac.kr",
          name: "Ilsun You",
          affiliation: "Kookmin University",
          idNumber: 1,
        },
      ],
      invalidRows: [],
    });
  });

  it("normalizes names for comparison (case- and whitespace-insensitive)", () => {
    expect(normalizeRegistrationName("  Ada   Lovelace ")).toBe("ada lovelace");
  });

  it("keys registrations by email and normalized name", () => {
    expect(registrationDedupeKey("a@example.com", " Ada  Lovelace ")).toBe(
      registrationDedupeKey("a@example.com", "ada lovelace"),
    );
    // Same email, different name -> different identity.
    expect(registrationDedupeKey("a@example.com", "Ada Lovelace")).not.toBe(
      registrationDedupeKey("a@example.com", "Alan Turing"),
    );
    // Same name, different email -> different identity.
    expect(registrationDedupeKey("a@example.com", "Ada Lovelace")).not.toBe(
      registrationDedupeKey("b@example.com", "Ada Lovelace"),
    );
  });

  it("collapses rows with the same email and name, keeping the last occurrence (and its number)", () => {
    const rows = [
      {
        rowNumber: 2,
        email: "one@example.com",
        name: "Ada Lovelace",
        affiliation: "Old",
        idNumber: 1,
      },
      {
        rowNumber: 3,
        email: "two@example.com",
        name: "Two Person",
        affiliation: null,
        idNumber: 2,
      },
      {
        rowNumber: 4,
        email: "one@example.com",
        name: "Ada Lovelace",
        affiliation: "New",
        idNumber: 9,
      },
    ];

    expect(dedupeRegistrationCsvRows(rows)).toEqual([
      {
        rowNumber: 4,
        email: "one@example.com",
        name: "Ada Lovelace",
        affiliation: "New",
        idNumber: 9,
      },
      {
        rowNumber: 3,
        email: "two@example.com",
        name: "Two Person",
        affiliation: null,
        idNumber: 2,
      },
    ]);
  });

  it("keeps distinct people who share an email but differ by name", () => {
    const rows = [
      {
        rowNumber: 2,
        email: "shared@example.com",
        name: "Ada Lovelace",
        affiliation: "A",
        idNumber: 1,
      },
      {
        rowNumber: 3,
        email: "shared@example.com",
        name: "Alan Turing",
        affiliation: "B",
        idNumber: 2,
      },
    ];

    // Both survive: a shared email with different names is two people.
    expect(dedupeRegistrationCsvRows(rows)).toEqual(rows);
  });

  it("treats case- and whitespace-variant names on one email as the same person", () => {
    const rows = [
      {
        rowNumber: 2,
        email: "one@example.com",
        name: "Ada  Lovelace",
        affiliation: "Old",
        idNumber: 1,
      },
      {
        rowNumber: 3,
        email: "one@example.com",
        name: "ada lovelace",
        affiliation: "New",
        idNumber: 2,
      },
    ];

    expect(dedupeRegistrationCsvRows(rows)).toEqual([
      {
        rowNumber: 3,
        email: "one@example.com",
        name: "ada lovelace",
        affiliation: "New",
        idNumber: 2,
      },
    ]);
  });

  it("always keeps rows without an email as distinct walk-ins", () => {
    const rows = [
      { rowNumber: 2, email: null, name: "Walk In", affiliation: null, idNumber: null },
      { rowNumber: 3, email: null, name: "Walk In", affiliation: null, idNumber: null },
    ];

    expect(dedupeRegistrationCsvRows(rows)).toEqual(rows);
  });
});
