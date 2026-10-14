# Banquet Survey — Registration Import & Invitations — Design

Date: 2026-07-06
Status: Approved for OpenSpec proposal
Builds on: 2026-07-06-banquet-survey-design.md (banquet_responses table, admin dashboard)

## Summary

Let admins import the conference `registrations` into the banquet survey as
**invitees**, send them a **banquet invitation email** containing a prefilled
survey link (name + email), and track who has actually responded. The public
survey accepts a `?name=` param alongside `?email=`. Imports dedupe by email.

## Locked decisions

1. **Import source**: the existing `registrations` table for the selected year
   (skip registrations with no email). One-click "Import from registrations".
2. **Invitation email**: a new `banquet-invitation` email (distinct from the RSVP
   confirmation) whose body links to the prefilled survey.
3. **Invited vs responded**: add a `responded_at` marker; imported rows are
   "Invited" until the person submits. Dashboard gets a Status column + filter.
4. **Prefill**: `?email=` prefills and locks email when valid (source of truth,
   unique per person); `?name=` prefills and locks name when present. No params
   leaves the field empty and editable.
5. **Bulk actions**: two explicit sets. Invitation sends (to selected / to all
   invited) and confirmation sends (to selected / to all responded). Per-row
   action is contextual to the row's status.
6. **Re-import**: strict dedupe by email. Any email already present (invited or
   responded) is skipped, never updated.

## Data model

Three additive nullable/defaulted columns on `banquet_responses`:

- `responded_at timestamptz` (nullable) — null means imported/invited, not yet
  responded. Set to `now()` when the public form is submitted (insert or upsert).
- `invitation_sent_at timestamptz` (nullable) — last invitation send.
- `invitations_sent_count integer notNull default 0` — cumulative invitations
  sent (separate from `emails_sent_count` / `confirmation_sent_at`, which stay
  dedicated to RSVP confirmations).

**Status** is derived, not stored: `responded_at IS NULL` -> Invited; else
`attending` -> Attending / Not attending.

**Migration**: `pnpm db:generate` + `pnpm db:migrate` (additive `ADD COLUMN` x3).
No backfill: the table-create migration (0011) and this column-add migration
(0012) ship together on an empty table, so there are no pre-existing responses to
mark responded. A backfill was deliberately rejected because it cannot tell a
pre-existing response from an imported invitee (both have `responded_at IS NULL`)
and would corrupt invitees if run after an import.

## Import

`modules/admin/banquet-survey/actions.ts` -> `importBanquetFromRegistrations({
year })` (auth-guarded):

1. Query `registrations` for the year with a non-null email (new query
   `listRegistrationEmailsForYear(year)` or reuse existing registration queries).
2. Normalize emails to lowercase; dedupe within the batch.
3. Load existing `banquet_responses` emails for the year into a Set.
4. Insert an invitee row for each registration email **not** in that Set: name,
   affiliation, email, `attending=false`, `responded_at=null`, `allergens=[]`.
   Skip emails already present.
5. `revalidatePath("/admin/banquet-survey")`; return `{ ok, imported, skipped }`.

Runs inside a transaction. Registrations without email are skipped and counted
toward `skipped`.

## Invitation email

- `lib/email/banquet-invitation.templates.ts` (pure): `BanquetInvitationEmailInput
  { year; name; banquetDate; banquetVenue; surveyUrl; logoUrl? }`,
  `banquetInvitationSubject(year)`, `renderBanquetInvitationHtml`,
  `renderBanquetInvitationText`. Emdash-free, `escapeHtml` all user input, footer
  `&middot;`. Body: a short invite plus a button linking to `surveyUrl`.
- `lib/email/banquet-invitation.ts` (`server-only`): `sendBanquetInvitation(input
  & { to })` via `getResendClient`, reusing `RESEND_EMAIL_FROM_BANQUET`. Throws on
  Resend error.
