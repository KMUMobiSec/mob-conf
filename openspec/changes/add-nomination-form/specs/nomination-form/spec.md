## ADDED Requirements

### Requirement: Public Per-Year Nomination Page

The system SHALL serve a public award nomination form at `/[year]/nomination-form` that requires no authentication, derives the conference year from the route segment, and validates that year against `VALID_YEARS`.

#### Scenario: Valid year route

- **WHEN** a visitor requests `/2026/nomination-form`
- **THEN** the system displays the nomination form and associates any resulting submission with year `2026`

#### Scenario: Invalid year route

- **WHEN** a visitor requests `/1999/nomination-form` with a year not in `VALID_YEARS`
- **THEN** the system responds with a not-found page and does not render the form

#### Scenario: No authentication required

- **WHEN** an unauthenticated visitor opens the nomination form for a valid year
- **THEN** the system renders the full form without redirecting to any login

### Requirement: Award-Driven Conditional Form

The system SHALL present an award selection control whose value determines which additional fields and documents are shown and required. The available awards SHALL be Distinguished Lecturer, Young Researcher, Promising Graduate Student, and Industry Pioneer.

#### Scenario: No award selected

- **WHEN** the form first loads and no award is selected
- **THEN** the document section indicates that an award must be selected to reveal its required documents, and award-specific fields are hidden

#### Scenario: Selecting an award reveals its fields

- **WHEN** the nominator selects the Promising Graduate Student award
- **THEN** the system reveals the degree-program and enrollment-status fields and the required supervisor recommendation upload

#### Scenario: Changing award updates requirements

- **WHEN** the nominator changes the award from Promising Graduate Student to Young Researcher
- **THEN** the system hides the graduate-only fields and removes their validation requirements

### Requirement: Nominator and Nominee Details

The system SHALL require the nominator's full name, email, affiliation, and relationship to the nominee, and the nominee's full name, email, affiliation, position/title, and country. Both email fields MUST be valid email addresses.

#### Scenario: Missing required detail

- **WHEN** the nominator attempts to submit without the nominee's country
- **THEN** the system blocks submission and shows a field-level error on the country field

#### Scenario: Invalid email format

- **WHEN** the nominator enters `not-an-email` in either email field and blurs it
- **THEN** the system shows an "enter a valid email address" error for that field

### Requirement: Self-Nomination Restriction

The system SHALL prohibit self-nomination for the Distinguished Lecturer and Young Researcher awards by rejecting submissions where the nominator email equals the nominee email (case-insensitive). Other awards SHALL permit matching emails.

#### Scenario: Self-nomination blocked for restricted award

- **WHEN** the award is Young Researcher and the nominator and nominee emails are identical
- **THEN** the system blocks submission and shows a self-nomination-not-permitted error on the nominee email

#### Scenario: Matching emails allowed for unrestricted award

- **WHEN** the award is Industry Pioneer and the nominator and nominee emails are identical
- **THEN** the system does not raise a self-nomination error for that reason

### Requirement: Promising Graduate Student Conditional Fields

The system SHALL, when the Promising Graduate Student award is selected, require the nominee's current degree program (Master's or Ph.D.), enrollment status (full-time or part-time), and a supervisor recommendation letter upload.

#### Scenario: Graduate fields required

- **WHEN** the award is Promising Graduate Student and degree program is not chosen
- **THEN** the system blocks submission and shows an error requesting the degree program

#### Scenario: Supervisor letter required

- **WHEN** the award is Promising Graduate Student and no supervisor recommendation file is attached
- **THEN** the system blocks submission and shows an error requiring the recommendation letter

### Requirement: Industry Pioneer Slide Deck Limit

The system SHALL, when the Industry Pioneer award is selected, require a single PDF innovation slide deck and SHALL reject a deck whose detected page count exceeds five. When the page count cannot be determined, the system SHALL warn rather than hard-block.

#### Scenario: Slide deck required

- **WHEN** the award is Industry Pioneer and no slide deck is attached
- **THEN** the system blocks submission and shows an error requiring the slide deck

#### Scenario: Deck over the page limit

- **WHEN** an attached slide deck is detected to have more than five pages
- **THEN** the system blocks submission and reports the detected page count and the five-page maximum

#### Scenario: Page count undetectable

- **WHEN** an attached slide deck's page count cannot be parsed
- **THEN** the system shows an advisory message asking the nominator to confirm the deck has five pages or fewer, without hard-blocking on that basis alone

### Requirement: Distinguished Lecturer Recommended Document

The system SHALL mark the teaching/service record document as "Recommended" (not required) when the Distinguished Lecturer award is selected, and as optional otherwise.

#### Scenario: Teaching record recommended

- **WHEN** the award is Distinguished Lecturer
- **THEN** the teaching/service record upload is labeled "Recommended" and its absence does not block submission

### Requirement: Nomination Statement

The system SHALL require a nomination statement of at least 40 characters and SHALL display a live character count.

#### Scenario: Statement too short

