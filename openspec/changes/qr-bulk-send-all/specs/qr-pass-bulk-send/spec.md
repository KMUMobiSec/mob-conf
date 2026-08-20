## ADDED Requirements

### Requirement: Send QR pass to all registrations for a year
The QR check-in admin SHALL provide a single "Send to all" action that emails a registration QR pass to every registration for the currently selected year. The action MUST target the whole year regardless of any active search text or check-in filter, and MUST send to every registration including those already emailed previously (re-send).

#### Scenario: Send to the entire year
- **WHEN** an admin triggers "Send to all" for a year and confirms
- **THEN** the system attempts to email a QR pass to every registration belonging to that year
- **AND** the target set is not limited to the current page or the active search/check-in filter

#### Scenario: Re-send to already-emailed registrations
- **WHEN** a registration already has a recorded prior send (`qrEmailSentAt` set)
- **THEN** the system still emails it again and increments its send count

#### Scenario: Registration without an email
- **WHEN** a targeted registration has no email address on file (and test mode is off)
- **THEN** the system does not send to it and records it as a failure with reason "No email on file"
- **AND** the run continues with the remaining registrations

### Requirement: Confirmation before bulk send
The system SHALL require explicit confirmation before starting a "Send to all" run, and the confirmation SHALL display the number of registrations that will be targeted and warn that already-emailed people will receive the pass again.

#### Scenario: Admin confirms
- **WHEN** the admin clicks "Send to all"
- **THEN** a confirmation dialog appears showing the recipient count for the year and the re-send warning
- **AND** sending begins only after the admin confirms

#### Scenario: Admin cancels
- **WHEN** the admin dismisses the confirmation dialog
- **THEN** no emails are sent

### Requirement: Live progress and result summary
The system SHALL display live progress while a "Send to all" run is in flight and SHALL present an aggregated result summary when it completes.

#### Scenario: Progress advances during the run
- **WHEN** a bulk send is in progress
- **THEN** a progress indicator advances toward completion as registrations are processed
- **AND** actions that mutate registrations are disabled until the run finishes

#### Scenario: Summary on completion
- **WHEN** a bulk send finishes
- **THEN** the system shows how many passes were sent and how many failed
- **AND** each failure is listed with its reason

### Requirement: Throttled bulk sending
Bulk sending SHALL be throttled so that outbound emails stay within the email provider's rate limit. Per-row and current-selection sends SHALL retain their existing unthrottled behavior.

#### Scenario: Bulk send stays under the rate limit
- **WHEN** a "Send to all" run emails many registrations
- **THEN** the outbound send rate is limited so it does not exceed the provider's allowed requests per second

#### Scenario: Small sends are unaffected
- **WHEN** an admin uses per-row "Send" or "Send selected"
- **THEN** those sends run without the bulk throttle delay
