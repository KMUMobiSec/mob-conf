## Why

The conference needs to collect banquet RSVPs (attendance, dietary/allergen
needs, and messages) from invited attendees, and organizers need a place to view
those responses and re-send confirmations. Today the site has only the
presentation upload form and no admin surface that treats forms as a managed
collection.

## What Changes

- Add a public **Banquet Survey** RSVP form at `/{year}/banquet-survey`. The
  attendee's email is prefilled and read-only when passed via a `?email=` link
  param (editable when opened cold). Name and affiliation are always shown. A
  Yes/No "Are you attending the banquet on {date} at {venue}?" control reveals an
  allergen checklist (nuts, shellfish, dairy, gluten, vegetarian, vegan), an
  "other" free-text field, and a message textarea when Yes; No submits with those
  empty. The page is link-only (no site navigation entry).
- On submit, store the response and **auto-send** an RSVP confirmation email
  (non-fatal to the submission). Copy avoids emdashes. A **re-submit** for the
  same year + email **upserts** the row and re-sends the confirmation.
- Make the banquet **date and venue admin-editable** via new `app_settings`
  fields, edited on the Admin Setup page, feeding both the form heading and email
  copy.
- Add a static admin **Forms registry** at `/admin/forms` (cards for Presentation
  Upload and Banquet Survey) plus a new **Forms** sidebar entry.
- Add an admin **Banquet Survey responses dashboard** at `/admin/banquet-survey`
  with search, attending filter, and pagination; a per-row **Resend
  confirmation** action; and **bulk Send to selected / Send to all** actions.
  Sends are test-mode aware and atomically increment a per-response sent count.
- Add a new `banquet_responses` table and a dedicated
  `RESEND_EMAIL_FROM_BANQUET` email sender. Schema changes ship via
  `pnpm db:generate` / `pnpm db:migrate` (never hand-written SQL).

## Capabilities

### New Capabilities

- `banquet-survey`: The public per-year banquet RSVP form, its shared validation,
  submission + upsert persistence, auto-sent RSVP confirmation email, and the
  admin-editable banquet date/venue settings that drive its copy.
- `admin-forms`: The static admin forms registry page listing known forms and the
  Forms navigation entry that reaches it.
- `admin-banquet-responses`: The admin responses dashboard for the banquet survey,
  including search/filter/pagination and per-row + bulk "resend confirmation"
  actions with test-mode gating and sent-count tracking.

### Modified Capabilities

<!-- No existing spec-level capabilities are being modified; app_settings gains
     fields but there is no standalone settings spec to amend, so the new
     date/venue behavior is captured under the banquet-survey capability. -->

## Impact

- **Database**: new `banquet_responses` table (`year` index, unique `(year,
  email)`); two new nullable `app_settings` columns (`banquet_date`,
  `banquet_venue`). Additive migrations only.
- **Routes**: new public `app/[year]/(public)/banquet-survey`; new admin
  `app/admin/(protected)/forms` and `app/admin/(protected)/banquet-survey`.
- **Modules**: new `modules/landing/banquet-survey/*` and
  `modules/admin/banquet-survey/*`; extended `modules/admin/settings`.
- **Email**: new `lib/email/banquet-confirmation.templates.ts` +
  `banquet-confirmation.ts`; new `lib/routes/banquet-survey.ts`.
- **Navigation**: `AdminSidebar` and `AdminHeaderTitle` gain Forms / Banquet
  Survey entries.
- **Config**: new `RESEND_EMAIL_FROM_BANQUET` env var (`.env.example`).
- **Reuses**: Turnstile + honeypot, `getResendClient`, `getAppSettings` /
  `resolveCheckInRecipients` test mode, `getCurrentAdminSession`, and the
  `SearchInput` / `FilterSelect` / `TablePagination` admin primitives.
