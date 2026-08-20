## ADDED Requirements

### Requirement: Compose a rich-text email with links

An admin SHALL be able to compose an email on the Email Blast page using a WYSIWYG editor supporting at least bold, italic, headings, bullet and numbered lists, and inserting/editing/removing hyperlinks. A subject line SHALL be required. Inserted links SHALL be restricted to safe schemes (`http`, `https`, `mailto`); other schemes SHALL NOT be sent as active links.

#### Scenario: Insert a link

- **WHEN** an admin selects text, opens the link control, and enters a valid `https` URL
- **THEN** the selection becomes a link to that URL in the composed message and in the sent email

#### Scenario: Unsafe link scheme is rejected

- **WHEN** an admin tries to link to a `javascript:` (or other non-http/https/mailto) URL
- **THEN** it is not applied as an active link and is not sent as one

#### Scenario: Subject is required

- **WHEN** an admin attempts to send with an empty subject or an empty message body
- **THEN** the send is blocked with a validation message and no email is sent

### Requirement: Choose recipients from registrations, with import

The Email Blast page SHALL list the selected year's registrations as candidate recipients with select-all and per-recipient selection and a text search. Registrations without an email address SHALL be shown but not selectable. The admin SHALL be able to import registrations (the existing CSV import) from this page, after which the imported people appear as candidate recipients.

#### Scenario: Select recipients

- **WHEN** an admin selects specific registrations (or select-all) and sends
- **THEN** only the selected registrations that have an email receive the message

#### Scenario: Registrations without an email are not selectable

- **WHEN** a registration has no email on file
- **THEN** it is shown in the list but cannot be selected as a recipient

#### Scenario: Import adds candidate recipients

- **WHEN** an admin imports a registrations CSV from the Email Blast page
- **THEN** the imported registrations appear in the recipient list and can be selected

### Requirement: Send from the no-reply sender, sanitized and branded

When an admin sends a blast, the composed HTML SHALL be sanitized on the server to a fixed allowlist (removing scripts, styles, event handlers, and disallowed tags/attributes) and wrapped in the EBISION branded email shell before delivery. The email SHALL be sent from the configured no-reply sender (`RESEND_EMAIL_FROM_NOREPLY`). Each recipient SHALL receive an individually addressed message (recipients SHALL NOT be exposed to one another). The sender SHALL NOT be selectable or overridable by the client.

#### Scenario: Sent from no-reply, individually addressed

- **WHEN** a blast is sent to multiple recipients
- **THEN** each recipient receives a separate message from the no-reply address, and no recipient sees the others' addresses

#### Scenario: Active content is stripped

- **WHEN** the composed body contains a `<script>` tag, an inline event handler, or a disallowed tag
- **THEN** those are removed before the email is wrapped and sent, leaving only allowlisted formatting

#### Scenario: Recipients resolved server-side

- **WHEN** the send request is processed
- **THEN** recipient email addresses are read from the registration records for the selected ids on the server, not taken from client-supplied addresses

### Requirement: Preview via a test send and see a send summary

The admin SHALL be able to send a test copy of the current draft to their own account to preview the exact rendered email. After a blast, the page SHALL report a summary of how many messages were sent, how many failed (with the failing addresses), and how many recipients were skipped for lacking a valid email.

#### Scenario: Test send to self

- **WHEN** an admin clicks "Send test to me" with a subject and body present
- **THEN** the wrapped, sanitized email is delivered to the signed-in admin's address and no registrant receives it

#### Scenario: Result summary

- **WHEN** a blast finishes
- **THEN** the page shows the sent count, any failed recipients, and any skipped (no-email) recipients
