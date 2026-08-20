## ADDED Requirements

### Requirement: Public Per-Year Banquet Survey Page

The system SHALL serve a public banquet RSVP form at `/[year]/banquet-survey`
that requires no authentication, derives the conference year from the route
segment, and validates that year against `VALID_YEARS`. The page SHALL NOT appear
in the public site navigation; it is reached via a direct or emailed link.

#### Scenario: Valid year route

- **WHEN** a visitor requests `/2026/banquet-survey`
- **THEN** the system displays the banquet survey and associates any resulting
  submission with year `2026`

#### Scenario: Invalid year route

- **WHEN** a visitor requests `/1999/banquet-survey` with a year not in
  `VALID_YEARS`
- **THEN** the system responds with a not-found page and does not render the form

#### Scenario: No authentication required

- **WHEN** an unauthenticated visitor opens the banquet survey for a valid year
- **THEN** the system renders the full form without redirecting to any login

### Requirement: Email Prefill From Link Parameter

The system SHALL prefill the email field from an `?email=` query parameter and
render it read-only when the parameter is present. When no parameter is present,
the email field SHALL be an editable input. The prefilled value SHALL NOT be
treated as an authenticated identity; the server SHALL still validate and
normalize it.

#### Scenario: Email provided via link

- **WHEN** a visitor opens `/2026/banquet-survey?email=jane@example.org`
- **THEN** the email field is prefilled with `jane@example.org` and is read-only

#### Scenario: Opened without email parameter

- **WHEN** a visitor opens `/2026/banquet-survey` with no `email` parameter
- **THEN** the email field is empty and editable

### Requirement: Attendance-Conditional Fields

The system SHALL always collect name, affiliation, and email, and SHALL present a
required Yes/No control asking whether the visitor will attend the banquet on the
configured date at the configured venue. When the answer is Yes, the system SHALL
reveal an allergen checklist (nuts, shellfish, dairy, gluten, vegetarian, vegan),
an "other" free-text field, and a message textarea. When the answer is No, those
fields SHALL be hidden and submitted empty.

#### Scenario: Attending reveals dietary fields

- **WHEN** the visitor selects Yes for attendance
- **THEN** the system reveals the allergen checklist, the other free-text field,
  and the message textarea

#### Scenario: Not attending hides dietary fields

- **WHEN** the visitor selects No for attendance and submits
- **THEN** the system records the response with no allergens, no other text, and
  no message

#### Scenario: Attendance is required

- **WHEN** the visitor submits without choosing Yes or No
- **THEN** the system blocks submission and flags the attendance field

### Requirement: Shared Client and Server Validation

The system SHALL validate submissions with a single shared schema used by both
the client form and the server action, requiring a non-empty name and a
well-formed email, and enforcing dietary field length limits only when attending.

#### Scenario: Missing required fields

- **WHEN** the visitor submits with an empty name or an invalid email
- **THEN** the system blocks submission and displays field-level errors

#### Scenario: Server re-validates

- **WHEN** a submission reaches the server action
- **THEN** the server validates it with the same schema and rejects invalid input
  even if client validation was bypassed

### Requirement: Bot Protection

The system SHALL protect the banquet survey submission with the same bot
protection used by the other public forms: a Cloudflare Turnstile token
verified server-side and a honeypot field.

#### Scenario: Failed verification

- **WHEN** a submission arrives with a missing or invalid Turnstile token
- **THEN** the server rejects the submission without persisting a response

#### Scenario: Honeypot filled

- **WHEN** a submission arrives with the hidden honeypot field populated
- **THEN** the server rejects the submission without persisting a response

### Requirement: Response Persistence With Upsert

The system SHALL persist each valid submission to a `banquet_responses` record
keyed uniquely on `(year, normalized email)`. A subsequent submission for the
same year and email SHALL update the existing record rather than create a
duplicate or error.

#### Scenario: First submission

- **WHEN** a visitor submits a valid response for a year and email not seen before
- **THEN** the system inserts a new `banquet_responses` row with the normalized
  lowercase email

#### Scenario: Re-submission updates the record

- **WHEN** a visitor submits again with the same year and email and changed answers
- **THEN** the system updates the existing row with the new answers instead of
  inserting a duplicate

### Requirement: Automatic RSVP Confirmation Email

On a successful submission the system SHALL send an RSVP confirmation email to the
responder and, on a successful send, set the response's confirmation timestamp and
increment its cumulative sent count. A re-submission SHALL send the confirmation
again and increment the count (never reset it). The email send SHALL be non-fatal:
submission succeeds even if the email fails. The public confirmation SHALL honor
the global check-in test mode the same way admin sends do: while test mode is on,
the email is redirected to the tester list and the response's real sent count and
timestamp are left unchanged. The success view SHALL only claim the confirmation
was emailed when it was actually delivered to the submitter. All email copy SHALL
avoid emdashes.

#### Scenario: Confirmation sent on submit

- **WHEN** a submission is persisted successfully outside test mode
- **THEN** the system sends a confirmation email to the responder and increments
  the sent count and updates the timestamp on success

#### Scenario: Email failure does not fail submission

- **WHEN** the confirmation email fails to send
- **THEN** the submission still succeeds and the success view does not claim an
  email was delivered

#### Scenario: Re-submission increments the sent count

- **WHEN** a visitor re-submits for the same year and email
- **THEN** the system sends the confirmation again and increments the cumulative
  sent count rather than resetting it

#### Scenario: Test mode redirects the public confirmation

- **WHEN** check-in test mode is on and a visitor submits the survey
- **THEN** the confirmation is redirected to the tester list and the response's
  real sent count and timestamp are left unchanged

### Requirement: Admin-Editable Banquet Date and Venue

The system SHALL store the banquet date and venue as admin-editable global
settings and SHALL use them in the form heading and confirmation email copy. When
a value is unset, the system SHALL fall back to a built-in default label.

#### Scenario: Admin updates date and venue

- **WHEN** an administrator sets the banquet date and venue on the Admin Setup page
- **THEN** the survey heading and confirmation email reflect the new values

#### Scenario: Unset falls back to default

- **WHEN** the banquet date or venue has not been configured
- **THEN** the survey and email display the built-in default label instead of a
  blank value

### Requirement: Submission Success View

After a successful submission the system SHALL show a confirmation view that
recaps the attendance choice and dietary details and states that a confirmation
was emailed to the responder.

#### Scenario: Success recap shown

- **WHEN** a submission succeeds
- **THEN** the system replaces the form with a success view summarizing the
  response and confirming the email destination
