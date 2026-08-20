## Why

Admins can review nominations and notify winners, but they can't correct mistakes: there's no way to delete a nomination (e.g., spam or a duplicate), no way to re-send a winner's emails if the first send failed or needs repeating, and no visibility into how many emails a nomination has triggered. These are the day-to-day management gaps in the nominations dashboard.

## What Changes

- **Delete a nomination** from its detail page, behind a **type-to-confirm** dialog (the admin must type `confirm`). Deletion **removes the database record and all of the nomination's uploaded files from Supabase Storage**.
- **Single (re)send per winner:** a per-nomination action that sends the two winner emails (to the winner and their nominator) on demand, **repeatably** — it works even if the winner was already notified. This send is **synchronous** and reports its result ("Sent" / which email failed) immediately.
- **Email count in the table:** each nomination tracks **how many emails have been sent** for it; the count is shown as a column in the nominations table and increments on both the bulk "Notify winners" send and the single resend.
- Both new actions are **admin-only** (the action re-verifies the session). The single resend marks the winner as notified on first success and increments the email count per successfully sent email.
- Requires a DB migration for the `emails_sent_count` column (generated with `pnpm db:generate` + `pnpm db:migrate`).

## Capabilities

### New Capabilities

- `nomination-management`: Admin management actions on a nomination — type-to-confirm deletion that also purges stored files, on-demand repeatable single-winner email resend with immediate result, and an email-sent count surfaced in the table.

### Modified Capabilities

- None at the spec level. This adds new requirements under `nomination-management`; the existing bulk notify path is updated to also increment the new email count (implementation detail, not a requirement change).

## Impact

- **Database:** new `emails_sent_count` (integer, not null, default 0) column on `nominations`; migration via `pnpm db:generate` / `pnpm db:migrate` (no hand-written SQL).
- **New actions** in `modules/admin/nominations/actions.ts`: `deleteNomination(id)` (delete storage files via `storageService.deleteFiles`, then the row) and `resendWinnerEmails(id)` (synchronous send of both emails, increment count, mark notified).
- **Updated action:** `notifyWinners` increments `emails_sent_count` per successfully sent email.
- **New UI:** a `DeleteNominationDialog` (type-`confirm` `AlertDialog`) and a "Resend winner emails" control on the nomination detail page; an "Emails sent" column on the list table.
- **Reuses:** `storageService.deleteFiles`, the winner email senders (`lib/email/winner-notification.ts`), `getCurrentAdminSession`, and the `nominations` table.
- **Out of scope:** editing nomination answers, bulk delete, undo/restore, per-email delivery logs, and resending to non-winners.
