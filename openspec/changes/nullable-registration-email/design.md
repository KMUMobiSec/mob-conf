## Context

The qr-check-ins admin flow (`/admin/qr-check-ins`) stores attendees in `registrations`, keyed for upsert/dedup by a normalized lowercase email and constrained by a `(year, email)` unique index. Email is currently `NOT NULL` and every entry path (`createRegistration`, `parseRegistrationCsv`, `parseManualRegistrationInput`) requires a valid email — blank-email CSV rows are pushed to `invalidRows` and dropped. Walk-in and paper registrations frequently have no email, and there is no edit path to fix records after creation.

The email layer (`lib/email/registration-check-in.ts`) sends both the QR pass and the check-in welcome from a single `fromAddress()` reading `RESEND_EMAIL_FROM_AWARDS`.

## Goals / Non-Goals

**Goals:**
- Persist registrations with `email = null` from both CSV import and manual add.
- Keep per-year uniqueness for real emails; allow unlimited null-email rows per year.
- Make null-email rows always-insert in import (no dedup, no upsert match).
- Add an edit action + dialog for email/name/affiliation, including null email.
- Send QR passes (initial + resend) from `registration@mobisec-conference.com`.
- Guard sends to null-email registrations as reported failures.

**Non-Goals:**
- Backfilling or changing existing non-null email data.
- Changing the check-in welcome email's from-address (kept on awards address — assumption).
- Any change to QR verification, nonce, or check-in logic.
- Surfacing per-row invalid reasons in the import dialog (separate improvement).

## Decisions

### 1. `email` → nullable column, keep the unique index
`db/schema/registrations.ts`: drop `.notNull()` on `email`. **Keep** `uniqueIndex("registrations_year_email_idx").on(table.year, table.email)`. Postgres unique indexes treat `NULL` as distinct, so multiple null-email rows in the same year are allowed while non-null emails stay unique per year — no partial index needed.
- _Alternative considered:_ a partial unique index `WHERE email IS NOT NULL`. Rejected — default NULL-distinct behavior already gives exactly this, and changing the index shape adds migration churn.
- Migration is generated via `pnpm db:generate` and applied with `pnpm db:migrate`; never hand-written. Making a `NOT NULL` column nullable is non-destructive and safe to apply anytime (no backfill/drop ordering concern).

### 2. Validation: split "manual/edit" from "CSV row" email rules
In `registration-input.ts`, email must become nullable end-to-end. The current `registrationSchema` requires a valid email. Introduce an email field that: trims, treats empty/whitespace/undefined as `null`, and otherwise validates against `EMAIL_RE` and normalizes to lowercase.
- `RegistrationInput.email` type becomes `string | null`.
- `parseManualRegistrationInput` returns `email: string | null` (name still required).
- `parseRegistrationCsv` maps a missing `email` column or empty cell to `null` rather than a validation failure; a present-but-malformed email is still invalid; a blank name is still invalid.
- `dedupeRegistrationCsvRows`: dedupe only rows with a non-null email by their email key; pass every null-email row through unchanged (do not collapse `null` keys together).

### 3. Import upsert guards null email
`importRegistrations` (`actions.ts`): partition deduped rows into null-email and non-null-email.
- Non-null rows: unchanged behavior — look up existing by email via `listRegistrationsByEmails`, update on match else insert.
- Null-email rows: always `insert` with a fresh nonce, never consulted against `existingEmails`.
- `listRegistrationsByEmails` (`queries.ts`) must be called only with the non-null email list (and defensively ignore nulls) so a `WHERE email IN (...)` never carries a null.

### 4. New `updateRegistration` action + edit dialog
Add `updateRegistration({ year, id, email, name, affiliation })` mirroring `createRegistration`'s auth + validation shape, returning `CreateRegistrationResult`-style errors.
- Validate via the same nullable-email + required-name schema.
- On non-null email: check for a *different* registration in the same year with that email (exclude the row's own id) → return duplicate error. On null email: skip the conflict check.
- `revalidatePath(QR_CHECK_INS_PATH)` on success.
- UI: an `EditRegistrationDialog` client component pre-filled from the row, opened from a per-row action in `RegistrationTable.tsx`. Email input is optional (not `required`, not forced `type=email` validation blocking blank). Reuses the dialog/input pattern from `AddRegistrationDialog`.
- `AddRegistrationDialog` + `createRegistration` also relax email to optional (assumption; trivially reverted by re-adding `required`).

### 5. Registration from-address for QR passes
`lib/email/registration-check-in.ts`: add `registrationFromAddress()` reading `RESEND_EMAIL_FROM_REGISTRATION` (throws if unset, mirroring `fromAddress()`). `sendRegistrationPass` uses it. `sendCheckInWelcome` keeps `fromAddress()` (awards) per the scoping assumption. Add `RESEND_EMAIL_FROM_REGISTRATION=registration@mobisec-conference.com` to `.env.example`/deploy config.

### 6. Sending to null-email registrations
`sendRegistrationQrPasses` (`actions.ts`): before calling `sendRegistrationPass`, if `row.email` is falsy, push a failure `{ id, email: "", error: "No email on file." }` and continue — do not attempt the send. Existing "not found" and send-error failure handling is unchanged.

## Risks / Trade-offs

- **[Type ripples from `email: string | null`]** → `Registration.email` becomes nullable, touching anything that reads it (QR pass send, welcome send, table render). Mitigation: audit `registrations.email` consumers; guard sends (Decision 6); render null as an em-dash/"—" in the table.
- **[`listRegistrationsByEmails` receiving a null]** → could produce a malformed `IN` clause. Mitigation: filter nulls out before the query and only pass non-null emails (Decision 3).
- **[Env var not set in an environment]** → QR pass send throws. Mitigation: matches existing `RESEND_EMAIL_FROM_AWARDS` failure mode; documented in `.env.example`; surfaced as a per-item failure, not a crash.
- **[Dedup map keyed on `null`]** → collapsing all null rows into one is a silent data-loss bug. Mitigation: explicit partition so null rows bypass the Map entirely (Decision 2), covered by a spec scenario.

## Migration Plan

1. Edit schema (email nullable), `pnpm db:generate`, review the generated SQL (expect a single `ALTER COLUMN ... DROP NOT NULL`, no index change), `pnpm db:migrate`.
2. Ship validation/import/action/UI/email changes together.
3. Set `RESEND_EMAIL_FROM_REGISTRATION` in each environment before/at deploy.
- **Rollback:** re-add `.notNull()` only after confirming no null-email rows exist (a re-add would fail otherwise); code rollback is independent and safe.

## Open Questions

- **(Confirm)** Sender scope: QR pass only, or also the check-in welcome email? Assumed QR pass only.
- **(Confirm)** Manual "Add registration" allowing blank email? Assumed yes.
- **(Confirm)** Table display for a null email — em-dash placeholder assumed.
