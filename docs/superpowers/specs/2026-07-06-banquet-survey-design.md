# Banquet Survey — Design

Date: 2026-07-06
Status: Approved for OpenSpec proposal

## Summary

Add a public **Banquet Survey** RSVP form and an admin **Forms** area to manage
its responses. The survey asks attendees whether they will attend the banquet
(date + venue are admin-editable), collects dietary/allergen info and an
optional message, and emails an RSVP confirmation. Admins get a static forms
registry, a per-form responses dashboard, and per-row / bulk "resend
confirmation" actions.

This is a purpose-built feature that reuses existing conventions
(`nominations`, `qr-check-ins`, `presentation-form`). It is **not** a generic
form builder.

## Locked product decisions

1. **Admin forms registry** at `/admin/forms`: static index listing known forms
   as cards — *Presentation Upload* → existing `/admin/presentations`, *Banquet
   Survey* → new `/admin/banquet-survey`. New **Forms** sidebar entry.
2. **Public form** at `/{year}/banquet-survey`. Fields: `name`, `affiliation`,
   `email` always shown. Email is **prefilled + read-only** from a `?email=`
   link param; editable when opened cold. `Are you attending the banquet on
   {date} at {venue}?` Yes/No. **Yes** reveals an allergen checklist (nuts,
   shellfish, dairy, gluten, vegetarian, vegan) + an "other" free-text field + a
   "message for us" textarea. **No** submits with those empty.
3. **On submit**: store the response and **auto-send** an RSVP confirmation email
   (`emailsSentCount = 1`, `confirmationSentAt = now`). The send is non-fatal
   (submission still succeeds if Resend fails).
4. **Re-submit** (same year + email) **upserts** the row and **re-sends** the
   confirmation, bumping the count.
5. **Dashboard** at `/admin/banquet-survey`: responses per person/email with
   attending status, allergens, and message. **Per-row**: Resend confirmation.
   **Bulk**: checkbox multi-select + "Send to selected" + "Send to all"
   (recipients are responders; the "all" set is resolved server-side).
6. **Banquet date + venue** are **admin-editable** `app_settings` fields, edited
   on the Admin Setup page. They feed both the form heading and the email copy.
7. **All email copy avoids emdashes** (use periods, commas, `&middot;`). The `—`
   glyph is reserved as the admin null-placeholder only.

## Data model

### New table `banquet_responses`

Modeled on `db/schema/registrations.ts`. `db/schema/index.ts` re-exports it.

| column                 | type                          | notes                                     |
|------------------------|-------------------------------|-------------------------------------------|
| `id`                   | uuid pk defaultRandom         |                                           |
| `year`                 | integer notNull               | from `/[year]` route; has index           |
| `name`                 | text notNull                  |                                           |
| `affiliation`          | text (nullable)               |                                           |
| `email`                | text notNull                  | normalized lowercase in app code          |
| `attending`            | boolean notNull default false |                                           |
| `allergens`            | `jsonb<string[]>` notNull default `[]` | allergen ids; matches `testerEmails` idiom |
| `allergen_other`       | text (nullable)               | free text                                 |
| `message`              | text (nullable)               |                                           |
| `confirmation_sent_at` | timestamptz (nullable)        | last successful confirmation send         |
| `emails_sent_count`    | integer notNull default 0     | incremented per successful send           |
| `created_at`/`updated_at` | timestamptz (shared `timestamps`) |                                 |

Indexes: `banquet_responses_year_idx` on `(year)`,
`banquet_responses_year_email_idx` **unique** on `(year, email)`. The unique
index makes re-RSVP an upsert (`onConflictDoUpdate` on `[year, email]`) instead
of a constraint 500.

`allergens` stores an array of ids (not `text[]`, not N boolean columns, not
`pgEnum` — none exist in this repo), matching `app_settings.testerEmails`.

### `app_settings` additions (banquet date + venue)

Add two nullable columns to the existing singleton table:

- `banquet_date` text (nullable) — free-text label, e.g. "July 9".
- `banquet_venue` text (nullable) — e.g. "the Plaza Hotel".

`EffectiveAppSettings` / `getAppSettings()` return `banquetDate: string | null`
and `banquetVenue: string | null`. Form heading and email fall back to module
constants (`BANQUET_DATE_FALLBACK`, `BANQUET_VENUE_FALLBACK`) when unset. A new
guarded action `updateBanquetDetails({ date, venue })` upserts them (extend the
existing `upsertAppSettings` patch) and revalidates `/admin/setup` +
`/admin/banquet-survey`.

### Migrations

`pnpm db:generate` then `pnpm db:migrate`. Two additive migrations:
`CREATE TABLE banquet_responses` (+ indexes) and `ALTER TABLE app_settings ADD
COLUMN` (x2). Both additive, no backfill/drop hazard. Never hand-write migration
SQL.

