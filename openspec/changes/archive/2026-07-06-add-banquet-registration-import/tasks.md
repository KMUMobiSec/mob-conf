## 1. Data model and migration

- [x] 1.1 Add `responded_at` (timestamptz nullable), `invitation_sent_at` (timestamptz nullable), and `invitations_sent_count` (int notNull default 0) to `db/schema/banquet-responses.ts` with doc comments
- [x] 1.2 Run `pnpm db:generate` then `pnpm db:migrate` (additive `ADD COLUMN` x3; do not hand-edit generated SQL)
- [x] 1.3 No backfill needed: 0011 (table create) and 0012 (columns) ship together on an empty table. A backfill was rejected because it cannot distinguish a pre-existing response from an imported invitee (both have `responded_at IS NULL`) and would corrupt invitees if run after an import.

## 2. Route helper and invitation email

- [x] 2.1 Extend `lib/routes/banquet-survey.ts` so `banquetSurveyPath`/`banquetSurveyUrl` accept `{ email?, name? }` and encode both params (keep existing call sites working or update them)
- [x] 2.2 Create `lib/email/banquet-invitation.templates.ts` (pure: `BanquetInvitationEmailInput { year, name, banquetDate, banquetVenue, surveyUrl, logoUrl? }`, `banquetInvitationSubject(year)`, `renderBanquetInvitationHtml`, `renderBanquetInvitationText`; emdash-free, escaped, `&middot;` footer, survey-link button)
- [x] 2.3 Create `lib/email/banquet-invitation.ts` (`server-only`; `sendBanquetInvitation(input & { to })` via `getResendClient`, `RESEND_EMAIL_FROM_BANQUET`, throws on Resend error)

## 3. Public form: name prefill + responded-at

- [x] 3.1 `app/[year]/(public)/banquet-survey/page.tsx`: read `name` from `searchParams` and pass `initialName` through
- [x] 3.2 `BanquetSurveyPage.tsx`: forward `initialName`
- [x] 3.3 `BanquetSurveyForm.tsx`: add `initialName` prop, prefill name, `nameLocked = initialName.trim() !== ""` (readOnly), re-apply in `reset()`; email lock unchanged
- [x] 3.4 `modules/landing/banquet-survey/actions.ts`: set `respondedAt: new Date()` on insert and in the `onConflictDoUpdate` set clause

## 4. Admin logic: import + invitations + status

- [x] 4.1 `modules/admin/banquet-survey/lib/queries.ts`: add a registrations-for-year (email present) query, an existing-banquet-emails query, and extend `listBanquetResponses` to accept a `status` filter (`invited` -> respondedAt null; `attending`/`not_attending` -> respondedAt not null + attending). Add `listInvitedBanquetResponses(year)` and `listRespondedBanquetResponses(year)` (or id variants) for server-side bulk targeting
- [x] 4.2 `modules/admin/banquet-survey/lib/filters.ts`: replace the attending filter with a `status` param (`"" | "invited" | "attending" | "not_attending"`)
- [x] 4.3 `modules/admin/banquet-survey/actions.ts`: add `importBanquetFromRegistrations({ year })` (transactional, dedupe by email, skip existing/null-email, return `{ ok, imported, skipped }`)
- [x] 4.4 `modules/admin/banquet-survey/actions.ts`: add `sendBanquetInvitations({ year, ids })`, `resendBanquetInvitation({ year, id })`, `sendAllBanquetInvitations({ year })` (ids from invited rows only), mirroring the confirmation-send pattern (auth, test mode, atomic `invitations_sent_count + 1` + `invitation_sent_at`, never throw). Build the link with `banquetSurveyUrl(requirePublicBaseUrl(), year, { email, name })`
- [x] 4.5 Scope `sendAllBanquetConfirmations` to responded rows only

## 5. Admin UI

- [x] 5.1 `app/admin/(protected)/banquet-survey/page.tsx`: pass `status` filter through; update `FilterSelect` options to All / Invited / Attending / Not attending; serialize the new timestamps
- [x] 5.2 `BanquetResponsesTable.tsx`: add a Status column (Invited / Attending / Not attending), show invitation sent count/time, make the per-row action contextual (Invited -> Send invitation; responded -> Resend confirmation), and add the second bulk action set (invitation to selected / all invited)
- [x] 5.3 Add an "Import from registrations" button (confirm dialog + result message "Imported N, skipped M") that calls `importBanquetFromRegistrations`

## 6. Tests and verification

- [x] 6.1 Unit: invitation email template (subject has year, escapes input, contains the link, no emdash); route helper encodes email + name; status-filter mapping
- [x] 6.2 Real-DB round-trip: import creates invitees + dedupe skips existing + null-email skipped; public submit stamps responded_at (invited -> responded); invitation count increments atomically; confirmation "send to all" excludes invited rows
- [x] 6.3 Run `pnpm typecheck` + `biome check` + `pnpm test` + `pnpm build`; fix any failures
