## ADDED Requirements

### Requirement: Per-year presentation upload form
The system SHALL serve a public presentation upload form at `/[year]/presentation-upload` for each year in `VALID_YEARS`, and SHALL return a 404 for any other year.

#### Scenario: Valid year renders the form
- **WHEN** a visitor opens `/2026/presentation-upload`
- **THEN** the system renders a form with Paper Number, Title, Contact Email, and a presentation file upload field

#### Scenario: Invalid year is not found
- **WHEN** a visitor opens `/1999/presentation-upload`
- **THEN** the system responds with 404 (not found)

### Requirement: Required submission fields
The form SHALL require a non-empty Paper Number, a non-empty Title, a valid Contact Email, and exactly one presentation file before submission is allowed.

#### Scenario: Missing required text field
- **WHEN** the submitter leaves Paper Number, Title, or Contact Email empty
- **THEN** the form shows a field-level error and the submission is blocked

#### Scenario: Invalid contact email
- **WHEN** the submitter enters a Contact Email that is not a valid email address
- **THEN** the form shows an email validation error and the submission is blocked

#### Scenario: No file selected
- **WHEN** the submitter has not chosen a presentation file
- **THEN** the form shows a file-required error and the submission is blocked

### Requirement: Presentation file constraints
The system SHALL accept exactly one presentation file with extension `.pdf`, `.ppt`, or `.pptx` and size no greater than 50 MB, and SHALL reject files that violate these constraints on both the client and the server.

#### Scenario: Disallowed file type
- **WHEN** the submitter selects a file whose extension is not `.pdf`, `.ppt`, or `.pptx`
- **THEN** the system rejects the file with a type error

#### Scenario: File too large
- **WHEN** the submitter selects a file larger than 50 MB
- **THEN** the system rejects the file with a size error

#### Scenario: Server re-validates metadata
- **WHEN** the upload preparation request is received by the server
- **THEN** the server re-validates the file extension and size before issuing a signed upload URL

### Requirement: Anti-spam protection
The form SHALL be protected by a hidden honeypot field and Cloudflare Turnstile, and the server SHALL reject submissions that fail either check before any storage, database, or email work.

#### Scenario: Honeypot filled
- **WHEN** the hidden honeypot field is non-empty in a submission
- **THEN** the server rejects the submission without creating any record or file

#### Scenario: CAPTCHA fails
- **WHEN** the Turnstile token is missing or fails verification
- **THEN** the server rejects the submission with a CAPTCHA error and performs no upload

### Requirement: Direct upload to private storage
The system SHALL upload the presentation file directly from the browser to the private `presentations` Supabase bucket using a server-issued signed upload URL, and SHALL store the object under a path scoped to the year and a unique submission id.

#### Scenario: Successful prepared upload
- **WHEN** the submission passes validation and anti-spam checks
- **THEN** the server returns a signed upload URL and an HMAC-signed upload session, and the browser uploads the file to that URL

#### Scenario: Upload session is verified on submit
- **WHEN** the final submit request is received with an upload session token
- **THEN** the server accepts it only if the token's signature is valid, it has not expired, and its year matches the route year

### Requirement: Persist submission and confirm by email
On a verified submission, the system SHALL persist the presentation record (year, paper number, title, contact email, file name, file path, file size) and SHALL send a confirmation email to the contact email; an email failure SHALL NOT fail the submission.

#### Scenario: Record persisted
- **WHEN** the submit request passes all checks
- **THEN** the system inserts a presentation row containing the field values and the stored file reference

#### Scenario: Confirmation email sent
- **WHEN** a presentation record is successfully persisted
- **THEN** the system sends a confirmation email to the contact email summarizing the paper number, title, and file name

#### Scenario: Email failure is non-fatal
- **WHEN** persistence succeeds but the confirmation email fails to send
- **THEN** the submission is still reported as successful and the failure is logged

### Requirement: Cleanup of failed submissions
The system SHALL delete an uploaded storage object when the submission cannot be persisted after the file was uploaded.

#### Scenario: Persistence fails after upload
- **WHEN** the file has been uploaded but the database insert fails
- **THEN** the system deletes the uploaded object from the `presentations` bucket
