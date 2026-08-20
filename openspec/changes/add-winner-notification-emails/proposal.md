## Why

Admins can mark nominations as winners, but there is no way to actually tell anyone. The committee needs to notify, in one action, every award winner and the person who nominated them — two clearly different emails per winner — without manually emailing people one by one or accidentally double-sending.

## What Changes

- Add a **"Notify winners"** action to the admin nominations table. It emails, via Resend, **two distinct messages per winner**:
  - a **warm congratulations** to the winner (the nominee), and
  - a **warm notification** to the **nominator** ("the person you nominated has won").
- The action targets **un-notified winners for the selected year** (the table's year filter). It is **idempotent**: each winner is notified once, tracked by a new `winner_notified_at` timestamp, so re-clicking only emails winners that haven't been notified yet.
- The trigger is a button (showing the pending count) with a **confirmation dialog** stating how many winners / emails will be sent.
- **Sending is a background, non-blocking process:** the action schedules the email work with Next.js `after()` and returns immediately (it never blocks the request on Resend), so the admin UI stays responsive while emails go out. The pending count reflects progress on refresh as winners are notified.
- A winner is marked notified only when **both** of its emails send successfully; partial failures are logged and remain pending for a retry.
- All of this is **admin-only** (the action re-verifies the admin session), and reuses the existing Resend client and the `RESEND_EMAIL_FROM_AWARDS` sender.
- Requires a DB migration for the `winner_notified_at` column (generated with `pnpm db:generate` + `pnpm db:migrate`).

## Capabilities

### New Capabilities

- `winner-notifications`: Notify award winners and their nominators by email from the admin nominations table — two distinct emails per winner, scoped to the selected year, sent once per winner with delivery tracking.

### Modified Capabilities

- None. This adds a control and an action to the existing admin nominations area without changing its current requirements.

## Impact

- **Database:** new nullable `winner_notified_at` (timestamptz) column on `nominations`; migration via `pnpm db:generate` / `pnpm db:migrate` (no hand-written SQL).
- **New email module:** `lib/email/winner-notification.ts` — `sendWinnerCongratulations` (to nominee) and `sendNominatorWinnerNotice` (to nominator), branded warm templates sent from `RESEND_EMAIL_FROM_AWARDS`.
- **New action + query:** `notifyWinners(year?)` and a pending-count helper in `modules/admin/nominations/`.
- **New UI:** a `NotifyWinnersButton` (confirm `AlertDialog` + result summary) on `/admin/nominations`.
- **Reuses:** the Resend client (`lib/email/resend.ts`), `getCurrentAdminSession`, the `nominations` table, and the existing branded email styling.
- **Out of scope:** scheduling/automatic sends, per-recipient template customization, attachments, reminders/follow-ups, non-winner emails, and editing email copy from the UI.