- Survey link: `banquetSurveyUrl(requirePublicBaseUrl(), year, { email, name })`.
  `lib/routes/banquet-survey.ts` is extended so `banquetSurveyPath`/`Url` accept
  `{ email?, name? }` and encode both params. `requirePublicBaseUrl()` throws when
  `NEXT_PUBLIC_BASE_URL` is unset, surfacing as a per-recipient failure.
- Subject: `You are invited to the MOBISEC {year} banquet`.

## Admin actions

New invitation sends (mirror the confirmation-send pattern in
`sendBanquetConfirmations`): auth guard, dedupe ids, `getAppSettings`,
`resolveCheckInRecipients` test-mode gating, per-id try/catch, atomic
`invitations_sent_count + 1` + `invitation_sent_at` (skipped in test mode),
`revalidatePath`, never throw. Signatures:

```
sendBanquetInvitations({ year, ids }): Promise<SendBanquetResult>
resendBanquetInvitation({ year, id })   => sendBanquetInvitations({ year, ids:[id] })
sendAllBanquetInvitations({ year })     => ids resolved server-side from INVITED rows only
```

Existing confirmation sends are **scoped to responded rows**:
`sendAllBanquetConfirmations` resolves ids from `responded_at IS NOT NULL` rows,
and a per-row Resend confirmation is only offered on responded rows.

## Public form

- `app/[year]/(public)/banquet-survey/page.tsx`: read `name` from `searchParams`
  alongside `email`; pass `initialName` down.
- `BanquetSurveyPage`: forward `initialName`.
- `BanquetSurveyForm`: new `initialName` prop. `nameLocked = initialName.trim()
  !== ""`; name Input prefilled + `readOnly={nameLocked}`. Email lock unchanged
  (locked when the prefilled value is valid). `reset()` re-applies both.
- `submitBanquetSurvey`: on insert set `responded_at = now()`; on
  `onConflictDoUpdate` (an invited row responding) also set `responded_at =
  now()`. Confirmation-send tracking unchanged.

## Dashboard

- New **Status** column: Invited (muted), Attending (badge), Not attending.
- **Status filter** replacing the attending-only filter: All / Invited /
  Attending / Not attending. `parseBanquetListParams` returns
  `status: "" | "invited" | "attending" | "not_attending"`; `listBanquetResponses`
  maps it to `responded_at IS NULL` / `responded_at IS NOT NULL AND attending` /
  `... AND NOT attending`.
- **Import from registrations** button (with a confirm dialog + result message
  "Imported N, skipped M").
- **Invitation columns**: show `invitations_sent_count` / `invitation_sent_at`
  next to the confirmation ones (compact).
- Bulk bar: two action sets (invitation to selected / all invited; confirmation
  to selected / all responded). Per-row action contextual to status.

## Error handling & edge cases

- **Dedupe**: import skips any email already in `banquet_responses`; the
  `(year,email)` unique index is a backstop.
- **No base URL**: invitation link build throws -> per-recipient failure with a
  clear message; import and dashboard are unaffected.
- **Test mode**: invitations honor `checkInTestMode` exactly like confirmations
  (redirect to testers, skip real count/timestamp writes).
- **Invited person responds**: upsert flips `responded_at` to now and moves them
  out of the Invited bucket; confirmation email fires as before.
- **Locked name from a wrong registration**: acceptable; email is the identity
  key. Name lock only applies when a `?name=` param is present.

## Testing

- Unit: invitation email template (subject has year, escapes input, link
  present, no emdash); route helper encodes email+name; status-filter mapping in
  queries/filters; import dedupe logic (pure part).
- Real-DB round-trip: import creates invitee rows, dedupe skips existing, public
  submit flips responded_at, invitation count increments atomically.
- `pnpm typecheck` + `biome` + `pnpm test` + `pnpm build`.

## Out of scope (YAGNI)

- CSV import (registrations table is the source; can add later).
- Editing invitee rows in the dashboard.
- Reminder scheduling / drip campaigns.
