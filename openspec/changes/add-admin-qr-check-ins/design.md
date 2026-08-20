## Context

The admin area is protected by Better Auth (`requireAdminSession()` in the protected layout) and currently centers on nominations. Nominations already carry a `year`, can send winner emails through Resend, and use an admin sidebar shell. Supabase is present for storage via a service-role client, but there is no browser realtime client yet. Conference registrations are currently external to the app, so check-in staff have no admin-owned source of attendee truth, QR pass delivery state, or shared realtime check-in status.

## Goals / Non-Goals

**Goals:**
- Add a year-scoped admin registration table for attendee identity, QR pass state, and check-in state.
- Support CSV import and manual registration creation with `email`, `name`, and optional `affiliation`.
- Generate a unique opaque QR credential for every registration and render QR pass emails on demand.
- Support single and bulk QR email sends with select-all / multi-select controls and visible send tracking.
- Add a scanner tab that verifies QR credentials, marks first-time check-ins, broadcasts realtime updates, and sends a welcome email for EBISION `<selected year>`.
- Add a sidebar year selector that scopes nominations/awards and QR check-in data to the selected year.

**Non-Goals:**
- Public self-registration, payment reconciliation, attendee profile editing, badge printing, seat/session-level attendance, external registration API sync, and replacing the public nomination form.

## Decisions

### D1 — Admin year context is URL-driven

The sidebar renders a year selector populated from `VALID_YEARS`, defaulting to `CURRENT_YEAR`. The selected year is represented as a `year` query parameter on year-scoped admin routes (`/admin/nominations?year=2026`, `/admin/qr-check-ins?year=2026&tab=registrations`) and navigation links preserve it. A shared parser (`parseAdminYear`) validates the query value and falls back to `CURRENT_YEAR`.

Nominations already have local year filtering; this change makes the selected sidebar year the primary year filter for nominations/awards instead of an optional "all years" default. Registration/check-in routes require a selected valid year for all reads and actions.
- *Alternative considered:* put the year in the path (`/admin/2026/...`). Rejected because the current admin area is intentionally year-independent and existing routes do not include a year segment.
- *Alternative considered:* store the selected year only in client state/cookies. Rejected because server components and server actions need explicit, shareable year context.

### D2 — Registration data model

Add a Drizzle table, tentatively `registrations`, with:
- `id` UUID primary key
- `year` integer, indexed
- `email` text, normalized lowercase
- `name` text
- `affiliation` text nullable
- `qrNonce` text unique, high entropy
- `qrEmailSentAt` timestamp nullable
- `qrEmailSentCount` integer default `0`
- `checkedInAt` timestamp nullable
- `checkedInBy` text nullable (admin email or user id)
- `welcomeEmailSentAt` timestamp nullable
- `createdAt` / `updatedAt`

Use a uniqueness constraint for one registration per normalized email per year. CSV import upserts by `(year, email)`: it updates name/affiliation for existing registrations while preserving QR, email, and check-in state. Manual creation rejects a duplicate with a clear message, because a single manual form submission should not silently alter an existing attendee.
- *Alternative considered:* separate registration and check-in tables. Rejected for the initial version; the workflow only needs one current check-in state per attendee.
- *Alternative considered:* allow multiple records with the same email in a year. Rejected because email is the primary contact identifier for pass delivery and duplicate check-ins would confuse staff.

### D3 — QR credential format

Do not put attendee email or name in the QR. Generate an opaque payload from registration id + `qrNonce` + an HMAC signature using a server-only `CHECK_IN_QR_SECRET`, for example `ebision-checkin:v1:<id>:<nonce>:<signature>`. The QR image can be regenerated for email or display without storing the raw full credential; verification recomputes the signature and confirms the id/nonce pair belongs to a registration for the selected year.

Use `qrcode` for server-side SVG or data-URL QR generation. The token remains bearer-style; anyone with the QR can check in that attendee, so scanner routes must still require admin auth.
- *Alternative considered:* store the full QR token in the database. Rejected to reduce impact if registration rows are exposed.
- *Alternative considered:* encode attendee email in the QR. Rejected because it leaks personal data and makes credentials guessable.

### D4 — CSV import and manual entry

