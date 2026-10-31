"use server";

import { randomBytes } from "node:crypto";
import { VALID_YEARS, type ValidYear } from "@/constants/config";
import { db } from "@/db";
import { registrationOrders } from "@/db/schema";
import { sendRegistrationConfirmEmail } from "@/lib/email/registration-confirm";
import { sendRegistrationInvoiceEmail } from "@/lib/email/registration-invoice";
import { requirePublicBaseUrl } from "@/lib/routes/base-url";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { findCategory, isRegistrationOpen, loadRegistrationYearData } from "./lib/categories";
import {
  createRegistrationTokenPayload,
  getRegistrationTokenSecret,
  parseRegistrationToken,
  signRegistrationToken,
} from "./lib/token";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface RequestRegistrationLinkResult {
  ok: boolean;
  message?: string;
}

/** Step 1 — email gate: verify the visitor, sign a token, and email a magic link. */
export async function requestRegistrationLink(
  formData: FormData,
): Promise<RequestRegistrationLinkResult> {
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { ok: false, message: "Your request could not be processed." };
  }

  const captchaOk = await verifyTurnstile(String(formData.get("cf-turnstile-response") ?? ""));
  if (!captchaOk) {
    return { ok: false, message: "CAPTCHA verification failed. Please try again." };
  }

  const year = Number(formData.get("year"));
  if (!VALID_YEARS.includes(year as ValidYear)) {
    return { ok: false, message: "Registration is not available for the selected year." };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  const yearData = await loadRegistrationYearData(year as ValidYear);
  if (!isRegistrationOpen(yearData)) {
    return { ok: false, message: "Registration is currently closed for this edition." };
  }

  const payload = createRegistrationTokenPayload({ email, year: year as ValidYear });
  const token = signRegistrationToken(payload, getRegistrationTokenSecret());
  const confirmUrl = `${requirePublicBaseUrl()}/${year}/registration-payment/form?token=${encodeURIComponent(token)}`;

  try {
    await sendRegistrationConfirmEmail({ to: email, year, confirmUrl });
  } catch (error) {
    console.error("Failed to send registration confirm email", error);
    return { ok: false, message: "We couldn't send the link. Please try again in a moment." };
  }

  return { ok: true };
}

export interface SubmitRegistrationResult {
  ok: boolean;
  errors?: Record<string, string>;
  message?: string;
  invoiceToken?: string;
}

/** Step 2 — the full registration form, gated by the signed token from step 1. */
export async function submitRegistration(formData: FormData): Promise<SubmitRegistrationResult> {
  const token = String(formData.get("token") ?? "");
  const parsed = parseRegistrationToken(token, getRegistrationTokenSecret());
  if (!parsed) {
    return {
      ok: false,
      message: "Your registration link expired or could not be verified. Please request a new one.",
    };
  }

  const year = parsed.year;
  const yearData = await loadRegistrationYearData(year);
  if (!isRegistrationOpen(yearData)) {
    return { ok: false, message: "Registration is currently closed for this edition." };
  }

  const str = (key: string) => String(formData.get(key) ?? "").trim();
  const firstName = str("firstName");
  const lastName = str("lastName");
  const affiliation = str("affiliation");
  const phoneNumber = str("phoneNumber") || null;
  const country = str("country");
  const categoryName = str("category");
  const paperId = str("paperId") || null;
  const paperTitle = str("paperTitle") || null;

  const errors: Record<string, string> = {};
  if (!firstName) errors.firstName = "First name is required.";
  if (!lastName) errors.lastName = "Last name is required.";
  if (!affiliation) errors.affiliation = "Affiliation is required.";
  if (!country) errors.country = "Country is required.";

  const category = findCategory(yearData, categoryName);
  if (!category) {
    errors.category = "Please select a valid registration category.";
  } else if (category.requiresPaper) {
    if (!paperId) errors.paperId = "Paper ID is required for author registration.";
    if (!paperTitle) errors.paperTitle = "Paper title is required for author registration.";
  }

  if (Object.keys(errors).length > 0 || !category) {
    return { ok: false, errors, message: "Please correct the highlighted fields and try again." };
  }

  const billing = {
    billingOrganization: str("billingOrganization") || null,
    billingDepartment: str("billingDepartment") || null,
    billingAddress: str("billingAddress") || null,
    billingCity: str("billingCity") || null,
    billingState: str("billingState") || null,
    billingZipCode: str("billingZipCode") || null,
    billingCountry: str("billingCountry") || null,
    billingVatNumber: str("billingVatNumber") || null,
    billingContactName: str("billingContactName") || null,
  };

  const total = category.usd.toFixed(2);
  const invoiceToken = randomBytes(16).toString("hex");

  try {
    await db.insert(registrationOrders).values({
      year,
      email: parsed.email,
      firstName,
      lastName,
      affiliation,
      phoneNumber,
      country,
      categoryName: category.name,
      categoryCurrency: "USD",
      categoryPrice: category.usd.toFixed(2),
      requiresPaper: category.requiresPaper,
      paperId,
      paperTitle,
      ...billing,
      subtotal: total,
      discount: "0.00",
      total,
      invoiceToken,
    });
  } catch (error) {
    console.error("Failed to create registration order", error);
    return { ok: false, message: "We couldn't save your registration. Please try again." };
  }

  const invoiceUrl = `${requirePublicBaseUrl()}/${year}/invoice/${invoiceToken}`;
  try {
    await sendRegistrationInvoiceEmail({
      to: parsed.email,
      year,
      categoryName: category.name,
      total,
      invoiceUrl,
    });
  } catch (error) {
    console.error("Failed to send registration invoice email", error);
  }

  return { ok: true, invoiceToken };
}
