## 1. Settings schema & migration

- [x] 1.1 Create `db/schema/app-settings.ts` (single-row `app_settings`: `checkInTestMode` boolean, `testerEmails` jsonb string[], `singleton` boolean + `uniqueIndex`, local `timestamps` helper, `$inferSelect`/`$inferInsert` exports)
- [x] 1.2 Re-export it from `db/schema/index.ts`
- [x] 1.3 `pnpm db:generate`, review SQL (expect one `CREATE TABLE app_settings` + unique index), then `pnpm db:migrate`

## 2. Settings module (`modules/admin/settings/`)

- [x] 2.1 `lib/queries.ts`: `getAppSettings()` (server-only) → effective `{ checkInTestMode, testerEmails }`, defaulting when no row
- [x] 2.2 `lib/test-mode.ts` (pure): `TEST_MODE_FALLBACK_EMAIL`, `resolveCheckInRecipients({testMode,testerEmails,intended})`, `normalizeTesterEmails(raw)` (trim/lowercase/dedupe/validate)
- [x] 2.3 `actions.ts` (use server, admin-gated): `setCheckInTestMode(enabled)` and `updateTesterEmails(emails)` — upsert the singleton via `onConflictDoUpdate`, `revalidatePath` for `/admin/qr-check-ins` and `/admin/setup`

## 3. Email lib

- [x] 3.1 `lib/email/registration-check-in.ts`: change `sendRegistrationPass` and `sendCheckInWelcome` `to` param to `string | string[]`

## 4. Check-in action redirects

- [x] 4.1 `sendRegistrationQrPasses`: load `getAppSettings()` once; per row resolve recipients; null recipients → "No email on file" failure (normal mode only); send to resolved recipients; update `qrEmailSentAt`/`qrEmailSentCount` only when NOT test mode
- [x] 4.2 `checkInRegistration`: load settings; resolve welcome recipients (test mode → tester list even for null email); send welcome only if recipients present; update `welcomeEmailSentAt` only when NOT test mode; leave `checkedInAt` write + broadcast unconditional
- [x] 4.3 `uncheckInRegistration({ year, id })` (use server, admin-gated): re-read settings and reject when NOT test mode; verify registration/year; clear `checkedInAt` + `checkedInBy`; `revalidatePath`

## 5. Admin Setup page + nav

- [x] 5.1 `app/admin/(protected)/setup/page.tsx` (server, `getAppSettings`) rendering the tester-emails editor
- [x] 5.2 `TesterEmailsForm` (client): textarea (one email per line), submit → `updateTesterEmails`, show validation errors + success
- [x] 5.3 `AdminSidebar.tsx`: add "Admin Setup" item (new group, `Settings` icon, `/admin/setup`), active on `pathname.startsWith("/admin/setup")`
- [x] 5.4 `AdminHeaderTitle.tsx`: add `/admin/setup → "Admin Setup"`

## 6. Check-in test-mode UI

- [x] 6.1 `TestModeToggle` (client): Radix `Switch` + `Label` bound to global test mode; calls `setCheckInTestMode`; `router.refresh()`
- [x] 6.2 `TestModeBanner` (shared amber banner: icon + "TEST MODE — emails go to <recipients>"), reused by both surfaces
- [x] 6.3 `qr-check-ins/page.tsx`: read `getAppSettings()`; place the toggle in the tablist row; wrap the registrations tab in the amber frame + banner when on; pass `testMode` (+ resolved recipients preview) to `ScannerTab` and `RegistrationTable`
- [x] 6.4 `ScannerTab.tsx`: accept `testMode` + recipients; render inset amber ring + top banner on the portal when on
- [x] 6.5 `RegistrationTable.tsx`: accept `testMode`; show a subtle test indicator; enable the per-row Send button for null-email rows when `testMode` is on; on checked-in rows when `testMode` is on, show an "Undo check-in" control calling `uncheckInRegistration`

## 7. Verify

- [x] 7.1 Typecheck (`pnpm typecheck`) + lint (`pnpm check`) clean; audit `registrations.email`/`to` consumers for the `string|string[]` change
- [x] 7.2 Unit-test `resolveCheckInRecipients` + `normalizeTesterEmails` (test-mode redirect, empty-list fallback, null-email bypass on/off, normalize/dedupe/invalid)
- [x] 7.3 DB check (throwaway): settings upsert stays single-row; `getAppSettings` defaults when empty
- [x] 7.4 Behavior check: with test mode ON, `sendRegistrationQrPasses` resolves recipients to tester/fallback and does not bump `qrEmailSentAt`; with OFF, normal recipient + tracking (assert via the resolver + action logic without hitting Resend)
