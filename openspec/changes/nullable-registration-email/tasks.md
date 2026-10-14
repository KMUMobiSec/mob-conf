## 1. Schema & migration

- [x] 1.1 In `db/schema/registrations.ts`, make `email` nullable (drop `.notNull()`); keep the `registrations_year_email_idx` unique index and update the column comment
- [x] 1.2 Run `pnpm db:generate` and review the generated SQL — expect a single `ALTER COLUMN "email" DROP NOT NULL`, no index changes
- [x] 1.3 Run `pnpm db:migrate` to apply

## 2. Validation & parsing (`registration-input.ts`)

- [x] 2.1 Change `RegistrationInput.email` (and `RegistrationCsvRow`) to `string | null`
- [x] 2.2 Update the email schema field: trim; treat empty/whitespace/absent as `null`; otherwise validate with `EMAIL_RE` and normalize to lowercase. Keep `name` required
- [x] 2.3 Update `parseRegistrationCsv` so a blank/whitespace email cell or absent `email` column yields `email: null` (valid row); a present-but-malformed email stays invalid; a blank name stays invalid
- [x] 2.4 Update `dedupeRegistrationCsvRows` to dedupe only non-null emails by key and pass every null-email row through unchanged

## 3. Import & actions (`actions.ts`, `queries.ts`)

- [x] 3.1 In `importRegistrations`, partition deduped rows into non-null-email and null-email; run the existing upsert only for non-null rows; always `insert` null-email rows with a fresh nonce
- [x] 3.2 Ensure `listRegistrationsByEmails` is called only with non-null emails (filter nulls; defensively ignore nulls in `queries.ts`)
- [x] 3.3 Relax `createRegistration` + its schema to accept a null email (assumption); on null email skip the existing-email duplicate check
- [x] 3.4 Add `updateRegistration({ year, id, email, name, affiliation })`: auth, validate (nullable email, required name); on non-null email reject if a *different* same-year registration uses it (exclude own id); update row + `updatedAt`; `revalidatePath`
- [x] 3.5 Add a query helper for the edit conflict check (same-year email excluding an id), or reuse `getRegistrationByEmail` and compare ids

## 4. QR pass sending & failures

- [x] 4.1 In `sendRegistrationQrPasses`, if a selected row has no email, push `{ id, email: "", error: "No email on file." }` and skip the send (do not abort the batch)

## 5. Email from-address

- [x] 5.1 In `lib/email/registration-check-in.ts`, add `registrationFromAddress()` reading `RESEND_EMAIL_FROM_REGISTRATION` (throw if unset); use it in `sendRegistrationPass`; leave `sendCheckInWelcome` on the awards address
- [x] 5.2 Add `RESEND_EMAIL_FROM_REGISTRATION=registration@mobisec-conference.com` to `.env.example` (and note it for deploy env)

## 6. UI

- [x] 6.1 Make the email input optional in `AddRegistrationDialog` (drop `required`; allow blank submit)
- [x] 6.2 Create `EditRegistrationDialog` (client) mirroring the add dialog: pre-filled email/name/affiliation, optional email, calls `updateRegistration`, error display, refresh on success
- [x] 6.3 Wire a per-row edit trigger into `RegistrationTable.tsx` and render a placeholder ("—") for null emails
- [x] 6.4 Update `CsvImportDialog` copy to note email is optional (rows without an email are still imported)

## 7. Verify

- [x] 7.1 Audit remaining `registrations.email` consumers for the new `string | null` type (typecheck passes)
- [x] 7.2 Manual/end-to-end check: import a CSV mixing valid, blank-email, blank-name, and duplicate rows; confirm blank-email rows insert as null, two blank-email rows create two records, blank-name is invalid
- [x] 7.3 Edit a null-email registration to add an email, clear an email back to null, and confirm a conflicting-email edit is rejected
- [x] 7.4 Resend a QR pass and confirm it sends from the registration address; confirm a null-email registration is reported as a "No email on file" failure without aborting the batch
