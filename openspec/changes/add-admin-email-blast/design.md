# Design notes

## Trust boundary

An email blast is a high-blast-radius capability, so the server never trusts the client for anything that matters:
- **Sender** is a fixed env value (`RESEND_EMAIL_FROM_NOREPLY`) — never sent from or chosen by the client.
- **Recipients** are sent as registration **ids**; the action re-loads those rows for the year and reads the emails from the database. A client cannot inject an arbitrary To address by editing the payload.
- **Body HTML** is sanitized server-side to a fixed allowlist before it is ever wrapped or sent — the client-side editor's output is treated as untrusted. Sanitization is the security boundary; the WYSIWYG is only a convenience for producing it.
- The page and both actions are admin-gated (`getCurrentAdminSession`).

## Sanitization

`sanitizeEmailHtml` uses `sanitize-html` with an allowlist that matches exactly what the Tiptap toolbar can produce (`p, br, strong/b, em/i, u, s, h1–h3, ul, ol, li, a, blockquote, code, pre, hr`). It:
- allows `href` only for `http`, `https`, and `mailto`, dropping `javascript:`/`data:` and other schemes;
- forces `target="_blank"` and `rel="noopener noreferrer nofollow"` on every link;
- strips `<script>`, `<style>`, event handlers, and any tag/attribute not on the list.

Running it server-side (not just trusting the editor) means a tampered payload or a future editor change can't smuggle active content into a sent email.

## Recipients & sending

`listRegistrationRecipients` returns the year's registrations including null-email rows; the picker shows those disabled so it's obvious who can't be reached, and select-all only selects emailable rows. At send time the action re-resolves the selected ids, `resolveRecipientEmails` normalizes/validates/dedupes, and anything without a usable address is reported as **skipped** (not silently dropped).

Delivery uses Resend with **one personalized message per recipient** (single-address `to`), so recipients never see each other — batched into chunks of ≤100 to stay efficient for a few hundred participants. A chunk/message error is collected and surfaced in the **failed** list rather than aborting the whole run. Failures caught here are API/validation errors (malformed address, rate limit); asynchronous bounces are out of scope for a send-and-forget summary.

## Framing

`renderEmailBlastHtml` reuses the existing branded shell structure (max-width card, brand-green header with the logo chip, muted footer) but with a generic eyebrow (`MOBISEC {year}`) and the subject as the heading, so a blast looks like the other conference emails without being tied to the check-in wording. The composed body is dropped into the white content card. The "Send test to me" button delivers the real wrapped email to the admin, which is the authoritative preview (no separate in-app preview panel this iteration).

## Editor

Tiptap `StarterKit` supplies the formatting marks/nodes; its bundled Link is configured (`openOnClick: false`, `protocols: ['http','https','mailto']`) rather than adding a second Link extension. `immediatelyRender: false` avoids a Next SSR hydration mismatch. The toolbar is a thin set of buttons bound to editor commands; the link button opens a small dialog for text + URL. The editor is uncontrolled internally and reports HTML upward via `onChange`.

## Non-goals

- No sent history / audit table (send-and-forget). If needed later, add `email_campaigns` without touching this flow.
- No scheduling, no drafts, no per-recipient templating/merge fields.
- No attachments or image upload (links only; inline images would need hosting + proxy handling).
- No Reply-To customization — replies to the no-reply sender are not monitored, matching how the sender is named.
