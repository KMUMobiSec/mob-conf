## Why

Admins need to rehearse the QR check-in flow — sending passes, scanning badges, triggering welcome emails — without spamming real attendees. Today every send goes to the attendee's real address, so there is no safe way to test end-to-end against real registration data. A "test mode" that redirects all check-in email to a configurable tester list (with a safe fallback) makes the flow rehearsable, and a distinct visual treatment makes it impossible to confuse test mode with production.

## What Changes

- New **Admin Setup** sidebar item + `/admin/setup` page holding a **tester email receiver** list (the addresses that receive redirected check-in mail).
- New global, admin-editable settings persisted in a new single-row `app_settings` table: a `checkInTestMode` boolean and a `testerEmails` string list.
- New **check-in test mode** toggle on the QR Check-Ins page. When ON:
  - The check-in surface (registrations tab **and** the full-screen scanner) gets a distinct amber "TEST MODE" frame + banner so it is unmistakably not production.
  - Every check-in email (QR pass initial send + resend via `sendRegistrationPass`, and the post-check-in welcome via `sendCheckInWelcome`) is sent with **identical content** but the recipient is replaced by the tester list. If the tester list is empty, it falls back to `cyberchair.mobisec@gmail.com`.
  - Because the recipient is fully overridden, a registration with no email on file **can** be sent to (the null-email guard is bypassed in test mode).
  - Real send-tracking is **not** polluted: `qrEmailSentAt` / `qrEmailSentCount` / `welcomeEmailSentAt` on the real registration are not updated in test mode. _(Confirmed 2026-07-03: keep real rows clean; there is no UI to undo a falsely-set "Sent" badge.)_
- Test mode is **global** and **only redirects email** — actual check-ins still persist normally (`checkedInAt` write + realtime broadcast are unchanged). The realtime broadcast has no email recipient, so it is not redirected. _(Assumptions from defaults chosen while you were away.)_
- Turning test mode OFF restores normal behavior (real recipients, normal tracking).

## Capabilities

### New Capabilities
- `admin-settings`: A runtime, admin-editable global settings store (single-row `app_settings`) — reading effective settings, editing the tester email list, and toggling check-in test mode.
- `qr-check-in-registrations` (extended): How check-in email recipients are resolved under test mode, and the test-mode visual treatment + toggle on the check-in surface.

### Modified Capabilities
<!-- qr-check-in-registrations exists only as a change-scoped spec (nullable-registration-email), not yet archived under openspec/specs/, so its test-mode requirements are ADDED here rather than as a delta. -->

## Impact

- **Schema / migration:** new `db/schema/app-settings.ts` (+ barrel export in `db/schema/index.ts`); generated Drizzle migration via `pnpm db:generate` / `pnpm db:migrate` (never hand-written).
- **New module:** `modules/admin/settings/` — `lib/queries.ts` (`getAppSettings`), `lib/test-mode.ts` (recipient resolution + email validation, pure/testable), `actions.ts` (`setCheckInTestMode`, `updateTesterEmails`).
- **Check-in actions:** `modules/admin/qr-check-ins/actions.ts` — `sendRegistrationQrPasses` and `checkInRegistration` resolve recipients via settings; test mode bypasses the null-email guard and skips send-tracking writes.
- **Email lib:** `lib/email/registration-check-in.ts` — `sendRegistrationPass` / `sendCheckInWelcome` accept `to: string | string[]`.
- **UI:** new `/admin/setup` page + `TesterEmailsForm`; new `TestModeToggle` + amber frame/banner on `qr-check-ins/page.tsx`, `ScannerTab.tsx`, `RegistrationTable.tsx`; `AdminSidebar.tsx` (new item), `AdminHeaderTitle.tsx` (new title).
- **Constant:** `cyberchair.mobisec@gmail.com` test-mode fallback recipient.
