## Context

The admin nominations dashboard lists nominations and lets admins toggle a boolean `is_winner`. Document confirmation emails already go out from the public form via a Resend client (`lib/email/resend.ts`) and a branded HTML template (`lib/email/nomination-confirmation.ts`), sent from `RESEND_EMAIL_FROM_AWARDS`. Admin server actions in `modules/admin/nominations/actions.ts` re-verify the session with `getCurrentAdminSession`. There is currently no way to email winners; nothing tracks whether a winner has been told.

## Goals / Non-Goals

**Goals:**
- One admin action that emails every un-notified winner and their nominator — two distinct, warm emails per winner — via Resend.
- Idempotent: never double-send; re-clicking only handles newly-marked winners.
- Scoped to the year the admin is viewing, with a confirmation step and a clear result summary.

**Non-Goals:**
- Scheduling/automation, reminders, follow-ups, attachments, editable copy in the UI, or emails to non-winners.

## Decisions

### D1 — Track notification with a timestamp column
Add `winnerNotifiedAt: timestamp("winner_notified_at", { withTimezone: true })` (nullable) to `nominations`; generate via `pnpm db:generate` then `pnpm db:migrate`. A null value means "winner not yet notified". This drives idempotency and the pending count.
- *Alternative considered:* a separate `winner_notifications` table. Rejected — over-engineered for one notification event per nomination.

### D2 — Scope: un-notified winners for the selected year
`notifyWinners(year?)` selects `nominations` where `isWinner = true AND winnerNotifiedAt IS NULL`, additionally filtered by `year` when the table's year filter is set (when it's "All years", `year` is undefined and all un-notified winners are targeted). The list page passes its current parsed `year`, and renders the pending count next to the button.

### D3 — Two distinct warm templates, one sender
`lib/email/winner-notification.ts` exposes `sendWinnerCongratulations` (to the nominee) and `sendNominatorWinnerNotice` (to the nominator). Both reuse the branded forest-green HTML style and send from `RESEND_EMAIL_FROM_AWARDS`, but the copy and subject differ: the winner is congratulated directly; the nominator is told their nominee won and thanked. Award name + year + names are interpolated (HTML-escaped).

### D4 — Idempotency & partial failure
For each targeted winner the background task sends the winner email, then the nominator email. It sets `winnerNotifiedAt = now()` **only if both succeed**. If either fails, the nomination stays un-notified and the failure is logged, so a later run retries it (it is still counted as pending).
- *Trade-off:* a retry after a partial failure re-sends the half that already succeeded. Winner counts are small and this edge is rare, so we accept it rather than tracking two per-email timestamps. (Documented; revisit if volumes grow.)

### D5 — Trigger: button + confirmation; background, non-blocking send
A client `NotifyWinnersButton` on the list header shows the pending count and opens an `AlertDialog` ("Send 2 × N emails to N winners and their nominators for <year>?"). On confirm it calls `notifyWinners(year)` inside a transition. The action validates the admin session, snapshots the pending winners, **schedules the sends with Next.js `after()`, and returns immediately** with `{ scheduled: N }` — it never blocks the request on Resend. The button then shows "Sending started for N winners — runs in the background" and calls `router.refresh()`; as the background task sets `winnerNotifiedAt`, the pending count drops on subsequent refreshes. Inside the `after()` callback sends run sequentially (low volume; avoids Resend rate limits).
- *Alternative considered:* awaiting all sends in the action. Rejected — blocks the admin UI and risks request timeouts for many winners. *Alternative:* a durable queue/worker. Rejected as over-engineered for conference volumes; `after()` already guarantees post-response execution.

### D6 — Authorization
`notifyWinners` re-verifies `getCurrentAdminSession()` before scheduling any work (actions are not protected by layouts). The pending-count query runs server-side in the protected page.

### D7 — Why `after()` (not fire-and-forget)
`after()` (stable in Next 15+/16, from `next/server`) guarantees the scheduled callback runs after the response is flushed — even on serverless — so background sends are not cut off when the action returns. A bare un-awaited promise could be terminated mid-flight; on a long-running Node server it would also leak an unhandled async task. The snapshot of pending winners is captured before scheduling so the callback has the data it needs without re-querying at an unknown later time.

## Risks / Trade-offs

- **Duplicate on partial-failure retry** (D4) → accepted for low volume; documented. Mitigation path: per-email timestamps if needed later.
- **Resend rate limits / transient failures** → sequential sends + per-recipient try/catch; failures are reported and remain pending for retry.
- **Sending to the wrong people** → only `isWinner` rows are targeted, scoped by year, behind a confirmation dialog showing the exact count.
- **Sender domain not verified** → emails fail; surfaced in the result summary; `RESEND_EMAIL_FROM_AWARDS` domain must be verified in Resend.
- **Long-running action for many winners** → sending is moved off the request via `after()`, so the action itself is fast; the background task tolerates conference-scale volumes. A durable queue is the path if volumes ever grow large.
- **Background work cut off after response** → use `after()` (guaranteed post-response execution) rather than an un-awaited promise; on serverless this keeps the function alive until the callback finishes.
- **No synchronous per-recipient result** (sending is async) → the UI reports how many were *scheduled*; outcomes are reflected by the pending count dropping on refresh, and failures are logged server-side and remain pending for a retry.

## Migration Plan

1. Add `winnerNotifiedAt` to `db/schema/nominations.ts`.
2. `pnpm db:generate` then `pnpm db:migrate` (no manual SQL).
3. Ship the email templates, action, and button.
- **Rollback:** additive — remove the button/action/templates and drop the unused `winner_notified_at` column; existing winner toggling and the public form are untouched.

## Open Questions

- None blocking. Future: a "resend to a specific winner" control, reminder emails, and editable copy.
