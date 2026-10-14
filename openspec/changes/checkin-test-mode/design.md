## Context

The admin app (`app/admin/(protected)/`) has a sidebar (`AdminSidebar.tsx`, year-scoped nav via `buildAdminYearHref`), a route-derived header (`AdminHeaderTitle.tsx`), and server-component pages gated by `requireAdminSession()`. The QR check-in surface is `qr-check-ins/page.tsx` (URL-driven Registrations/Check-In tabs) rendering `RegistrationTable` (client) or `ScannerTab` (full-screen `createPortal` client). Check-in email is sent from server actions (`sendRegistrationQrPasses` → `sendRegistrationPass`; `checkInRegistration` → `sendCheckInWelcome`). There is **no** runtime settings store today — config is static (`@/constants/config`, per-year JSON, env vars). Design tokens live in `styles/globals.css` (Tailwind v4 `@theme`, no config file); there is no amber/warning token, but `ScannerTab` already hardcodes Tailwind `amber-400/500` for its warning result state. A Radix `Switch` primitive exists.

## Goals / Non-Goals

**Goals:** global admin-editable test mode + tester email list; identical email content with recipient redirected to testers (fallback `cyberchair.mobisec@gmail.com`); unmistakable amber test-mode framing on the check-in surface; a check-in-page toggle; test mode must not pollute real send tracking.

**Non-Goals:** per-year test mode; redirecting non-check-in emails (nominations/presentations); redirecting the realtime broadcast (no email recipient); changing email templates/content; a general settings framework beyond the two fields needed.

## Decisions

### 1. Single-row `app_settings` table (not key-value)
`db/schema/app-settings.ts` with the repo's conventions (local `timestamps` helper, `uuid` PK): `checkInTestMode boolean notNull default false`, `testerEmails jsonb $type<string[]> notNull default []`, and a `singleton boolean notNull default true` with `uniqueIndex("app_settings_singleton_idx")` to enforce one row. Re-export from `db/schema/index.ts`; migrate via `pnpm db:generate`/`db:migrate`. Strongly-typed fields + one `findFirst` read beat a key-value store's string casting. Writes use `insert().onConflictDoUpdate({ target: singleton, set })`.
- _Alternative:_ key-value `settings(key,value)` — rejected (untyped, N-row reads, casting).

### 2. Settings read on the server; client props are visual-only
`modules/admin/settings/lib/queries.ts` `getAppSettings()` returns effective settings (row or defaults). The check-in **actions** (`sendRegistrationQrPasses`, `checkInRegistration`) call `getAppSettings()` themselves — the recipient override is decided server-side and is **not** trusted from a client-passed flag. The `testMode` prop threaded to `ScannerTab`/`RegistrationTable` drives **visuals only**. This prevents a client from forcing production sends to a tester (or vice-versa).

### 3. Central recipient resolver (pure, testable)
`modules/admin/settings/lib/test-mode.ts`:
- `TEST_MODE_FALLBACK_EMAIL = "cyberchair.mobisec@gmail.com"`.
- `resolveCheckInRecipients({ testMode, testerEmails, intended }): string[] | null` — test mode → `testerEmails.length ? testerEmails : [FALLBACK]`; else → `intended ? [intended] : null` (null = "no email on file", skip/fail). This single function encodes the redirect, fallback, and null-email-bypass rules and is unit-testable without a DB.
- `normalizeTesterEmails(raw): { emails: string[]; invalid: string[] }` — trim/lowercase/dedupe, validate with the shared email regex.

### 4. Email lib accepts multiple recipients
`sendRegistrationPass` / `sendCheckInWelcome` change `to: string` → `to: string | string[]` (Resend supports arrays; templates don't use `to`, so content is untouched).

### 5. Test mode skips send-tracking writes
In `sendRegistrationQrPasses`, the `qrEmailSentAt`/`qrEmailSentCount` update runs only when NOT test mode. In `checkInRegistration`, the `welcomeEmailSentAt` update runs only when NOT test mode. The `checkedInAt` write and broadcast are unconditional. Rationale: those timestamps mean "the real attendee was notified," which is false under redirect — keeping them clean avoids misleading the admin table. (Confirmed 2026-07-03.)

### 6. Amber test-mode visual, reusing the existing warning convention
No semantic warning token exists; the scanner already uses raw `amber-*` for warnings, so test mode reuses raw amber for consistency (no new token churn):
- **Registrations tab:** wrap the tab content in a conditionally `ring-2 ring-amber-500/70 rounded-lg` container with a top amber banner.
- **Scanner portal:** conditional `ring-4 ring-inset ring-amber-500` on the portal root + a top banner strip (mirrors the existing `ring-1 ring-white/15` viewfinder pattern).
- **Banner:** amber bar, `TriangleAlert`/`FlaskConical` icon + "TEST MODE — check-in emails go to <recipients>" (icon+text, not color-only). Respects `prefers-reduced-motion` (no pulsing).
- **Toggle:** a `"use client"` `TestModeToggle` (Radix `Switch` + `Label`) in the tablist row; calls `setCheckInTestMode`, then `router.refresh()` so the server re-reads settings and re-frames.

### 7. Admin Setup page + nav
`app/admin/(protected)/setup/page.tsx` (server, `getAppSettings`) renders `TesterEmailsForm` (client; textarea of addresses, one per line; submit → `updateTesterEmails`). Add a sidebar item (new "System" group, `Settings` icon, plain `/admin/setup` href since it is global/not year-scoped) and a `/admin/setup → "Admin Setup"` entry in `AdminHeaderTitle`. Sends can also target null-email rows in test mode, so `RegistrationTable`'s Send button enables for null-email rows when `testMode` is on.

## Risks / Trade-offs

- **[Client spoofs test mode via prop]** → actions re-read settings server-side (Decision 2); prop is visual-only.
- **[Sending to a large tester list]** → Resend caps `to` at 50; tester lists are tiny. Acceptable; no batching.
- **[`onConflictDoUpdate` needs the unique target]** → the `singleton` unique index is the conflict target; without it upsert would insert duplicates. Covered by Decision 1.
- **[Admin forgets test mode is on]** → persistent amber frame + banner on every check-in view is the mitigation; that is the whole point of the visual treatment.
- **[Skipping send-tracking diverges from "everything else normal"]** → deliberate (Decision 5); flagged as an assumption for the user to veto.

## Migration Plan

1. Add `app-settings.ts` + barrel export, `pnpm db:generate` (expect one `CREATE TABLE app_settings` + unique index), review, `pnpm db:migrate`.
2. Ship settings module, action redirects, email-lib signature, UI.
3. No env changes required (fallback is a constant). Optionally seed the tester list via Admin Setup post-deploy.
- **Rollback:** code rollback is independent; the table can remain (unused) or be dropped via a follow-up migration.

## Open Questions

- **(Confirmed 2026-07-03)** Skip send-tracking writes in test mode (Decision 5) — yes, keep real rows clean.
- **(Assumed, not yet confirmed)** Global vs per-year, toggle on check-in page, emails-only redirect — per the earlier defaults.
