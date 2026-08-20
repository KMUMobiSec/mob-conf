## ADDED Requirements

### Requirement: Registration Management

The system SHALL provide an admin-only QR Check Ins area with a Registrations tab for the selected year. Administrators SHALL be able to add one registration manually or import registrations from CSV using `email`, `name`, and optional `affiliation`.

#### Scenario: Manual registration creation
- **WHEN** an authenticated administrator adds a registration with email, name, optional affiliation, and the selected year
- **THEN** the system creates a registration for that year and displays it in the registrations table

#### Scenario: CSV registration import
- **WHEN** an authenticated administrator imports a CSV containing `email`, `name`, and optional `affiliation`
- **THEN** the system validates the rows, creates valid new registrations for the selected year, reports invalid rows, and displays the imported registrations in the table

#### Scenario: Duplicate email within selected year
- **WHEN** an imported CSV row uses an email that already exists for the selected year
- **THEN** the system updates the existing registration's name and affiliation without replacing its QR credential, QR email history, or check-in state

#### Scenario: Same email in another year
- **WHEN** an administrator adds or imports an email that exists in a different year
- **THEN** the system allows a separate registration for the selected year

### Requirement: Unique QR Credentials

The system SHALL generate one unique opaque QR credential for each registration. QR credentials MUST NOT expose the attendee email, name, or affiliation in plaintext.

#### Scenario: QR generated on registration creation
- **WHEN** a registration is created manually or through CSV import
- **THEN** the system assigns a unique QR credential that can be rendered as a QR code for that registration

#### Scenario: QR verifies registration
- **WHEN** a valid QR credential is scanned for the selected year
- **THEN** the system resolves the credential to exactly one registration for that year

#### Scenario: Invalid QR rejected
- **WHEN** an administrator scans a malformed, unknown, expired, or tampered QR credential
- **THEN** the system rejects the credential and does not create or update a check-in

### Requirement: QR Pass Email Sending

The system SHALL let administrators send QR pass emails to one registration manually or to multiple selected registrations in bulk. The registrations table SHALL expose checkbox selection, multi-select, and select-all for the current filtered result set. The email SHALL link to the attendee's public registration pass page instead of embedding the QR image directly in the email body.

#### Scenario: Send one QR pass email
- **WHEN** an administrator sends a QR pass email for one registration
- **THEN** the system sends a professional EBISION-branded email containing a button to that attendee's public QR pass page and records the send on the registration

#### Scenario: Send selected QR pass emails in bulk
- **WHEN** an administrator selects multiple registrations and confirms a bulk QR email send
- **THEN** the system sends QR pass emails only to the selected registrations and reports the scheduled or completed send count

#### Scenario: Select all registrations in current result
- **WHEN** an administrator activates select-all in the registrations table
- **THEN** the system selects the registrations in the current filtered result set without selecting registrations from other years

#### Scenario: Email send state is visible
- **WHEN** an administrator views the registrations table
- **THEN** each registration shows whether a QR pass email has been sent and, when available, the last sent time or send count

#### Scenario: Failed email is not marked sent
- **WHEN** a QR pass email fails for a registration
- **THEN** the system reports the failure and leaves that registration eligible to send again

### Requirement: Public Registration Pass Page

The system SHALL provide a public dynamic registration pass page addressed by registration id. The page SHALL render the attendee's QR code and conference context for that registration.

#### Scenario: View registration pass
- **WHEN** a visitor opens the registration pass URL for an existing registration id
- **THEN** the system displays the attendee name, EBISION year, conference context, and a scannable QR code

#### Scenario: Unknown registration pass
- **WHEN** a visitor opens the registration pass URL for an unknown registration id
- **THEN** the system responds with a not-found page

### Requirement: Registration Table Check-In State

The registrations table SHALL show check-in state for each registration in the selected year, including whether the attendee is checked in and the check-in time when present.

#### Scenario: Checked-in registration shown in table
- **WHEN** an attendee has been successfully checked in
- **THEN** the registrations table shows the attendee as checked in with the recorded check-in time

#### Scenario: Unchecked registration shown in table
- **WHEN** an attendee has not been checked in
- **THEN** the registrations table shows the attendee as not checked in

### Requirement: Scanner Check-In Tab

The system SHALL provide a separate Check In tab under QR Check Ins for scanning QR credentials and marking registrations checked in for the selected year.

#### Scenario: Successful first check-in
- **WHEN** an authenticated administrator scans a valid QR credential for an unchecked registration in the selected year
- **THEN** the system marks the registration checked in, records the check-in time and administrator, and shows a success result with the attendee name

#### Scenario: Already checked-in attendee
- **WHEN** an authenticated administrator scans a valid QR credential for a registration that is already checked in
- **THEN** the system shows that the attendee was already checked in and does not overwrite the original check-in time
- **AND** the system does not send another welcome email or publish another realtime check-in event for that rescan

#### Scenario: QR from another year
- **WHEN** an administrator scans a valid QR credential for a registration that belongs to a different year than the selected year
- **THEN** the system rejects the check-in and does not modify the registration

### Requirement: Realtime Check-In Updates

The system SHALL use a Supabase realtime channel named `check-ins` so scanner results and registration table state remain synchronized across admin sessions.

#### Scenario: Scanner broadcasts check-in
- **WHEN** a registration is successfully checked in from the scanner tab
- **THEN** the system publishes a check-in event on the `check-ins` channel containing the selected year and registration identifier

#### Scenario: Table updates from realtime event
- **WHEN** the registrations table receives a `check-ins` event for the selected year
- **THEN** the table refreshes or updates the affected row to show the checked-in state

#### Scenario: Other-year realtime event ignored
- **WHEN** the registrations table receives a `check-ins` event for a different year
- **THEN** the table does not change its selected-year data

### Requirement: Welcome Email After Check-In

After a first successful check-in, the system SHALL send the attendee a welcome email for EBISION `<selected year>`.

#### Scenario: Welcome email sent after successful check-in
- **WHEN** an attendee is checked in for the first time
- **THEN** the system sends an email welcoming the attendee to EBISION for the selected year

#### Scenario: Welcome email not duplicated
- **WHEN** an already checked-in attendee's QR credential is scanned again
- **THEN** the system does not send another welcome email for that same check-in

### Requirement: Admin-Only QR Check-In Access

All QR Check Ins pages, registration reads, imports, email sends, QR verification, and check-in mutations SHALL require a valid administrator session.

#### Scenario: Non-admin blocked from QR Check Ins
- **WHEN** a visitor without an administrator session requests the QR Check Ins admin pages
- **THEN** the system redirects the visitor to `/admin/login`

#### Scenario: Non-admin action rejected
- **WHEN** a request to import registrations, send QR emails, verify QR credentials, or mark check-in arrives without a valid administrator session
- **THEN** the system rejects the request and performs no database or email operation
