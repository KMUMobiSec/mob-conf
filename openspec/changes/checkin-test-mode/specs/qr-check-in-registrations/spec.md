## ADDED Requirements

### Requirement: Check-in test mode redirects email recipients

When check-in test mode is ON, every check-in email — the QR pass (initial send and resend) and the post-check-in welcome — SHALL be sent with content identical to production but with the recipient replaced by the tester email receiver list. If the tester list is empty, the recipient SHALL fall back to `cyberchair.ebision@gmail.com`. When test mode is OFF, emails SHALL be sent to the registration's real address exactly as before. The recipient override SHALL be resolved from the persisted global settings on the server (not trusted from the client).

#### Scenario: Resend redirected to tester list

- **WHEN** test mode is ON, the tester list is non-empty, and an admin resends a QR pass for a registration that has a real email
- **THEN** the email content is unchanged but it is delivered to the tester list, not the registration's real address

#### Scenario: Empty tester list falls back

- **WHEN** test mode is ON and the tester list is empty and any check-in email is sent
- **THEN** it is delivered to `cyberchair.ebision@gmail.com`

#### Scenario: Test mode off is normal

- **WHEN** test mode is OFF and a QR pass or welcome email is sent
- **THEN** it is delivered to the registration's real email address

### Requirement: Test mode can send to registrations without an email

Because test mode fully overrides the recipient, sending a QR pass or welcome to a registration that has no email on file SHALL succeed (delivered to the tester list / fallback) while test mode is ON. When test mode is OFF, such a send SHALL still be reported as a "No email on file" failure.

#### Scenario: Null-email registration sendable in test mode

- **WHEN** test mode is ON and an admin sends a QR pass for a registration with no email
- **THEN** the send succeeds and is delivered to the tester list / fallback

#### Scenario: Null-email registration blocked when off

- **WHEN** test mode is OFF and an admin sends a QR pass for a registration with no email
- **THEN** it is reported as a "No email on file" failure

### Requirement: Test mode does not pollute real send tracking

While test mode is ON, sending redirected email SHALL NOT update the real registration's send-tracking fields (`qrEmailSentAt`, `qrEmailSentCount`, `welcomeEmailSentAt`), so the admin views do not falsely show that a real attendee was notified. Actual check-ins SHALL still persist normally (the `checkedInAt` write and realtime broadcast are unaffected by test mode).

#### Scenario: Sent tracking untouched in test mode

- **WHEN** test mode is ON and a QR pass is sent for a registration
- **THEN** that registration's `qrEmailSentAt` and `qrEmailSentCount` are unchanged

#### Scenario: Check-in still persists in test mode

- **WHEN** test mode is ON and a valid badge is scanned for a not-yet-checked-in registration
- **THEN** the registration is marked checked in and the realtime broadcast fires, exactly as in normal mode

### Requirement: Test mode can undo a check-in

While test mode is ON, an admin SHALL be able to remove a registration's checked-in status ("uncheck-in"), clearing `checkedInAt` and `checkedInBy` so the flow can be re-tested. This capability SHALL be available only in test mode: the uncheck-in action SHALL re-verify test mode server-side and reject the request when test mode is OFF, so real check-ins cannot be cleared in production.

#### Scenario: Undo a check-in in test mode

- **WHEN** test mode is ON and an admin uses "Undo check-in" on a checked-in registration
- **THEN** the registration's `checkedInAt` and `checkedInBy` are cleared and it appears not-checked-in again

#### Scenario: Uncheck-in rejected when off

- **WHEN** test mode is OFF and an uncheck-in is attempted
- **THEN** it is rejected and the registration's checked-in status is unchanged

#### Scenario: Undo control only visible in test mode

- **WHEN** test mode is OFF
- **THEN** the "Undo check-in" control is not shown on checked-in rows

### Requirement: Check-in surface is visually distinct in test mode

When test mode is ON, the check-in surface SHALL be visually marked as non-production: a persistent amber frame/border around both the registrations tab and the full-screen scanner, plus a banner that states test mode is active and shows the recipients email is being redirected to. The indicator SHALL NOT rely on color alone (it includes an icon and text). A toggle on the check-in page SHALL turn test mode on and off, reflecting the persisted global state.

#### Scenario: Frame and banner shown when on

- **WHEN** test mode is ON and an admin opens the QR Check-Ins page or the scanner
- **THEN** an amber frame and a "TEST MODE" banner (icon + text naming the redirect target) are visible

#### Scenario: Normal appearance when off

- **WHEN** test mode is OFF
- **THEN** no test-mode frame or banner is shown and the surface looks like production

#### Scenario: Toggle reflects and updates global state

- **WHEN** an admin flips the check-in test-mode toggle
- **THEN** the global test-mode setting is updated and the surface's appearance and email behavior change accordingly