## Public form

### Routing / boundaries

```
app/[year]/(public)/banquet-survey/page.tsx      (server; validates year, reads ?email=)
  └─ modules/landing/banquet-survey/components/BanquetSurveyPage.tsx   (server)
       └─ BanquetSurveyForm.tsx                                        ("use client")
            └─ SuccessView.tsx                                          ("use client")
```

- Route page: `PageProps` has `params` + `searchParams: Promise<{ email?: string }>`.
  Invalid year → `notFound()`; `generateMetadata` returns `{}` on invalid year.
- Page component fetches `getAppSettings()` for date/venue and passes
  `year`, `initialEmail`, `banquetDate`, `banquetVenue` down.
- `BanquetSurveyForm`: `emailLocked = Boolean(initialEmail)`; email input
  `readOnly={emailLocked}`. `reset()` re-applies `initialEmail`. `Attending`
  Yes/No via `RadioGroup`; when `"yes"`, reveal allergen `Checkbox` group bound
  to `allergens: string[]`, `allergenOther` `Input`, `message` `Textarea`.
- Turnstile: `TurnstileWidget` (`components/security/turnstile-widget.tsx`) gated
  on `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; honeypot `company` field; submit disabled
  until token present.

### Shared validation

`modules/landing/banquet-survey/lib/schema.ts` — isomorphic Zod (no directive),
imported by both the client form and the server action.

- `BanquetValues { name, affiliation, email, attending: "" | "yes" | "no",
  allergens: string[], allergenOther, message }`, `EMPTY_VALUES`, `EMAIL_RE`.
- `validateBanquet(values)`: name required; email required + format; attending
  must be "yes"|"no". Allergen `other`/message length checks only when attending.
- `constants.ts`: allergen option list `{ value, label }[]`, `AllergenId` union,
  `isAllergenId` guard, message/other max-length limits.

### Server action

`modules/landing/banquet-survey/actions.ts` — `"use server"`
`submitBanquetSurvey(formData)`:

1. honeypot check → 2. `verifyTurnstile` → 3. year guard vs `VALID_YEARS` →
4. read values (`allergens` sent as JSON string; other/message forced empty when
   not attending) → 5. `validateBanquet` (same schema) → 6. upsert
   (`onConflictDoUpdate` on `[year, email]`, email lowercased) → 7. **auto-send**
   `sendBanquetConfirmation`; on success set `emailsSentCount = 1`,
   `confirmationSentAt = now` (non-fatal try/catch). Returns
   `{ ok, errors?, message? }`.

On `ok`, the form renders `SuccessView` (recap card: attending status, allergens,
message, "a confirmation has been emailed to {email}").

## Admin

### `/admin/forms` registry

Server component; two `Card`s linking to `/admin/presentations` and
`/admin/banquet-survey`. New sidebar nav item
`{ key: "forms", label: "Forms", icon: FileText, href: "/admin/forms" }` in
`AdminSidebar.tsx`; matching `SECTION_TITLES` rows in `AdminHeaderTitle.tsx`
(`/admin/forms` → "Forms", `/admin/banquet-survey` → "Banquet Survey").

### `/admin/banquet-survey` dashboard

Server-list page (model `qr-check-ins/page.tsx`): `await searchParams`,
`parseAdminYear`, parse `q` + `attending` filters, query, serialize timestamps to
ISO, render `SearchInput` (name/email/affiliation) + `FilterSelect` (attending
All/Yes/No) + `BanquetResponsesTable` + `TablePagination`.

Columns: name · email · affiliation · attending badge · allergens (or `—`) ·
message (truncated) · emails-sent count · confirmation-sent-at (or `—`) · row
checkbox · Resend.

`modules/admin/banquet-survey/lib/`:
- `queries.ts` (`server-only`): `listBanquetResponses(filters)`,
  `getBanquetResponse(id)`, `listBanquetResponsesByIds(year, ids)`,
  `listAllBanquetResponses(year)`.
- `filters.ts`: `parseBanquetListParams()` → `{ year, q, attending, page }`.
- `selection.ts`: pure selection helpers (year-scoped).

### Admin actions

`modules/admin/banquet-survey/actions.ts` — `"use server"`, guard on
`getCurrentAdminSession`:

```
interface SendBanquetResult extends AdminActionResult { sent: number; failures: {id,email,error}[] }
resendBanquetConfirmation({ year, id })      => sendBanquetConfirmations({ year, ids:[id] })
sendBanquetConfirmations({ year, ids })      // "Send to selected"
sendAllBanquetConfirmations({ year })        => resolves ids server-side, then sendBanquetConfirmations
```

Bulk body models `sendRegistrationQrPasses`: dedupe ids, one
`listBanquetResponsesByIds` query into a `Map`, sequential loop with per-id
try/catch, `revalidatePath("/admin/banquet-survey")`, return
`{ ok: failures.length === 0, sent, failures }` — never throws to client. After
each successful send, atomic `emails_sent_count + 1` + `confirmation_sent_at =
now`.

**Test mode**: read `getAppSettings()`; resolve recipients via
`resolveCheckInRecipients({ testMode: checkInTestMode, testerEmails, intended:
row.email })`. When test mode is on, still send (to testers) but **skip** the
count/timestamp DB writes so real tracking stays clean. The client `testMode`
prop is display-only. "Send to all" is confirmed behind an `AlertDialog`.

Feedback: inline `<span>` messages (no toast lib) — muted for success,
`text-destructive` for error; `useTransition` + `router.refresh()`.

## Email (emdash-free)

- `lib/email/banquet-confirmation.templates.ts` — **pure** builders (no
  `server-only`, no Resend). `escapeHtml` (from `winner-notification.templates`)
  on all user input. Exports `BanquetConfirmationEmailInput` (carries `year`,
  `name`, `attending`, `allergens`, `allergenOther`, `message`, plus
  `banquetDate` + `banquetVenue` for the copy), `banquetConfirmationSubject(year)`,
  `renderBanquetConfirmationHtml`, `renderBanquetConfirmationText`. Table-based
  inline-styled HTML matching `registration-check-in.templates`.
- `lib/email/banquet-confirmation.ts` — `"server-only"` sender.
  `banquetFromAddress()` reads `RESEND_EMAIL_FROM_BANQUET` (throws if unset);
  `sendBanquetConfirmation(input & { to })` via `getResendClient().emails.send`;
  throws on Resend error.
- Subject: `Your MOBISEC {year} banquet RSVP has been received`.
- Body (sample, no emdashes): "Dear {name}, Thank you. Your response for the
  MOBISEC {year} banquet on {date} at {venue} has been recorded. We look forward
  to seeing you there. If your plans change, reply to this email and we will
  update your RSVP." Footer: `MOBISEC {year} &middot; KIISC International
  Conference`.
- Absolute links via `publicBaseUrl()` / `requirePublicBaseUrl()`
  (`lib/routes/base-url.ts`) — degrade gracefully when `NEXT_PUBLIC_BASE_URL`
  unset. New `lib/routes/banquet-survey.ts` (`banquetSurveyPath/Url`) builds the
  `?email=` link (model `lib/routes/roll-of-honors.ts`).
- No Resend batch API: bulk = sequential loop collecting `failures[]`. Large
  "Send to all" blasts use the `after()` background pattern like `notifyWinners`.
- New env var `RESEND_EMAIL_FROM_BANQUET` added to `.env.example`.

## Error handling & edge cases

- **Re-RSVP**: `onConflictDoUpdate` on `[year, email]`; resend + bump count.
- **Prefilled `?email=`**: convenience only, not auth. Server validates format +
  lowercases; never trusts it as identity.
- **Dates to client**: serialize all timestamps to ISO in the server page.
- **Base URL**: inlined at build; email links/logo omit (not break) when unset.
- **Turnstile**: needs client site-key + server secret paired in production.
- **Year**: layout guards, route page re-validates (`notFound()`), action
  re-validates from FormData.

## Testing

- Unit test `__tests__/banquet-survey/email-templates.test.ts`: subject contains
  year, HTML escapes injected input, attending/allergen branches render.
- (Optional) schema test mirroring `__tests__/nomination-form/schema.test.ts`.
- `pnpm` typecheck + build; then drive the public form and admin dashboard
  end-to-end (submit → row appears → resend → bulk send).

## Build order (dependency-safe)

1. Schema: `banquet-responses.ts` + `app_settings` columns; barrel re-export.
2. `pnpm db:generate` → `pnpm db:migrate` (do not edit generated SQL).
3. Shared/email: `lib/routes/banquet-survey.ts`, email templates + sender,
   `.env.example`.
4. Settings: extend `EffectiveAppSettings`/`getAppSettings`, `upsertAppSettings`,
   `updateBanquetDetails`, Admin Setup section.
5. Landing module: constants → schema → SuccessView → form → page → action →
   route.
6. Admin logic: queries/filters/selection → actions.
7. Admin UI: dashboard page + table → `/admin/forms` → nav wiring.
8. Tests + verify.

## Out of scope (YAGNI)

- Generic/dynamic form builder.
- Storing banquet date/venue per-response (they are per-year settings).
- CSV export of responses (can be added later, mirrors qr-check-ins if needed).
