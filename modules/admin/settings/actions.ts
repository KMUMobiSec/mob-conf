"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { getCurrentAdminSession } from "@/lib/auth/session";
import { normalizeTesterEmails } from "./lib/test-mode";

const QR_CHECK_INS_PATH = "/admin/qr-check-ins";
const ADMIN_SETUP_PATH = "/admin/setup";
const BANQUET_SURVEY_PATH = "/admin/banquet-survey";

export interface AdminActionResult {
  ok: boolean;
  error?: string;
}

export interface UpdateTesterEmailsResult extends AdminActionResult {
  emails?: string[];
}

export interface UpdateBanquetDetailsResult extends AdminActionResult {
  banquetDate?: string | null;
  banquetVenue?: string | null;
}

/** Upsert the single settings row, patching only the provided fields. */
async function upsertAppSettings(patch: {
  checkInTestMode?: boolean;
  testerEmails?: string[];
  banquetDate?: string | null;
  banquetVenue?: string | null;
}): Promise<void> {
  await db
    .insert(appSettings)
    .values({ singleton: true, ...patch })
    .onConflictDoUpdate({
      target: appSettings.singleton,
      set: { ...patch, updatedAt: new Date() },
    });
}

export async function setCheckInTestMode(enabled: boolean): Promise<AdminActionResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };

  try {
    await upsertAppSettings({ checkInTestMode: enabled });
    revalidatePath(QR_CHECK_INS_PATH);
    revalidatePath(ADMIN_SETUP_PATH);
    return { ok: true };
  } catch (error) {
    console.error("Failed to set check-in test mode", error);
    return { ok: false, error: "Could not update test mode." };
  }
}

export async function updateTesterEmails(raw: string): Promise<UpdateTesterEmailsResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };

  const { emails, invalid } = normalizeTesterEmails(raw);
  if (invalid.length > 0) {
    return {
      ok: false,
      error: `Invalid email${invalid.length > 1 ? "s" : ""}: ${invalid.join(", ")}`,
    };
  }

  try {
    await upsertAppSettings({ testerEmails: emails });
    revalidatePath(QR_CHECK_INS_PATH);
    revalidatePath(ADMIN_SETUP_PATH);
    return { ok: true, emails };
  } catch (error) {
    console.error("Failed to update tester emails", error);
    return { ok: false, error: "Could not update tester emails." };
  }
}

/** Update the admin-editable banquet date and venue labels (empty input clears to null). */
export async function updateBanquetDetails(input: {
  date: string;
  venue: string;
}): Promise<UpdateBanquetDetailsResult> {
  const session = await getCurrentAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };

  const banquetDate = input.date.trim() || null;
  const banquetVenue = input.venue.trim() || null;

  try {
    await upsertAppSettings({ banquetDate, banquetVenue });
    revalidatePath(ADMIN_SETUP_PATH);
    revalidatePath(BANQUET_SURVEY_PATH);
    return { ok: true, banquetDate, banquetVenue };
  } catch (error) {
    console.error("Failed to update banquet details", error);
    return { ok: false, error: "Could not update banquet details." };
  }
}
