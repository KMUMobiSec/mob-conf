import { describe, expect, it } from "vitest";
import { dedupeBanquetInvitees } from "@/modules/admin/banquet-survey/lib/import-dedupe";
import { personDedupeKey } from "@/modules/admin/lib/person-identity";

const invitee = (email: string, name: string, affiliation: string | null = null) => ({
  email,
  name,
  affiliation,
});

describe("dedupeBanquetInvitees", () => {
  it("keeps distinct people who share an email but differ by name", () => {
    const invitees = [
      invitee("shared@example.com", "Ada Lovelace"),
      invitee("shared@example.com", "Alan Turing"),
    ];
    expect(dedupeBanquetInvitees(invitees, new Set())).toEqual(invitees);
  });

  it("collapses the same email and name within the batch (keeps the first, case-insensitive)", () => {
    const invitees = [
      invitee("one@example.com", "Ada Lovelace", "A"),
      invitee("one@example.com", "ada  lovelace", "B"),
    ];
    expect(dedupeBanquetInvitees(invitees, new Set())).toEqual([invitees[0]]);
  });

  it("drops invitees whose (email + name) already exists in banquet responses", () => {
    const invitees = [
      invitee("one@example.com", "Ada Lovelace"),
      invitee("one@example.com", "Alan Turing"),
    ];
    const existing = new Set([personDedupeKey("one@example.com", "Ada Lovelace")]);
    expect(dedupeBanquetInvitees(invitees, existing)).toEqual([invitees[1]]);
  });

  it("imports a shared email with a new name even when that email is already present", () => {
    const invitees = [invitee("one@example.com", "Alan Turing")];
    const existing = new Set([personDedupeKey("one@example.com", "Ada Lovelace")]);
    expect(dedupeBanquetInvitees(invitees, existing)).toEqual(invitees);
  });
});
