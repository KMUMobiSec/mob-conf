## 1. Data model and migrations

- [x] 1.1 Create `db/schema/banquet-responses.ts` (`banquet_responses` table: `id` uuid pk, `year` int + index, `name` notNull, `affiliation` nullable, `email` notNull, `attending` boolean default false, `allergens` `jsonb<string[]>` default `[]`, `allergen_other` nullable, `message` nullable, `confirmation_sent_at` timestamptz nullable, `emails_sent_count` int default 0, shared `timestamps`; unique index on `(year, email)`; export `BanquetResponse`/`NewBanquetResponse`)
- [x] 1.2 Add `banquet_date` and `banquet_venue` nullable text columns to `db/schema/app-settings.ts`
- [x] 1.3 Add `export * from "./banquet-responses";` to `db/schema/index.ts` (alphabetical)
- [x] 1.4 Run `pnpm db:generate` then `pnpm db:migrate` (additive only; do not hand-edit generated SQL)

## 2. Settings extension (banquet date/venue)

- [x] 2.1 Extend `EffectiveAppSettings` + `getAppSettings()` in `modules/admin/settings/lib/queries.ts` to return `banquetDate`/`banquetVenue` (`string | null`)
- [x] 2.2 Extend `upsertAppSettings` patch and add `updateBanquetDetails({ date, venue })` guarded action in `modules/admin/settings/actions.ts` (revalidate `/admin/setup` and `/admin/banquet-survey`)
- [x] 2.3 Add a "Banquet details" section + editable date/venue form to `app/admin/(protected)/setup/page.tsx`
- [x] 2.4 Add `BANQUET_DATE_FALLBACK` / `BANQUET_VENUE_FALLBACK` defaults for use when settings are unset

## 3. Email and route helpers

- [x] 3.1 Create `lib/routes/banquet-survey.ts` (`banquetSurveyPath(year, email?)`, `banquetSurveyUrl(baseUrl, year, email?)` encoding `?email=`), modeled on `lib/routes/roll-of-honors.ts`
- [x] 3.2 Create `lib/email/banquet-confirmation.templates.ts` (pure `escapeHtml`ed html + text builders; `BanquetConfirmationEmailInput` incl. `year`, `name`, `attending`, `allergens`, `allergenOther`, `message`, `banquetDate`, `banquetVenue`; `banquetConfirmationSubject(year)`; emdash-free copy, `&middot;` footer)
- [x] 3.3 Create `lib/email/banquet-confirmation.ts` (`server-only`; `banquetFromAddress()` reads `RESEND_EMAIL_FROM_BANQUET`; `sendBanquetConfirmation(input & { to })` via `getResendClient`, throws on Resend error)
- [x] 3.4 Add `RESEND_EMAIL_FROM_BANQUET` to `.env.example`

## 4. Public banquet survey (landing module)

- [x] 4.1 Create `modules/landing/banquet-survey/lib/constants.ts` (allergen options `{ value, label }[]`, `AllergenId`, `isAllergenId`, length limits)
- [x] 4.2 Create `modules/landing/banquet-survey/lib/schema.ts` (isomorphic `BanquetValues`, `EMPTY_VALUES`, `EMAIL_RE`, `validateBanquet` shared by client + server)
- [x] 4.3 Create `modules/landing/banquet-survey/components/SuccessView.tsx` (recap card + emailed-to note)
- [x] 4.4 Create `modules/landing/banquet-survey/components/BanquetSurveyForm.tsx` (`"use client"`; email prefill+read-only from `initialEmail`; attendance Yes/No reveals allergen checklist + other + message; Turnstile + honeypot; shared validation; success view)
- [x] 4.5 Create `modules/landing/banquet-survey/components/BanquetSurveyPage.tsx` (server; reads `getAppSettings()` for date/venue; renders heading + form)
- [x] 4.6 Create `modules/landing/banquet-survey/actions.ts` (`submitBanquetSurvey(formData)`: honeypot → `verifyTurnstile` → year guard → read/validate → upsert on `(year, email)` → auto-send confirmation non-fatal, set count/timestamp on success)
- [x] 4.7 Create `app/[year]/(public)/banquet-survey/page.tsx` (validate year → `notFound()`; `generateMetadata` returns `{}` on invalid year; read `?email=` from `searchParams`; render page; no site-nav entry)

## 5. Admin logic

- [x] 5.1 Create `modules/admin/banquet-survey/lib/queries.ts` (`server-only`: `listBanquetResponses(filters)`, `getBanquetResponse(id)`, `listBanquetResponsesByIds(year, ids)`, `listAllBanquetResponses(year)`)
- [x] 5.2 Create `modules/admin/banquet-survey/lib/filters.ts` (`parseBanquetListParams()` → `{ year, q, attending, page }`)
- [x] 5.3 Create `modules/admin/banquet-survey/lib/selection.ts` (pure year-scoped selection helpers)
- [x] 5.4 Create `modules/admin/banquet-survey/actions.ts` (`resendBanquetConfirmation({ year, id })` wraps `sendBanquetConfirmations({ year, ids })`; `sendAllBanquetConfirmations({ year })` resolves ids server-side; auth guard; test-mode via `getAppSettings` + `resolveCheckInRecipients`; atomic `emails_sent_count + 1` + `confirmation_sent_at` outside test mode; `revalidatePath`; return `{ ok, sent, failures }`, never throw)

## 6. Admin UI

- [x] 6.1 Create `app/admin/(protected)/banquet-survey/BanquetResponsesTable.tsx` (`"use client"`; row checkboxes + select-all indeterminate; per-row Resend; Send to selected; Send to all behind `AlertDialog`; inline messages; `useTransition` + `router.refresh()`)
- [x] 6.2 Create `app/admin/(protected)/banquet-survey/page.tsx` (server list: `parseAdminYear`, filters, query, serialize timestamps to ISO; render `SearchInput` + `FilterSelect` + table + `TablePagination`)
- [x] 6.3 Create `app/admin/(protected)/forms/page.tsx` (static registry: Presentation Upload → `/admin/presentations`, Banquet Survey → `/admin/banquet-survey`)

## 7. Navigation wiring

- [x] 7.1 Add Forms nav entry (`FileText` icon, `/admin/forms`) + `formsActive` to `app/admin/(protected)/AdminSidebar.tsx`
- [x] 7.2 Add `/admin/forms` → "Forms" and `/admin/banquet-survey` → "Banquet Survey" to `SECTION_TITLES` in `app/admin/(protected)/AdminHeaderTitle.tsx`

## 8. Tests and verification

- [x] 8.1 Add `__tests__/banquet-survey/email-templates.test.ts` (subject contains year; HTML escapes injected input; attending/allergen branches render; no emdash in copy)
- [x] 8.2 Add a schema test mirroring `__tests__/nomination-form/schema.test.ts` (required fields, attendance-conditional validation)
- [x] 8.3 Run typecheck + build + `pnpm test`; fix any failures
- [ ] 8.4 Drive end-to-end: submit the public form (attending + not attending), confirm a row appears in the dashboard, resend a confirmation, and bulk send to selected
