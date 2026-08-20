## ADDED Requirements

### Requirement: Admin presentations list
The system SHALL provide an admin page at `/admin/presentations` that lists presentation submissions for the selected year, with search and pagination, accessible only to authenticated admins.

#### Scenario: Admin views the list
- **WHEN** an authenticated admin opens `/admin/presentations`
- **THEN** the system shows a paginated table of submissions for the selected year, most recent first

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
The system SHALL provide a detail page at `/admin/presentations/[id]` showing the submission fields and a control to download the presentation file via a short-lived signed URL.

#### Scenario: Admin downloads the file
- **WHEN** an admin clicks the file download control on a presentation detail page
- **THEN** the system generates a short-lived signed URL for that submission's stored object and opens it for download

#### Scenario: Download link is scoped to the submission
- **WHEN** a signed download URL is requested for a path that does not belong to the submission
- **THEN** the system refuses to generate the URL

### Requirement: Mark presentation reviewed
The system SHALL let an admin toggle a Reviewed status on a presentation submission and persist that status.

#### Scenario: Toggle reviewed
- **WHEN** an admin toggles the Reviewed control on a submission
- **THEN** the system persists the new reviewed status and reflects it in the list and detail views

### Requirement: Delete presentation submission
The system SHALL let an admin delete a presentation submission, removing both the database record and the stored file object.

#### Scenario: Admin deletes a submission
- **WHEN** an admin confirms deletion of a submission
- **THEN** the system deletes the database record and the associated object from the `presentations` bucket

### Requirement: Admin navigation entry
The system SHALL include a "Presentations" entry in the admin sidebar linking to the presentations list for the selected year.

#### Scenario: Sidebar shows Presentations
- **WHEN** an admin views any protected admin page
- **THEN** the sidebar shows a "Presentations" navigation item that links to `/admin/presentations` for the selected year
