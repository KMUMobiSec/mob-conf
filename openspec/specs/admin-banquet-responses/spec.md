# admin-banquet-responses Specification

## Purpose
TBD - created by archiving change add-banquet-survey. Update Purpose after archive.
## Requirements
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
trusted from the client. The Send to all confirmation action SHALL target only
responded rows (people who submitted the survey), never invited-but-unresponded
rows. Bulk sends SHALL process each recipient independently, collect per-recipient
failures, and never throw to the client.

#### Scenario: Send to selected

- **WHEN** the administrator selects several rows and chooses Send to selected
- **THEN** the system sends a confirmation to each selected responder and reports
  the number sent and any failures

#### Scenario: Send to all resolves recipients server-side from responders

- **WHEN** the administrator confirms Send to all confirmations
- **THEN** the system resolves the recipient list on the server from responded
  rows only and sends to each, ignoring any client-supplied list and skipping
  invited-but-unresponded rows

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

### Requirement: Import From Registrations

The system SHALL let an administrator import the selected year's registrations
into the banquet responses as invitees. It SHALL create an invitee row (name,
affiliation, email, not attending, no responded-at marker) for each registration
that has an email and whose email is not already present in the banquet responses
for that year. It SHALL skip registrations with no email and skip any email that
already has a banquet row (invited or responded), never overwriting it. It SHALL
report how many rows were imported and how many were skipped.

#### Scenario: Import creates invitees

- **WHEN** an administrator imports registrations for a year
- **THEN** the system creates an invitee row for each registration email not
  already present and reports the imported count

#### Scenario: Dedupe by email

- **WHEN** a registration's email already exists in the banquet responses for the
  year
- **THEN** the system skips that registration without modifying the existing row

#### Scenario: Registration without email is skipped

- **WHEN** a registration has no email on file
- **THEN** the system does not create an invitee row for it and counts it skipped

### Requirement: Banquet Invitation Email

The system SHALL provide an invitation email, distinct from the RSVP confirmation,
whose body links to the survey prefilled with the recipient's name and email. The
system SHALL let an administrator send invitations to selected rows and to all
invited rows (recipients resolved server-side from rows with no responded-at
marker), honoring test mode and tracking invitation sends separately from
confirmation sends. Invitation sends SHALL process each recipient independently,
collect failures, and never throw to the client.

#### Scenario: Send invitation with prefilled link

- **WHEN** an administrator sends an invitation to an invitee
- **THEN** the system sends an invitation email containing a survey link prefilled
  with that person's email and name, and increments their invitation sent count
  outside test mode

#### Scenario: Send to all invited targets only invitees

- **WHEN** an administrator sends invitations to all invited
- **THEN** the system resolves recipients server-side from rows that have not
  responded and sends to each, ignoring responders

#### Scenario: Invitation send tolerates failure

- **WHEN** building an invitation link fails because no public base URL is
  configured, or a send fails at the provider
- **THEN** the system records that recipient as failed, continues with the rest,
  and does not crash the dashboard

### Requirement: Response Status Column And Filter

The system SHALL display each response's status (Invited, Attending, or Not
attending) derived from whether it has responded and its attendance, and SHALL let
administrators filter by that status (all, invited, attending, not attending).

#### Scenario: Invited rows are labeled

- **WHEN** an imported invitee has not yet responded
- **THEN** the dashboard shows its status as Invited

#### Scenario: Filter by invited

- **WHEN** the administrator filters by invited
- **THEN** the dashboard shows only rows that have not responded

