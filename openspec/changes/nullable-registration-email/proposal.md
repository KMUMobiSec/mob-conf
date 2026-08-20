## Why

Admins run walk-in and paper-based check-ins where an attendee's email is often unknown at registration time. Today the CSV import and the manual "Add registration" form silently drop any row with a blank email, so those attendees never get a record and can't be checked in. Admins also have no way to correct a name, affiliation, or add a missing email after the fact.

## What Changes

- **BREAKING (data model):** `registrations.email` becomes nullable. A registration can now exist with `email = null`. The `(year, email)` uniqueness still applies to non-null emails (Postgres treats NULLs as distinct, so multiple null-email rows per year are allowed).
- CSV import no longer skips rows with a blank/missing email — it creates the registration with `email = null`. Name is still required; a blank name is still an invalid row.
- Import dedup and upsert are email-keyed today. Null-email rows are exempted: they are never deduped against each other and never matched as an existing registration, so each blank-email row always inserts a new record.
- Manual "Add registration" allows a blank email (creates `email = null`). _(Assumption — pending confirmation; can be reverted to email-required for the Add form only.)_
- New **edit registration** action + edit dialog on the qr-check-ins admin table so an admin can change email, name, and affiliation — including filling in a previously blank email or clearing an email back to null.
- QR check-in pass emails (initial send **and** resend, same code path) are sent from `registration@ebision.ifip-wg84.org` via a new `RESEND_EMAIL_FROM_REGISTRATION` env var, instead of the awards from-address. _(Assumption — pending confirmation: scoped to the QR pass only; the post-check-in welcome email keeps the awards from-address.)_
- Sending or resending a QR pass to a null-email registration is reported as a per-row failure ("no email on file"), not an error that aborts the batch.

## Capabilities

### New Capabilities
- `qr-check-in-registrations`: Managing conference check-in registration records — creating them (manual + CSV import) with an optional email, editing them, and emailing QR passes — including how null-email records are handled across import dedup, sending, and uniqueness.

### Modified Capabilities
<!-- None — no existing specs under openspec/specs/. -->

## Impact

- **Schema / migration:** `db/schema/registrations.ts` (email → nullable); a generated Drizzle migration (`pnpm db:generate` then `pnpm db:migrate` — never hand-written). The `registrations_year_email_idx` unique index is retained as-is.
- **Import / validation:** `modules/admin/qr-check-ins/lib/registration-input.ts` (email optional/nullable, dedup skips nulls), `modules/admin/qr-check-ins/actions.ts` (`importRegistrations` upsert guards on null email; new `updateRegistration` action).
- **Queries:** `modules/admin/qr-check-ins/lib/queries.ts` (`listRegistrationsByEmails` must ignore null emails).
- **UI:** `AddRegistrationDialog.tsx` (email optional), new edit dialog, `RegistrationTable.tsx` (row edit trigger), `CsvImportDialog.tsx` copy update.
- **Email:** `lib/email/registration-check-in.ts` (new registration from-address), `.env.example` / deploy env (`RESEND_EMAIL_FROM_REGISTRATION`).
- **Sending:** `sendRegistrationQrPasses` guards null-email rows as failures.
