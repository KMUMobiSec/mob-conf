## ADDED Requirements

### Requirement: Program View toggle
The system SHALL let an admin switch `/admin/presentations` between a Table view (the existing list) and a Program view via a `view` query parameter, defaulting to the Table view.

#### Scenario: Default table view
- **WHEN** an admin opens `/admin/presentations` with no `view` parameter
- **THEN** the system shows the existing table with its search, year, and reviewed filters

#### Scenario: Switch to program view
- **WHEN** an admin selects the Program view (`?view=program`)
- **THEN** the system shows the conference schedule grid for the selected year instead of the table

#### Scenario: Unknown view value
- **WHEN** the `view` parameter is missing or not a recognized value
- **THEN** the system falls back to the Table view

### Requirement: Program schedule grid
The Program view SHALL render the selected year's conference program as a grid grouped by day and time slot, showing each session's title, room, and time range, and under it each talk's time, authors, title, and presenter when present. The program data SHALL be read server-side from an admin-only source and SHALL NOT be exposed on any public route.

#### Scenario: Schedule rendered from admin data
- **WHEN** an admin opens the Program view for a year that has an admin program file
- **THEN** the system renders the sessions and talks from that file, grouped by day and time slot

#### Scenario: No program data for the year
- **WHEN** the selected year has no admin program file
- **THEN** the Program view shows an empty state rather than an error

#### Scenario: Program data stays private
- **WHEN** the public program page for the same year is requested
- **THEN** it does not read or expose the admin program file

### Requirement: Inline downloads matched by fuzzy title
For each talk in the Program view, the system SHALL find the best-matching uploaded presentation for the same year by normalized title similarity and, when the similarity is at least the configured threshold, render that submission's file download controls inline within the talk cell. Talks with no qualifying match SHALL display the title only.

#### Scenario: Talk with a matching upload
- **WHEN** a talk's title matches an uploaded presentation at or above the threshold
- **THEN** the talk cell shows inline download controls for that submission's material files and its video (a download when uploaded, or an external link when a video link is set)

#### Scenario: Talk without a matching upload
- **WHEN** no uploaded presentation matches a talk's title above the threshold
- **THEN** the talk cell shows the title (and authors/time) only, with no download controls or file names

#### Scenario: Near-but-different titles do not match
- **WHEN** a talk's title is only loosely similar to an upload (below the threshold)
- **THEN** the system does not attach that upload to the talk

### Requirement: Edit submission details
The system SHALL let an authenticated admin edit a submission's paper number, title, contact email, and external video link from the detail page, and SHALL persist valid changes. Editing, adding, or removing uploaded files is not provided by this capability.

#### Scenario: Edit and save valid details
- **WHEN** an admin edits the paper number, title, contact email, or video link to valid values and saves
- **THEN** the system updates the submission and reflects the new values in the detail and list views

#### Scenario: Correcting a title updates matching
- **WHEN** an admin changes a submission's title to match a program talk and saves
- **THEN** the Program view attaches that submission's downloads to the matching talk on the next load

#### Scenario: Invalid edit is rejected
- **WHEN** an admin saves with an empty paper number or title, an invalid contact email, or a non-https video link
- **THEN** the system rejects the change with a field error and does not persist it

#### Scenario: Video link locked when a video file exists
- **WHEN** the submission already has an uploaded video file
- **THEN** the video link field is not editable, preserving the rule that a submission has either an uploaded video or a link but not both

#### Scenario: Only admins can edit
- **WHEN** a request to update a submission comes from an unauthenticated or non-admin caller
- **THEN** the system rejects it and makes no change
