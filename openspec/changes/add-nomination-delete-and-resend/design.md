## Context

The admin nominations dashboard lists nominations, shows a detail page, toggles a `is_winner` flag, and has a background bulk "Notify winners" send (`notifyWinners`, via `after()`, idempotent on `winner_notified_at`). Documents live in a private Supabase `nominations` bucket with paths stored in the `documents` jsonb column; `storageService.deleteFiles({ bucket, paths })` and the winner email senders (`sendWinnerCongratulations`, `sendNominatorWinnerNotice`) already exist. Admin server actions re-verify the session with `getCurrentAdminSession`.

## Goals / Non-Goals

**Goals:**
- Delete a nomination (record + its stored files) behind a deliberate type-to-confirm gate.
- Re-send a single winner's two emails on demand, repeatably, with immediate success/failure feedback.
- Track and display how many emails each nomination has sent.

**Non-Goals:**
- Editing answers, bulk delete, undo/restore, delivery logs, or emailing non-winners.

## Decisions

### D1 — `emails_sent_count` column
Add `emailsSentCount: integer("emails_sent_count").notNull().default(0)` to `nominations` (migration via `pnpm db:generate`/`pnpm db:migrate`). Counts **individual emails** successfully sent for that nomination (a full winner+nominator send adds 2; each resend adds more). Shown as an "Emails sent" column.

### D2 — Increment on every successful send
Both send paths increment the counter **per successfully sent email** using a SQL expression (`emails_sent_count = emails_sent_count + n`) so concurrent updates don't clobber. The bulk `notifyWinners` background loop is refined to try each email independently: it counts each success, and still sets `winner_notified_at` only when **both** succeed (unchanged idempotency).

### D3 — Delete: storage first, then row
`deleteNomination(id)` re-verifies admin, loads the nomination, collects all document paths (`Object.values(documents).flat().map(d => d.path)`), calls `storageService.deleteFiles` (best-effort — a storage error is logged but does not block record removal, to avoid orphaned rows that can never be cleared), then deletes the DB row, and `revalidatePath`s the list. The client redirects to `/admin/nominations` on success.
- *Order rationale:* delete files first so a successful row delete isn't left with orphaned objects; if file deletion fails we still remove the row (the alternative — blocking — would strand the record).

### D4 — Type-to-confirm UX
A `DeleteNominationDialog` (client) renders a destructive button → `AlertDialog` containing an `Input`; the confirm button is disabled until the admin types exactly `confirm` (case-sensitive). On confirm it calls `deleteNomination(id)` in a transition and, on success, `router.push("/admin/nominations")`.

### D5 — Single resend: synchronous, repeatable
`resendWinnerEmails(id)` re-verifies admin, loads the nomination, and **awaits** both sends (it does not gate on `winner_notified_at`, so it can repeat). It returns a per-email result (`{ ok, sent, failures }`). It increments `emails_sent_count` by the number of emails that succeeded, and sets `winner_notified_at` if it was null and both succeeded. The detail-page `ResendWinnerButton` shows the result inline.
- *Why synchronous (vs the bulk `after()`):* a single resend is a deliberate one-off where the admin wants confirmation it worked; it is only two emails, so blocking briefly is acceptable and far more useful than a fire-and-forget "started".

### D6 — Authorization
`deleteNomination` and `resendWinnerEmails` both re-verify `getCurrentAdminSession()` before any storage/DB/email work (actions are not protected by layouts).

## Risks / Trade-offs

- **Irreversible deletion** → type-to-confirm gate + detail-page-only placement; deletion purges files too, so it can't be half-done.
- **Storage delete fails but row removed** (D3) → logged; leaves orphaned objects rather than an undeletable row. Acceptable; a future storage sweep could reconcile.
- **Resend duplicates emails** → intended ("repeated sending"); the email count makes repeats visible.
- **Counter drift on partial failure** → counter only increments for emails that actually succeeded, so it reflects real sends.
- **Resend latency** → two emails awaited; acceptable for a manual action; the button shows a pending state.

## Migration Plan

1. Add `emailsSentCount` to `db/schema/nominations.ts`.
2. `pnpm db:generate` then `pnpm db:migrate` (no manual SQL).
3. Ship the delete + resend actions, the dialog/button, the table column, and the `notifyWinners` counter update.
- **Rollback:** additive column + new actions/UI; revert files and drop the unused column. Existing flows are unchanged except `notifyWinners` also bumps the counter.

## Open Questions

- None blocking. Future: bulk delete, delivery/event logs, and a storage reconciliation job.
