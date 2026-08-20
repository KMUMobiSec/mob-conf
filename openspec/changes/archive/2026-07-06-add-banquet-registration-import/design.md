## Context

The banquet survey (change `add-banquet-survey`, archived) already provides a
public form, a `banquet_responses` table, an admin dashboard with confirmation
sends, and admin-editable banquet date/venue. This change extends it so admins can
seed invitees from the existing `registrations` table and send invitation emails
with prefilled survey links. Full approved design:
`docs/superpowers/specs/2026-07-06-banquet-registration-import-design.md`.

## Goals / Non-Goals

**Goals:**
- Import registrations (with email) as banquet invitees, deduped by email.
- A distinct banquet invitation email with a prefilled `?email=&name=` survey link.
- Distinguish invited from responded; surface it as a status column + filter.
- Accept `?name=` on the public form; stamp responded-at on submit.

**Non-Goals:**
- CSV import (registrations table is the source).
- Editing invitee rows, reminders, or drip campaigns.

## Decisions

**`responded_at` marker over a status enum.** A nullable `responded_at` timestamp
cleanly separates invited (null) from responded (set), needs no enum, and doubles
as a submission timestamp. Status is derived in queries/UI. Alternative (a `status`
enum column) was rejected as redundant with the attendance boolean and requiring
its own writes on every path.

**Separate invitation tracking columns.** `invitation_sent_at` /
`invitations_sent_count` keep invitation history independent from the confirmation
counters, so a person can be invited once and confirmed later without the two
conflating. Reuses the same `RESEND_EMAIL_FROM_BANQUET` sender address.

**Import from the registrations table, in a transaction, skip-existing.** Strict
dedupe by normalized email against existing banquet rows; registrations without an
email are skipped. No updates to existing rows, matching the "dedupe by email"
decision. Modeled on `importRegistrations` (transactional, count created/skipped).

**Invitation link requires a base URL.** The invitation is useless without an
absolute link, so `requirePublicBaseUrl()` is used; when unset it throws and is
reported as a per-recipient failure rather than sending a broken link.

**Confirmation sends scoped to responders.** With invitees now in the table,
`sendAllBanquetConfirmations` resolves ids from responded rows only, and per-row
Resend confirmation is offered only on responded rows, so confirmations never go
to people who have not RSVP'd.

**Name lock on presence, email lock on validity.** Email is the identity key
(unique per person) so it locks whenever the prefilled value is valid; name locks
only when a `?name=` param is present. This matches the product decision that
email is the source of truth while names can collide.

## Risks / Trade-offs

- **`responded_at` needs no backfill.** The banquet feature ships atomically:
  the table-creation migration (0011) and this column-add migration (0012) apply
  together on an empty table, so there are no pre-existing responses to mark
  responded. A backfill was rejected: it cannot distinguish a pre-existing
  response from an imported invitee (both have `responded_at IS NULL`), so running
  it after any import would wrongly flip invitees to responders. If the base
  feature is ever deployed separately and accrues real responses before 0012,
  mark those rows responded manually before enabling imports.
- **Base URL unset** -> invitation sends fail per-recipient with a clear message;
  import and the rest of the dashboard are unaffected.
- **Rate limits on "send to all invited"** -> sequential loop with per-id
  try/catch like the confirmation path; large blasts can use the `after()`
  pattern if needed.
- **Locked name from a stale registration** -> acceptable; email is the identity
  key and name lock only applies when the param is present.

## Migration Plan

1. Add `responded_at`, `invitation_sent_at`, `invitations_sent_count` to
   `db/schema/banquet-responses.ts`.
2. `pnpm db:generate` then `pnpm db:migrate` (additive `ADD COLUMN` x3; never
   hand-edit generated SQL). No backfill (see Risks): the table is empty when
   0011 and 0012 apply together.
3. Ship route helper, invitation email, landing `?name=` threading + responded-at
   stamp, admin import/invitation actions + queries, and dashboard UI.

**Rollback:** additive and behavior-scoped. Removing the import/invitation UI and
actions leaves the columns inert; they can be dropped later in a separate
destructive migration once unreferenced.

## Open Questions

None. Import source, invitation email, invited/responded modeling, prefill
locking, bulk-action layout, and re-import behavior are all resolved in the
proposal and approved design doc.
