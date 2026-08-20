## ADDED Requirements

### Requirement: Name Prefill From Link Parameter

The system SHALL prefill the name field from a `?name=` query parameter and render
it read-only when the parameter is present. When no `name` parameter is present,
the name field SHALL be an editable input. Email prefill and locking behavior is
unchanged.

#### Scenario: Name provided via link

- **WHEN** a visitor opens `/2026/banquet-survey?email=jane@x.org&name=Jane%20Doe`
- **THEN** the name field is prefilled with "Jane Doe" and read-only, and the
  email field is prefilled with "jane@x.org" and read-only

#### Scenario: Only email provided

- **WHEN** a visitor opens `/2026/banquet-survey?email=jane@x.org`
- **THEN** the email field is prefilled and read-only and the name field is empty
  and editable

#### Scenario: No parameters

- **WHEN** a visitor opens `/2026/banquet-survey` with no parameters
- **THEN** both the name and email fields are empty and editable

### Requirement: Responded Marker On Submit

The system SHALL record when a response was submitted so that imported invitees
(who have not submitted) are distinguishable from people who have responded. A
successful submission SHALL set the response's responded-at marker, whether the
row was newly inserted or updated from a prior imported invitee.

#### Scenario: Organic submission is marked responded

- **WHEN** a visitor submits the survey for an email with no prior row
- **THEN** the system inserts the response with its responded-at marker set

#### Scenario: Invited person responds

- **WHEN** a person who was previously imported as an invitee submits the survey
- **THEN** the system updates their existing row and sets its responded-at marker,
  moving them out of the invited state
