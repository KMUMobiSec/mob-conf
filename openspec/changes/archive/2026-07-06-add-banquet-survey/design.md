## Context

The site already ships two public forms (nomination, presentation upload) and two
admin dashboards (nominations, QR check-ins) built on stable conventions:
per-year public routes under `app/[year]/(public)`, an isomorphic Zod schema
shared by client + server, `"use server"` actions, Turnstile + honeypot bot
protection, a Resend email layer split into pure templates + a `server-only`
sender, a singleton `app_settings` table read via `getAppSettings()`, and admin
list pages using `SearchInput` / `FilterSelect` / `TablePagination` with
client action buttons calling server actions. The full approved design lives at
`docs/superpowers/specs/2026-07-06-banquet-survey-design.md`.

This change adds a banquet RSVP survey and an admin surface to manage its
responses, reusing those conventions rather than introducing new patterns.

## Goals / Non-Goals

**Goals:**
- A public banquet RSVP form mirroring the existing public-form architecture,
  with link-param email prefill and attendance-conditional dietary fields.
- Durable per-attendee responses with idempotent re-submission (upsert on
  `(year, email)`) and an auto-sent, emdash-free confirmation email.
- An admin forms registry and a banquet responses dashboard with per-row and bulk
  "resend confirmation", test-mode aware and with sent-count tracking.
- Admin-editable banquet date/venue via `app_settings`.

**Non-Goals:**
- A generic/dynamic form builder. The registry is a static list of purpose-built
  forms.
- Per-response storage of banquet date/venue (they are per-year settings).
- CSV export of responses (can follow later, mirroring QR check-ins).
- Authenticated identity from the `?email=` param (it is convenience only).

## Decisions

**Purpose-built slice over a form engine.** The admin "form list" is a static
registry page, and the banquet survey has its own table, schema, and dashboard.
Rationale: a generic engine is a multi-week project; the requirement is one new
form. Alternative (dynamic schema + generic response table + field editor) was
rejected as disproportionate.

**`banquet_responses` table modeled on `registrations`.** Columns: `id`, `year`
(+ index), `name`, `affiliation` (nullable), `email` (notNull, normalized
lowercase), `attending` boolean, `allergens` `jsonb<string[]>` default `[]`,
`allergen_other` (nullable), `message` (nullable), `confirmation_sent_at`
(nullable), `emails_sent_count` (default 0), `created_at`/`updated_at`. Unique
index on `(year, email)`. Rationale: `allergens` as a jsonb string array matches
`app_settings.testerEmails`; no `pgEnum` or `text[]` exists in the repo. The
unique index turns re-RSVP into an upsert instead of a constraint error.
Alternatives (N boolean allergen columns, `text[]`, a child table) rejected as
heavier and off-convention.

**Idempotent submit via `onConflictDoUpdate` on `(year, email)`.** Re-submitting
updates the row and re-sends confirmation. Rationale: attendees will re-open the
emailed link and change answers; a duplicate row or 500 would be wrong.

**Auto-send confirmation, non-fatal.** The submit action inserts, then sends; on
send success it sets `confirmation_sent_at` and `emails_sent_count`. A send
failure is caught and logged so the submission still succeeds. Rationale: matches
user decision and avoids losing an RSVP to a transient email outage.

**Banquet date/venue in `app_settings`, not constants or the response row.** Two
nullable text columns, edited on Admin Setup, read via an extended
`getAppSettings()`, with app-level fallback constants when unset. Rationale: the
copy must be editable without a deploy; storing it per-response would duplicate a
per-year fact.

**Dedicated `RESEND_EMAIL_FROM_BANQUET` sender.** A new `server-only` sender +
pure templates, cloning the `registration-check-in` split. Rationale: keeps
banquet mail independently addressable and configurable; reusing an existing from
address was possible but less clean.

**Bulk send: sequential loop, server-resolved "all", `after()` for large blasts.**
Resend has no batch API. "Send to selected" and single resend run synchronously
and return `{ ok, sent, failures }`; "Send to all" resolves recipients on the
server and, for large sets, runs inside `after()` like `notifyWinners`. Rationale:
avoids trusting a client recipient list and avoids blocking the request on
hundreds of sends.

**Test mode reuses `checkInTestMode`.** Sends resolve recipients through the
existing `resolveCheckInRecipients`; while on, mail goes to testers and real
count/timestamp writes are skipped. Rationale: one global test-mode switch already
governs outbound mail; adding a second would confuse operators.

## Risks / Trade-offs

- **Prefilled `?email=` is user-controllable** → server validates format and
  lowercases; it is never treated as authenticated identity or authorization.
- **Resend rate limits on "Send to all"** → large blasts run in `after()` with
  per-recipient try/catch and logged failures; small selections stay synchronous.
- **`NEXT_PUBLIC_BASE_URL` inlined at build time** → email links/logo degrade to
  omitted (not broken) via `publicBaseUrl()` when unset; document the deploy env
  requirement.
- **Reusing `checkInTestMode` couples banquet mail to the check-in switch** →
  acceptable; documented so operators know one toggle governs all outbound mail.
- **Dates crossing the server/client boundary** → serialize every timestamp to
  ISO in the dashboard server page before handing rows to the client table.
- **Turnstile requires paired keys in production** → without the server secret all
  submits are rejected; with an empty site key the widget is skipped. Document
  both env vars.

## Migration Plan

1. Add `db/schema/banquet-responses.ts` and the two `app_settings` columns;
   re-export from `db/schema/index.ts`.
2. `pnpm db:generate` then `pnpm db:migrate` (additive `CREATE TABLE` + `ALTER
   TABLE ADD COLUMN`; never hand-edit generated SQL). No backfill, so a single
   generate/migrate pass is safe.
3. Ship shared/email layer, settings extension, landing module, admin logic, and
   admin UI in dependency order (see tasks.md).
4. Set `RESEND_EMAIL_FROM_BANQUET` (and confirm Turnstile + base-url env) in the
   deploy environment.

**Rollback:** the feature is additive. If needed, remove the routes/nav and stop
sending; the `banquet_responses` table and `app_settings` columns are inert when
unused and can be dropped in a later, separate destructive migration once no code
references them.

## Open Questions

None outstanding. Product decisions (registry scope, email prefill, confirmation
behavior, field layout, date/venue storage, re-submit resend, link-only
discoverability) are all resolved in the proposal and the approved design doc.
