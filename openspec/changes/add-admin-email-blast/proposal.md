## Why

Organizers need to send one-off announcements (schedule changes, reminders, calls to action with links) to conference participants. Today every email is a fixed transactional template triggered by an event (QR pass, welcome, banquet RSVP) — there is no way for an admin to compose a free-form message and send it to a chosen set of registrants. Organizers end up exporting addresses and using an external tool, which is error-prone and off-brand.

## What Changes

- New **Email Blast** admin page (`/admin/email-blast`, in the Management nav) for composing and sending a one-off email to selected registrants.
- A **WYSIWYG (rich-text) editor** (Tiptap) with bold, italic, headings, bullet/numbered lists, undo/redo, and **hyperlink insert/edit/remove** (safe `http`/`https`/`mailto` only).
- A **recipient picker** over the selected year's registrations: select-all + per-row checkboxes + search; registrations without an email are shown but not selectable. The **Import registrations** action (the existing CSV import) is available here too, so organizers can bulk-add people and then blast them.
- Sending: the composed body is **sanitized** server-side and wrapped in the **EBISION branded email shell**, then sent from the **no-reply sender** (`RESEND_EMAIL_FROM_NOREPLY`) via Resend, one personalized recipient per message (the list is never exposed via a shared To/CC), batched. A **"Send test to me"** button sends the real email to the signed-in admin for preview.
- Result is reported as a **sent / failed / skipped** summary. **Nothing is persisted** (send-and-forget) — no history table this iteration.

## Capabilities

### New Capabilities
- `admin-email-blast`: compose a rich-text email, choose recipients from registrations (with CSV import), preview via a test send, and blast from the no-reply sender with server-side sanitization and branded framing.

## Impact

- **No schema / migration.** Recipients come from the existing `registrations` table; no new persistence.
- **New dependencies:** `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/pm` (client editor); `sanitize-html` + `@types/sanitize-html` (server-only sanitizer).
- **New email lib:** `lib/email/email-blast.ts` (send via Resend from `RESEND_EMAIL_FROM_NOREPLY`, batches of 100) + `lib/email/email-blast.templates.ts` (`renderEmailBlastHtml` branded shell reusing the existing header/footer + logo tokens).
- **New module:** `modules/admin/email-blast/` — `lib/queries.ts` (`listRegistrationRecipients`), `lib/sanitize.ts` (`sanitizeEmailHtml`), `lib/recipients.ts` (validate/normalize/dedupe selected addresses, pure), `actions.ts` (`sendEmailBlast`, `sendTestEmailBlast`, admin-gated).
- **New UI:** `app/admin/(protected)/email-blast/` — `page.tsx`, `EmailBlastComposer.tsx`, `RichTextEditor.tsx`, `RecipientPicker.tsx`; reuses `CsvImportDialog`. Nav: `AdminSidebar.tsx` (new "Email Blast" item), `AdminHeaderTitle.tsx` (new title).
- **Security:** admin-gated route + actions; sender is a fixed env value (never client-controlled); recipients are re-resolved server-side by registration id (client-sent emails are not trusted); HTML is sanitized to an allowlist before sending.