- **WHEN** the nominator enters a statement shorter than 40 characters
- **THEN** the system blocks submission and shows a fuller-justification error

### Requirement: Supporting Documents Upload

The system SHALL always require a Curriculum Vitae, a research-achievements summary, and at least one supporting document (multiple allowed). Each uploaded file MUST be within a 30 MB size limit and of an allowed type (`.pdf`, `.doc`, `.docx`; `.zip` additionally for supporting documents; `.pdf` only for slides). The system SHALL show the 30 MB per-file limit beside every upload field, upload file bytes directly from the browser to server-signed Supabase storage URLs, and allow removing an attached file before submission.

#### Scenario: Required document missing

- **WHEN** the nominator attempts to submit without a Curriculum Vitae
- **THEN** the system blocks submission and shows an error requiring the CV

#### Scenario: File too large

- **WHEN** the nominator attaches a file larger than 30 MB
- **THEN** the system rejects that file with a size-limit error that includes the file name, actual size, and 30 MB per-file limit, and does not include it in the submission

#### Scenario: Direct upload fails

- **WHEN** the browser cannot upload a document to its signed Supabase URL
- **THEN** the system shows a detailed error on the affected upload field and does not report the nomination as submitted

#### Scenario: Disallowed file type

- **WHEN** the nominator attaches a file whose type is not in the allow-list for that field
- **THEN** the system rejects that file with a file-type error

### Requirement: Consent Confirmation

The system SHALL require the nominator to confirm the nominee is aware of and consents to the nomination before submission is allowed.

#### Scenario: Consent not given

- **WHEN** the consent checkbox is unchecked at submit time
- **THEN** the system blocks submission and shows a consent-required error

### Requirement: Theme and Design System Conformance

The system SHALL render the form using the application's shadcn/ui components, forest-green palette tokens, and IBM Plex typography, and SHALL display correctly under light, dark, and system themes via the existing theme switcher.

#### Scenario: Dark theme rendering

- **WHEN** the active theme resolves to dark
- **THEN** the form's surfaces, text, borders, and primary actions use the dark-mode token values with no hard-coded prototype colors

#### Scenario: Theme toggle takes effect

- **WHEN** the visitor switches the theme via the mode toggle while on the form
- **THEN** the form updates to the selected theme without a full reload

### Requirement: CAPTCHA and Abuse Protection

The system SHALL require a valid Cloudflare Turnstile token, verified server-side, before processing a submission, and SHALL additionally reject submissions whose hidden honeypot field is populated. These checks SHALL run before any file upload, database write, or email send.

#### Scenario: Missing or invalid CAPTCHA

- **WHEN** a submission arrives without a valid Turnstile token
- **THEN** the system rejects the submission and performs no upload, persistence, or email

#### Scenario: Honeypot triggered

- **WHEN** a submission arrives with a non-empty honeypot field
- **THEN** the system rejects the submission as automated and performs no upload, persistence, or email

### Requirement: Submission Persistence

On a valid, CAPTCHA-verified submission, the system SHALL upload each attached document to the existing Supabase `nominations` storage bucket under a path namespaced by year and a generated nomination id, and SHALL insert one row into the `nominations` database table containing the submitted answers, the route year, and the stored file paths (with original file name and size).

#### Scenario: Documents stored in bucket

- **WHEN** a valid submission with attachments is processed
- **THEN** each file is uploaded to the `nominations` bucket at a path containing the year and the nomination id

#### Scenario: Record persisted with year and paths

- **WHEN** a valid submission is processed for `/2026/nomination-form`
- **THEN** a `nominations` row is created with `year` = 2026 and a documents field mapping each document slot to its stored path, original name, and size

#### Scenario: Persistence failure is recoverable

- **WHEN** the database insert fails after files were uploaded
- **THEN** the system surfaces a retryable error and does not report success to the nominator

### Requirement: Nominator Confirmation Email

The system SHALL send a branded, recap-only confirmation email to the nominator's email address via Resend, sent from `RESEND_EMAIL_FROM_AWARDS`, after a nomination is persisted. The email SHALL summarize the award, nominee, statement, and attached document names, and SHALL NOT include file download links. Email delivery failure SHALL NOT invalidate an otherwise-successful submission.

#### Scenario: Confirmation sent on success

- **WHEN** a nomination is successfully persisted
- **THEN** the system sends a recap confirmation email to the nominator's address from the configured awards sender

#### Scenario: Email failure does not fail submission

- **WHEN** the nomination is persisted but the email send fails
- **THEN** the system still reports submission success to the nominator and logs the email failure

### Requirement: Success Recap Screen

After a successful submission the system SHALL replace the form with a confirmation screen recapping the award, nominator, nominee, statement, attached document names, and consent, and SHALL offer to submit another nomination.

#### Scenario: Recap displayed

- **WHEN** a submission succeeds
- **THEN** the system shows a success screen summarizing the nomination and a control to start another nomination

#### Scenario: Start another nomination

- **WHEN** the nominator chooses to submit another nomination from the success screen
- **THEN** the system resets the form to its empty state
