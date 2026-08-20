## 1. Dependencies

- [x] 1.1 `pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/pm sanitize-html`
- [x] 1.2 `pnpm add -D @types/sanitize-html`

## 2. Email send lib + branded shell

- [x] 2.1 `lib/email/email-blast.templates.ts`: `emailBlastShell({ year, subject, bodyHtml, logoUrl })` reusing the existing header/footer tokens with a generic eyebrow; `renderEmailBlastHtml`
- [x] 2.2 `lib/email/email-blast.ts`: `noreplyFromAddress()` (from `RESEND_EMAIL_FROM_NOREPLY`); `sendEmailBlastMessages({ from, subject, html, recipients })` sending via Resend in batches of ≤100 personalized single-recipient messages; returns per-recipient/chunk failures

## 3. Server module (`modules/admin/email-blast/`)

- [x] 3.1 `lib/queries.ts` `listRegistrationRecipients(year)`: registrations for the year → `{ id, idNumber, name, email }`, ordered by idNumber (nulls last) then name; include null-email rows (UI disables them)
- [x] 3.2 `lib/sanitize.ts` `sanitizeEmailHtml(html)`: allowlist matching Tiptap output (p, br, strong/b, em/i, u, s, h1–h3, ul/ol/li, a, blockquote, code, pre, hr); `a[href]` limited to http/https/mailto with `target=_blank rel="noopener noreferrer nofollow"`; strip everything else; return trimmed string
- [x] 3.3 `lib/recipients.ts` (pure): `resolveRecipientEmails(rows)` → normalize/validate/dedupe emails, and `hasRenderableBody(html)` guard for empty editor output
- [x] 3.4 `actions.ts` (use server, admin-gated): `sendEmailBlast({ year, subject, html, recipientIds })` and `sendTestEmailBlast({ year, subject, html })` — validate subject + non-empty body; re-resolve recipients from ids server-side; sanitize; wrap; send from no-reply; return `{ ok, sent, failed, skipped }`

## 4. UI

- [x] 4.1 `RichTextEditor.tsx` (client): Tiptap `useEditor` with `StarterKit.configure({ link: { openOnClick: false, autolink: true, protocols: ['http','https','mailto'] } })`, `immediatelyRender: false`; toolbar (bold, italic, H2/H3, bullet/ordered list, link, unlink, undo/redo); link dialog (text + URL, validated); emits `getHTML()` via `onChange`
- [x] 4.2 `RecipientPicker.tsx` (client): search + select-all (emailable only) + per-row checkbox; disabled rows for null email; "N selected" count
- [x] 4.3 `EmailBlastComposer.tsx` (client): subject input + editor + recipient picker + `CsvImportDialog` reuse; "Send test to me" and "Send blast" (confirm dialog with count); result summary
- [x] 4.4 `page.tsx` (server): resolve year, `listRegistrationRecipients`, render composer with admin email
- [x] 4.5 `AdminSidebar.tsx`: add "Email Blast" nav item (Management group, `Mail`/`Send` icon, `/admin/email-blast`, year-aware). `AdminHeaderTitle.tsx`: add `/admin/email-blast → "Email Blast"`

## 5. Tests & verify

- [x] 5.1 `sanitize` test: strips `<script>`/`<style>`/`on*`; drops `javascript:` hrefs; keeps allowed tags; adds `target`/`rel`; passes plain formatted content through
- [x] 5.2 `recipients` test: normalize/dedupe/validate; drop null/invalid; `hasRenderableBody` false for `<p></p>`/whitespace, true for real content
- [x] 5.3 `email-blast.templates` test: rendered HTML contains the sanitized body, the subject/heading, and the logo when provided
- [x] 5.4 `pnpm check` clean; `pnpm typecheck` clean (aside from the known pre-existing stale `.next` route error); `pnpm vitest run` green for the new suites
- [x] 5.5 `send` test: permissive batch marks only per-index rejects failed; top-level error fails the chunk; clean batch all sent

## 6. Adversarial review fixes (applied)

- [x] 6.1 Permissive Resend batch validation (was strict → one bad address would strand up to 99 good recipients in the chunk)
- [x] 6.2 UUID-filter recipient ids + resolve inside try/catch (a tampered/stale non-uuid id no longer crashes the action)
- [x] 6.3 Accurate `skipped` count from truly-unreachable rows (people sharing an address are reached, not mis-reported as "no email")
- [x] 6.4 `underline:false` so a Ctrl+U `<u>` isn't silently stripped; `ol[start]` preserved through sanitize
- [x] 6.5 Message editor associated via `aria-labelledby` (was a dangling `htmlFor`)
