## ADDED Requirements

### Requirement: Banquet Responses Dashboard

The system SHALL provide an authenticated admin page at `/admin/banquet-survey`
that lists banquet responses for the selected conference year, one row per
person/email, showing at least name, email, affiliation, attendance status,
allergens, message, sent count, and confirmation-sent time. Timestamps SHALL be
serialized before being handed to client components.

#### Scenario: Dashboard lists responses for the year

- **WHEN** an authenticated administrator opens `/admin/banquet-survey` for a year
- **THEN** the system lists that year's responses with attendance status and
  dietary details

#### Scenario: Requires authentication

- **WHEN** an unauthenticated visitor requests `/admin/banquet-survey`
- **THEN** the system does not render the dashboard and redirects to admin login

### Requirement: Search, Filter, and Pagination

The system SHALL allow administrators to search responses by name, email, or
affiliation, filter by attendance status (all / attending / not attending), and
paginate the results, reusing the existing admin list controls.

#### Scenario: Search narrows results

- **WHEN** the administrator enters a query matching a name, email, or affiliation
- **THEN** the system shows only responses matching that query

#### Scenario: Filter by attendance

- **WHEN** the administrator filters by "attending"
- **THEN** the system shows only responses whose attendance is Yes

### Requirement: Per-Row Resend Confirmation

The system SHALL provide a per-row action that resends the RSVP confirmation email
to that response's email address and, on a successful send outside test mode,
atomically increments the response's sent count and updates its confirmation-sent
time.

#### Scenario: Resend a single confirmation

- **WHEN** the administrator clicks Resend on a response row
- **THEN** the system sends the confirmation to that responder and reflects the
  updated sent count after refresh

#### Scenario: Resend reports failure without throwing

- **WHEN** a resend fails at the email provider
- **THEN** the system reports the failure inline and does not crash the dashboard

### Requirement: Bulk Send Confirmations

The system SHALL allow administrators to select responses via row checkboxes with
a select-all control and send confirmations to the selected set, and SHALL provide
a Send to all action whose recipient set is resolved on the server rather than
trusted from the client. Bulk sends SHALL process each recipient independently,
collect per-recipient failures, and never throw to the client.

#### Scenario: Send to selected

- **WHEN** the administrator selects several rows and chooses Send to selected
- **THEN** the system sends a confirmation to each selected responder and reports
  the number sent and any failures

#### Scenario: Send to all resolves recipients server-side

- **WHEN** the administrator confirms Send to all
- **THEN** the system resolves the full recipient list for the year on the server
  and sends to each, ignoring any client-supplied recipient list

#### Scenario: Partial failure is tolerated

- **WHEN** some recipients fail during a bulk send
- **THEN** the system still sends to the rest and reports the counts of sent and
  failed

### Requirement: Test-Mode-Aware Sending

The system SHALL respect the global check-in test mode when sending banquet
confirmations: while test mode is on, sends SHALL be redirected to the configured
tester recipients and the real per-response sent count and confirmation timestamp
SHALL NOT be updated. The client-side test-mode indicator SHALL be display-only
and never determine recipients.

#### Scenario: Test mode redirects recipients

- **WHEN** test mode is on and an administrator sends a confirmation
- **THEN** the email is delivered to the tester recipients and the response's real
  sent count and timestamp are left unchanged

#### Scenario: Normal mode updates tracking

- **WHEN** test mode is off and a send succeeds
- **THEN** the response's sent count is incremented and its confirmation-sent time
  is updated
