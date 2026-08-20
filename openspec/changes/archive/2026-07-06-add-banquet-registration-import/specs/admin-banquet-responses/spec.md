## ADDED Requirements

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

## MODIFIED Requirements

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
