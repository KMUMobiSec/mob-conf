## MODIFIED Requirements

### Requirement: Admin presentations list
The system SHALL provide an admin page at `/admin/presentations` that lists presentation submissions for the selected year, with search and pagination, accessible only to authenticated admins, and SHALL indicate how many files each submission has and whether it includes a video.

#### Scenario: Admin views the list
- **WHEN** an authenticated admin opens `/admin/presentations`
- **THEN** the system shows a paginated table of submissions for the selected year, most recent first, each row indicating its material file count and whether a video is present

#### Scenario: Non-admin is redirected
- **WHEN** an unauthenticated or non-admin user opens `/admin/presentations`
- **THEN** the system redirects them to the admin login

#### Scenario: Search filters the list
- **WHEN** an admin enters a query matching a paper number, title, or contact email
- **THEN** the list shows only submissions matching that query

#### Scenario: Year filter
- **WHEN** an admin changes the selected year
- **THEN** the list shows only submissions for that year

### Requirement: Admin presentation detail and download
The system SHALL provide a detail page at `/admin/presentations/[id]` showing the submission fields, all material files, and the presentation video. Each uploaded file SHALL be downloadable via a short-lived signed URL scoped to that file, and a video provided as an external link SHALL be shown as an outbound link with a hint to verify access.

#### Scenario: Admin downloads a material file
- **WHEN** an admin clicks the download control for a material file on a presentation detail page
- **THEN** the system generates a short-lived signed URL for that file's stored object and opens it for download

#### Scenario: Admin downloads an uploaded video
- **WHEN** the submission includes an uploaded video and an admin clicks its download control
- **THEN** the system generates a short-lived signed URL for the video object and opens it for download

#### Scenario: Admin opens an external video link
- **WHEN** the submission includes an external video link
- **THEN** the detail page shows the link as an outbound control with a hint to verify that it is accessible and downloadable

#### Scenario: Download link is scoped to the file
- **WHEN** a signed download URL is requested for a file id that does not belong to the submission
- **THEN** the system refuses to generate the URL

### Requirement: Delete presentation submission
The system SHALL let an admin delete a presentation submission, removing the database record together with every stored file object for that submission.

#### Scenario: Admin deletes a submission
- **WHEN** an admin confirms deletion of a submission
- **THEN** the system deletes the database record and removes every associated object (all material files and any uploaded video) from the `presentations` bucket
