## ADDED Requirements

### Requirement: Registration email is optional

A check-in registration SHALL be storable with no email address. Email, when present, MUST remain unique per conference year; the absence of an email (null) MUST NOT count against that uniqueness, so any number of null-email registrations MAY exist within the same year.

#### Scenario: Create registration without an email

- **WHEN** a registration is created for a year with a valid name and no email
- **THEN** the registration is persisted with `email = null` and receives its own QR nonce

#### Scenario: Non-null email uniqueness still enforced

- **WHEN** a second registration is created for the same year with an email that already exists (case-insensitively) for that year
- **THEN** the create is rejected as a duplicate

#### Scenario: Multiple null-email registrations coexist

- **WHEN** two separate registrations are created for the same year, each with no email
- **THEN** both are persisted as distinct records

### Requirement: CSV import accepts rows without an email

CSV import SHALL create a registration for a row whose email is blank, whitespace-only, or whose email column is absent, storing that registration with `email = null`. A row SHALL still be rejected as invalid when its name is blank or when a present email is malformed.

#### Scenario: Row with blank email is imported as null

- **WHEN** an admin imports a CSV row with a non-empty name and an empty email cell
- **THEN** the row is treated as valid and a registration is created with `email = null`
- **AND** the row does not appear in the invalid-rows list

#### Scenario: Row with blank name is still invalid

- **WHEN** an admin imports a CSV row with an empty name
- **THEN** the row is reported as an invalid row and no registration is created for it

#### Scenario: Row with a malformed non-empty email is still invalid

- **WHEN** an admin imports a CSV row whose email cell is present but not a valid email address
- **THEN** the row is reported as an invalid row and no registration is created for it

### Requirement: Import dedup and upsert exempt null emails

Within a single import, null-email rows SHALL NOT be deduplicated against one another and SHALL NOT be matched against existing registrations. Each null-email row SHALL always insert a new record. Rows with a non-null email SHALL continue to be deduplicated by normalized email and to update the existing same-year registration when one exists.

#### Scenario: Two null-email rows both insert

- **WHEN** an import contains two rows that both have no email
- **THEN** two new registrations are created

#### Scenario: Null-email row never updates an existing record

- **WHEN** an import contains a null-email row
- **THEN** a new registration is inserted regardless of any existing registrations for that year

#### Scenario: Duplicate non-null emails still collapse to one upsert

- **WHEN** an import contains two rows with the same email (differing only by case or surrounding whitespace)
- **THEN** they are treated as a single row, updating the matching existing registration if one exists

### Requirement: Admin can edit a registration

An admin SHALL be able to edit an existing registration's email, name, and affiliation from the qr-check-ins table. The edit SHALL allow setting a previously blank email to a valid address and clearing an existing email back to null. Name SHALL remain required. Changing the email to one already used by another registration in the same year SHALL be rejected.

#### Scenario: Fill in a previously blank email

- **WHEN** an admin edits a registration that has `email = null` and provides a valid, unused email for that year
- **THEN** the registration is updated with the normalized email

#### Scenario: Clear an existing email to null

- **WHEN** an admin edits a registration and submits a blank email
- **THEN** the registration is updated to `email = null`

#### Scenario: Edit to a conflicting email is rejected

- **WHEN** an admin edits a registration's email to an address already used by a different registration in the same year
- **THEN** the update is rejected with a duplicate-email error and the registration is unchanged

#### Scenario: Blank name on edit is rejected

- **WHEN** an admin submits an edit with a blank name
- **THEN** the update is rejected and the registration is unchanged

### Requirement: QR check-in pass emails send from the registration address

Sending or resending a QR check-in pass SHALL use `registration@ebision.ifip-wg84.org` as the from-address, sourced from the `RESEND_EMAIL_FROM_REGISTRATION` environment variable. This applies to both the initial send and any resend (the shared send path).

#### Scenario: Resend uses the registration from-address

- **WHEN** an admin resends a QR check-in pass to a registration that has an email
- **THEN** the email is sent from the address configured in `RESEND_EMAIL_FROM_REGISTRATION`

#### Scenario: Missing configuration fails clearly

- **WHEN** a QR pass send is attempted and `RESEND_EMAIL_FROM_REGISTRATION` is not set
- **THEN** the send fails with an explicit configuration error

### Requirement: Sending a QR pass to a null-email registration is a reported failure

When an admin sends or resends QR passes and a selected registration has no email, that registration SHALL be reported as a per-item failure ("no email on file") without aborting the rest of the batch or attempting a send.

#### Scenario: Null-email registration reported as failure in a batch

- **WHEN** an admin sends QR passes to a selection that includes one registration with no email and others with emails
- **THEN** the null-email registration is listed as a failure with a "no email on file" reason
- **AND** the other registrations are still sent their passes