`/admin/qr-check-ins` has a Registrations tab with a manual add dialog and CSV import flow. CSV accepts headers `email`, `name`, and optional `affiliation` (case-insensitive, trimmed). The server parses and validates rows with Zod plus a CSV parser (`csv-parse/sync` or equivalent), reports row-level errors, and applies valid rows in one transaction. The result reports created, updated, skipped, and invalid counts.
- *Alternative considered:* parse CSV in the browser. Rejected because server-side parsing keeps validation and persistence in one trusted path.

### D5 — Email send behavior

Add `lib/email/registration-pass.ts` and `lib/email/check-in-welcome.ts` using the existing Resend client and the visual language established by winner notification emails: dark EBISION header, neutral body, primary accent, and concise professional copy. QR pass emails include the attendee name, EBISION year, venue/date context from `YEAR_CONFIG`, and a button to `/registration-pass/[registrationId]`. The public pass page renders the signed QR code server-side. Successful QR sends increment `qrEmailSentCount` and set `qrEmailSentAt`; failed sends leave the registration pending and return per-recipient errors.

Bulk sending works from selected registration ids. The UI supports row checkboxes, select-all for the current filtered result, and clear selected. Already-sent rows can be selected for a deliberate resend, but the confirmation copy distinguishes first sends from resends.
- *Alternative considered:* send all unsent passes without explicit selection. Rejected because staff asked for manual and bulk control through checkboxes.
- *Alternative considered:* embed a data-URI QR image directly in the email. Rejected because common email clients block or strip inline data images, producing a broken QR image for attendees.

### D6 — Scanner and check-in flow

The Check In tab is a client scanner surface using `@zxing/browser` for broad QR camera support, with a manual paste fallback for camera failures. It calls a server action `checkInRegistration({ year, qrPayload })`.

The action re-verifies admin auth, validates the selected year, verifies the QR signature, loads the registration, and rejects year mismatches. If the attendee has not checked in, it sets `checkedInAt` and `checkedInBy`, schedules the welcome email using `after()`, revalidates the QR Check Ins route, and returns attendee details. If already checked in, it returns an "already checked in" state without sending another welcome email.
- *Alternative considered:* make the scanner page public so venue devices can use it quickly. Rejected because QR credentials are bearer credentials and check-in changes attendance state.

### D7 — Supabase realtime channel `check-ins`

Add a browser Supabase client for realtime subscriptions using public Supabase env vars. Registration table UI subscribes to channel `check-ins`; scanner success publishes or triggers a broadcast with `{ year, registrationId, checkedInAt }`. Subscribers ignore events for other years and refresh or patch the affected row. Server-side persistence remains the source of truth; realtime is only for low-latency UI synchronization.
- *Alternative considered:* poll the table every few seconds. Rejected because the user specifically requested a realtime Supabase channel and polling gives worse venue feedback.

### D8 — Authorization and audit boundaries

All registration queries and server actions re-check admin session independently of the layout. Every mutation accepts the selected year and refuses to mutate rows from a different year. Check-in success records the admin identifier in `checkedInBy` for accountability.

## Risks / Trade-offs

- **QR credential is a bearer token** → keep payload opaque, signed, and unrelated to attendee PII; require admin auth on scanner routes.
- **Bulk email can trigger rate limits** → send sequentially or with conservative concurrency in a background `after()` task, returning a scheduled count immediately.
- **CSV imports can contain bad data** → validate rows server-side, show row-level errors, and upsert only valid rows in a transaction.
- **Realtime events may be missed** → persist check-in state first and treat realtime as a UI hint; manual refresh remains correct.
- **Browser camera support varies** → use `@zxing/browser` and provide a manual QR payload field fallback.
- **Year leakage across admin sections** → centralize year parsing and require year checks in every query/action.

## Migration Plan

1. Add registration schema and generated Drizzle migration.
2. Add QR token helpers, CSV parser/validators, registration queries, and admin server actions.
3. Add QR pass and welcome email templates/senders.
4. Add admin year selector and update nominations/awards queries to default to the selected sidebar year.
5. Add QR Check Ins route, registration table/import/manual flows, bulk email controls, scanner tab, and realtime subscription.
6. Verify with unit tests, admin action tests where practical, typecheck, lint/check, and an authenticated manual smoke test with Supabase realtime and Resend configured.

Rollback is additive: remove the route/nav, stop using the new email helpers/actions, and drop the registrations table migration if no production registration data must be retained.

## Open Questions

- The import format is assumed to be exactly `email`, `name`, and optional `affiliation`; additional CSV columns will be ignored.
- The first implementation assumes one check-in per registration per year. Multi-day or per-session attendance would be a separate capability.
