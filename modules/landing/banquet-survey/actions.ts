"use server";

import { and, eq, sql } from "drizzle-orm";
import { VALID_YEARS, type ValidYear } from "@/constants/config";
import { db } from "@/db";
import { banquetResponses } from "@/db/schema";
import { sendBanquetConfirmation } from "@/lib/email/banquet-confirmation";
import { getAppSettings } from "@/modules/admin/settings/lib/queries";
import { resolveCheckInRecipients } from "@/modules/admin/settings/lib/test-mode";
import {
  allergenLabel,
  BANQUET_DATE_FALLBACK,
  BANQUET_VENUE_FALLBACK,
  isAllergenId,
} from "./lib/constants";
import { type BanquetValues, validateBanquet } from "./lib/schema";

export interface SubmitBanquetResult {
  ok: boolean;
  /** Field-keyed validation errors (defensive; the client validates first). */
  errors?: Record<string, string>;
  /** A human-readable summary error for non-field failures. */
  message?: string;
  /** True only when a confirmation was actually delivered to the submitter's address. */
  emailed?: boolean;
}

/** Parse the JSON allergen list from the form, keeping only known allergen ids. */
function parseAllergens(raw: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "[]");
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (value): value is string => typeof value === "string" && isAllergenId(value),
  );
}

export async function submitBanquetSurvey(formData: FormData): Promise<SubmitBanquetResult> {
  // 1. Honeypot — silently reject obvious bots.
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { ok: false, message: "Your submission could not be processed." };
  }

  // 2. Year from the route.
  const year = Number(formData.get("year"));
  if (!VALID_YEARS.includes(year as ValidYear)) {
    return { ok: false, message: "Invalid year." };
  }

  // 3. Read + normalize the submitted values. Dietary fields only apply when attending.
  const str = (key: string) => String(formData.get(key) ?? "");
  const attendingRaw = str("attending");
  const isAttending = attendingRaw === "yes";
  const attendingValue: BanquetValues["attending"] =
    attendingRaw === "yes" ? "yes" : attendingRaw === "no" ? "no" : "";
  const values: BanquetValues = {
    name: str("name"),
    affiliation: str("affiliation"),
    email: str("email"),
    attending: attendingValue,
    allergens: isAttending ? parseAllergens(str("allergens")) : [],
    allergenOther: isAttending ? str("allergen_other") : "",
    message: isAttending ? str("message") : "",
  };

  // 4. Validate identically to the client.
  const { valid, errors } = validateBanquet(values);
  if (!valid) {
    return {
      ok: false,
      errors,
      message: "Please correct the highlighted fields and try again.",
    };
  }

  // 5. Upsert the RSVP, keyed by (year + normalized email + name). A shared email can hold several
  // distinct people, so the RSVP updates the row with this exact name and inserts a new one for a
  // new name. Invitation links prefill the invited name, so a normal invited RSVP updates in place.
  const email = values.email.trim().toLowerCase();
  const name = values.name.trim();
  const affiliation = values.affiliation.trim() || null;
  const allergenOther =
    isAttending && values.allergenOther.trim() ? values.allergenOther.trim() : null;
  const message = isAttending && values.message.trim() ? values.message.trim() : null;

  try {
    const respondedAt = new Date();
    await db
      .insert(banquetResponses)
      .values({
        year,
        name,
        affiliation,
        email,
        attending: isAttending,
        allergens: values.allergens,
        allergenOther,
        message,
        respondedAt,
      })
      .onConflictDoUpdate({
        target: [banquetResponses.year, banquetResponses.email, banquetResponses.name],
        set: {
          affiliation,
          attending: isAttending,
          allergens: values.allergens,
          allergenOther,
          message,
          // An imported invitee submitting the form becomes a responder.
          respondedAt,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error("Banquet RSVP persistence failed", error);
    return { ok: false, message: "We couldn't save your response. Please try again." };
  }

  // 6. Confirmation email (non-fatal). Honors check-in test mode like the admin
  // sends: while test mode is on, the email is redirected to the tester list and
  // real send tracking is left untouched, so `emailed` stays false.
  let emailed = false;
  try {
    const settings = await getAppSettings();
    const banquetDate = settings.banquetDate ?? BANQUET_DATE_FALLBACK;
    const banquetVenue = settings.banquetVenue ?? BANQUET_VENUE_FALLBACK;
    const recipients = resolveCheckInRecipients({
      testMode: settings.checkInTestMode,
      testerEmails: settings.testerEmails,
      intended: email,
    });
    if (recipients) {
      await sendBanquetConfirmation({
        to: recipients,
        year,
        name,
        attending: isAttending,
        banquetDate,
        banquetVenue,
        allergens: values.allergens.map(allergenLabel),
        allergenOther: allergenOther ?? undefined,
        message: message ?? undefined,
      });
      // Don't pollute real send tracking (or claim delivery) while redirecting to testers.
      // Match the exact row by (year, email, name): a shared email can hold several people, so
      // keying on email alone would bump send tracking on their siblings too.
      if (!settings.checkInTestMode) {
        await db
          .update(banquetResponses)
          .set({
            emailsSentCount: sql`${banquetResponses.emailsSentCount} + 1`,
            confirmationSentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(banquetResponses.year, year),
              eq(banquetResponses.email, email),
              eq(banquetResponses.name, name),
            ),
          );
        emailed = true;
      }
    }
  } catch (error) {
    console.error("Banquet confirmation email failed", error);
  }

  return { ok: true, emailed };
}
