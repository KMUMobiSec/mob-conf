## 1. Database — notification tracking

- [x] 1.1 Add `winnerNotifiedAt: timestamp("winner_notified_at", { withTimezone: true })` (nullable) to the `nominations` table in `db/schema/nominations.ts`
- [x] 1.2 Run `pnpm db:generate` then `pnpm db:migrate` to add the column (never hand-write migration SQL)

## 2. Email templates (Resend)

- [x] 2.1 Create `lib/email/winner-notification.ts` — `sendWinnerCongratulations({ to, year, awardName, nomineeName })`: warm, branded congratulations to the nominee, sent from `RESEND_EMAIL_FROM_AWARDS` (throws on Resend error)
- [x] 2.2 Add `sendNominatorWinnerNotice({ to, year, awardName, nominatorName, nomineeName })` — warm, branded notification to the nominator (distinct subject + copy), same sender
- [x] 2.3 Reuse the existing escaped-HTML + forest-green styling pattern from `nomination-confirmation.ts`

## 3. Query + action

- [x] 3.1 Add `listPendingWinners(year?)` to `modules/admin/nominations/lib/queries.ts` — winners (`isWinner = true`) with `winnerNotifiedAt IS NULL`, filtered by year when provided
- [x] 3.2 Add `notifyWinners(year?)` to `modules/admin/nominations/actions.ts` (`"use server"`) — re-verify admin session; snapshot the pending winners; schedule the work with `after()` (from `next/server`) and return `{ ok, scheduled }` immediately (non-blocking). Inside the `after()` callback: for each pending winner send both emails sequentially, set `winnerNotifiedAt = new Date()` only when both succeed, log per-winner failures, and `revalidatePath("/admin/nominations")` when the batch finishes

## 4. UI — Notify winners control

- [x] 4.1 Create `app/admin/(protected)/nominations/NotifyWinnersButton.tsx` (client) — button showing the pending count, an `AlertDialog` confirming "Send 2 × N emails to N winners and their nominators for <year>?", calls `notifyWinners(year)` in a transition; on success shows "Sending started for N winners — runs in the background" and calls `router.refresh()`; disabled when the pending count is 0
- [x] 4.2 Render `NotifyWinnersButton` in the nominations list header, passing the current `year` filter and the pending-winner count (computed server-side via `listPendingWinners`)

## 5. Verification

- [x] 5.1 `pnpm typecheck` and `pnpm check` (Biome) pass for all new/changed files; production build compiles
- [x] 5.2 Add unit tests for the notify summary/idempotency logic that can be tested without a live DB/Resend (e.g., the "mark notified only when both succeed" decision and pending-filter shaping)
- [ ] 5.3 Manual verify (REMAINING — needs admin login + winners + verified Resend domain): mark winners, see the pending count, confirm dialog shows the right count, both emails arrive with distinct copy, winners are not re-notified on a second run, partial failures remain pending
- [x] 5.4 Run `openspec validate "add-winner-notification-emails"` and confirm the change is apply-ready
