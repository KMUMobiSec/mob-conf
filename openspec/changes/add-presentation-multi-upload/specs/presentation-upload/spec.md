## MODIFIED Requirements

### Requirement: Per-year presentation upload form
The system SHALL serve a public presentation upload form at `/[year]/presentation-upload` for each year in `VALID_YEARS`, and SHALL return a 404 for any other year.

#### Scenario: Valid year renders the form
- **WHEN** a visitor opens `/2026/presentation-upload`
- **THEN** the system renders a form with Paper Number, Title, Contact Email, a presentation materials upload field that accepts multiple files, and an optional presentation video section offering either a video file upload or an external link

#### Scenario: Invalid year is not found
- **WHEN** a visitor opens `/1999/presentation-upload`
- **THEN** the system responds with 404 (not found)

### Requirement: Required submission fields
The form SHALL require a non-empty Paper Number, a non-empty Title, a valid Contact Email, and at least one presentation material file before submission is allowed. The presentation video is optional.

#### Scenario: Missing required text field
- **WHEN** the submitter leaves Paper Number, Title, or Contact Email empty
- **THEN** the form shows a field-level error and the submission is blocked

#### Scenario: Invalid contact email
- **WHEN** the submitter enters a Contact Email that is not a valid email address
- **THEN** the form shows an email validation error and the submission is blocked

#### Scenario: No material file selected
- **WHEN** the submitter has not chosen any presentation material file
- **THEN** the form shows a file-required error and the submission is blocked

#### Scenario: Submission without a video
- **WHEN** the submitter provides valid fields and at least one material file but no video upload and no video link
- **THEN** the submission is allowed

### Requirement: Presentation material file constraints
The system SHALL accept one or more presentation material files, each with extension `.pdf`, `.ppt`, or `.pptx` and size no greater than 50 MB, up to a maximum of 5 material files, and SHALL reject files that violate these constraints on both the client and the server.

#### Scenario: Disallowed file type
- **WHEN** the submitter selects a material file whose extension is not `.pdf`, `.ppt`, or `.pptx`
- **THEN** the system rejects that file with a type error

#### Scenario: File too large
- **WHEN** the submitter selects a material file larger than 50 MB
- **THEN** the system rejects that file with a size error

#### Scenario: Too many material files
- **WHEN** the submitter selects more than 5 material files
- **THEN** the system rejects the extra files with a count error

#### Scenario: Server re-validates metadata
- **WHEN** the upload preparation request is received by the server
- **THEN** the server re-validates the extension, size, and count of every material file before issuing any signed upload URL

### Requirement: Direct upload to private storage
The system SHALL upload each presentation file directly from the browser to the private `presentations` Supabase bucket using a server-issued signed upload URL, storing each object under a path scoped to the year, a unique submission id, and its kind (materials or video), and SHALL show per-file upload progress.

#### Scenario: Successful prepared upload
- **WHEN** the submission passes validation and anti-spam checks
- **THEN** the server returns one signed upload URL per file and a single HMAC-signed upload session embedding all files, and the browser uploads each file to its URL

#### Scenario: Per-file progress
- **WHEN** the browser is uploading the files to their signed URLs
- **THEN** the form displays upload progress for each file individually

#### Scenario: Upload session is verified on submit
- **WHEN** the final submit request is received with an upload session token
- **THEN** the server accepts it only if the token's signature is valid, it has not expired, and its year matches the route year

### Requirement: Persist submission and confirm by email
On a verified submission, the system SHALL persist the presentation record (year, paper number, title, contact email, optional video link) together with one file record per uploaded file (material files and any uploaded video), in a single transaction, and SHALL send a confirmation email to the contact email; an email failure SHALL NOT fail the submission.

#### Scenario: Record persisted
- **WHEN** the submit request passes all checks
- **THEN** the system inserts one presentation row and one file row per uploaded file, and stores the video link when one was provided

#### Scenario: Confirmation email sent
- **WHEN** a presentation record is successfully persisted
- **THEN** the system sends a confirmation email to the contact email summarizing the paper number, title, every material file name, and the video file name or video link when present

#### Scenario: Email failure is non-fatal
- **WHEN** persistence succeeds but the confirmation email fails to send
- **THEN** the submission is still reported as successful and the failure is logged

### Requirement: Cleanup of failed submissions
The system SHALL delete every uploaded storage object for a submission when the submission cannot be persisted after its files were uploaded, or when the submitter abandons a prepared upload.

#### Scenario: Persistence fails after upload
- **WHEN** the files have been uploaded but the database transaction fails
- **THEN** the system deletes every uploaded object for that submission from the `presentations` bucket

#### Scenario: Prepared upload is discarded
- **WHEN** the client abandons a prepared upload before final submit
- **THEN** the system deletes every object referenced by that upload session

## ADDED Requirements

### Requirement: Optional presentation video by upload or link
The form SHALL allow an optional presentation video provided as EITHER a single uploaded video file (extension `.mp4`, `.mov`, or `.webm`, size no greater than 50 MB) OR a single external `https` link, but not both. When the video exceeds 50 MB the submitter is directed to provide a link instead of an upload. These rules SHALL be enforced on both the client and the server.

#### Scenario: Small video uploaded
- **WHEN** the submitter selects a video file no larger than 50 MB with an allowed extension
- **THEN** the system accepts it as the presentation video and uploads it like a material file

#### Scenario: Disallowed video type
- **WHEN** the submitter selects a video file whose extension is not `.mp4`, `.mov`, or `.webm`
- **THEN** the system rejects the video with a type error

#### Scenario: Video too large for upload
- **WHEN** the submitter selects a video file larger than 50 MB
- **THEN** the system rejects the upload and prompts the submitter to provide an external link instead

#### Scenario: External video link provided
- **WHEN** the submitter pastes a valid `https` link and does not upload a video file
- **THEN** the system accepts the link as the presentation video

#### Scenario: Invalid video link
- **WHEN** the submitter enters a video link that is not a valid `https` URL
- **THEN** the form shows a link validation error and the submission is blocked

#### Scenario: Both upload and link provided
- **WHEN** the submitter both uploads a video file and provides a video link
- **THEN** the system rejects the submission and asks the submitter to keep only one

### Requirement: Video link accessibility guidance
The video section SHALL display friendly, professional guidance stating that an external link must let the organizing committee both view and download the recording so the online program can proceed smoothly.

#### Scenario: Guidance shown near the link field
- **WHEN** a visitor views the presentation video section
- **THEN** the form shows guidance emphasizing that the shared link must be accessible and downloadable by the organizers
