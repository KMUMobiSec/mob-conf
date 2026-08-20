## 1. Database — email count

- [x] 1.1 Add `emailsSentCount: integer("emails_sent_count").notNull().default(0)` to the `nominations` table in `db/schema/nominations.ts`
- [x] 1.2 Run `pnpm db:generate` then `pnpm db:migrate` to add the column (never hand-write migration SQL)

## 2. Server actions

- [x] 2.1 Add `deleteNomination(id)` to `modules/admin/nominations/actions.ts` (`"use server"`) — re-verify admin; load the nomination; collect all document paths and call `storageService.deleteFiles` (best-effort, log on failure); delete the DB row; `revalidatePath("/admin/nominations")`; return `{ ok, error? }`
- [x] 2.2 Add `resendWinnerEmails(id)` — re-verify admin; load the nomination; await `sendWinnerCongratulations` + `sendNominatorWinnerNotice` (try each independently); increment `emails_sent_count` by the number that succeeded (SQL `+ n`); set `winner_notified_at` if null and both succeeded; `revalidatePath`; return `{ ok, sent, failures }`
- [x] 2.3 Update `notifyWinners` background loop to try each email independently and increment `emails_sent_count` per successful email (still set `winner_notified_at` only when both succeed)

## 3. UI

- [x] 3.1 Create `app/admin/(protected)/nominations/DeleteNominationDialog.tsx` (client) — destructive button → `AlertDialog` with an `Input`; confirm disabled until the admin types exactly `confirm`; calls `deleteNomination(id)` in a transition; on success `router.push("/admin/nominations")`
- [x] 3.2 Create `app/admin/(protected)/nominations/ResendWinnerButton.tsx` (client) — button (shown for winner nominations) that calls `resendWinnerEmails(id)` and shows an inline result ("Sent 2 emails" / which failed); pending state while sending
- [x] 3.3 Add both controls to the nomination detail page (resend near the winner toggle; delete in a clearly-destructive footer/section)
- [x] 3.4 Add an "Emails sent" column to the nominations list table showing `emailsSentCount`

## 4. Verification

- [x] 4.1 `pnpm typecheck` and `pnpm check` (Biome) pass for all new/changed files; production build compiles
- [x] 4.2 Add unit tests for the pure pieces (e.g., document-path collection for deletion, and the "type exactly confirm to enable" predicate)
- [ ] 4.3 Manual verify: typing `confirm` enables delete; deleting removes the row and its files from storage and returns to the list; resend sends both emails and shows the result and can be repeated; the email count shows in the table and increases after sends; non-admin is rejected
- [x] 4.4 Run `openspec validate "add-nomination-delete-and-resend"` and confirm the change is apply-ready
