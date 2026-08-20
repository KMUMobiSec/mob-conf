## Why

Organizers need to invite already-registered attendees to RSVP for the banquet
without waiting for them to find the survey link. Today the banquet survey only
captures organic submissions and has no way to seed invitees, send invitations,
or tell who has been invited versus who has responded.

## What Changes

- Add an **Import from registrations** action to the banquet dashboard that
  creates invitee rows from the year's `registrations` (name, email,
  affiliation), skipping registrations with no email and **deduping by email**
  (any email already present is skipped, never updated).
- Add a new **banquet invitation email** whose body links to the survey
  prefilled with the recipient's name and email
  (`/{year}/banquet-survey?email=…&name=…`).
- Track **invited vs responded** via a new `responded_at` marker so imported
  people show as *Invited* and are not miscounted as *Not attending*. The public
  submit stamps `responded_at`.
- Accept a **`?name=`** query param on the public form: name is prefilled and
  locked when present; email stays prefilled and locked when valid. No params
  leaves fields empty and editable.
- Add a **Status column and filter** (All / Invited / Attending / Not attending)
  to the dashboard, plus two explicit bulk action sets: invitation sends (to
  selected / to all invited) and confirmation sends (to selected / to all
  responded). Per-row action is contextual to status.
- Scope the existing confirmation sends to **responded** rows only.

## Capabilities

### New Capabilities

<!-- No brand-new capability; this extends existing banquet capabilities. -->

### Modified Capabilities

- `banquet-survey`: adds `?name=` prefill and the responded-at marker set on
  submit.
- `admin-banquet-responses`: adds registration import, the invitation email +
  sends, the Invited status and filter, and scopes confirmation sends to
  responders.

## Impact

- **Database**: three additive columns on `banquet_responses`
  (`responded_at`, `invitation_sent_at`, `invitations_sent_count`) plus a
  one-time `responded_at` backfill for pre-existing rows.
- **Email**: new `lib/email/banquet-invitation.templates.ts` +
  `banquet-invitation.ts` (reuses `RESEND_EMAIL_FROM_BANQUET`); extended
  `lib/routes/banquet-survey.ts` (name param).
- **Landing**: `?name=` threaded through route -> page -> form; submit stamps
  `responded_at`.
- **Admin**: new import + invitation actions and queries in
  `modules/admin/banquet-survey/`; dashboard status column/filter, Import button,
  and a second bulk action set.
- **Reuses**: `registrations` table + queries, `resolveCheckInRecipients` test
  mode, `getResendClient`, `requirePublicBaseUrl`, `getCurrentAdminSession`.
