## ADDED Requirements

### Requirement: Delete Nomination With Typed Confirmation

The system SHALL let an administrator delete a nomination from its detail page only after an explicit type-to-confirm step in which the administrator types the word `confirm`. The confirm control SHALL be disabled until the exact word is entered.

#### Scenario: Confirmation required

- **WHEN** an administrator opens the delete dialog for a nomination
- **THEN** the delete is not enabled until the administrator types `confirm`

#### Scenario: Successful deletion

- **WHEN** an administrator confirms deletion of a nomination
- **THEN** the system removes the nomination and returns the administrator to the nominations list, where it no longer appears

#### Scenario: Cancelling the dialog

- **WHEN** an administrator opens and then cancels the delete dialog
- **THEN** the nomination is not deleted

### Requirement: Deletion Removes Stored Files

When a nomination is deleted the system SHALL remove all of its uploaded documents from storage in addition to the database record.

#### Scenario: Files removed on delete

- **WHEN** a nomination with uploaded documents is deleted
- **THEN** the system deletes those documents from the storage bucket as well as the database record

#### Scenario: No orphaned record on storage error

- **WHEN** storage deletion fails during a nomination delete
- **THEN** the system still removes the database record and logs the storage failure rather than leaving an undeletable record

### Requirement: Single Winner Email Resend

The system SHALL provide a per-nomination action to send the two winner emails (to the winner and to the nominator) on demand. The action SHALL be repeatable — it works regardless of whether the winner was previously notified — and SHALL report its result immediately.

#### Scenario: Resend on demand

- **WHEN** an administrator triggers the resend action for a winner nomination
- **THEN** the system sends the winner email and the nominator email and reports whether each succeeded

#### Scenario: Repeatable

- **WHEN** an administrator triggers the resend action for a nomination that was already notified
- **THEN** the system sends the emails again rather than skipping them

#### Scenario: Marks notified on first success

- **WHEN** a resend succeeds for a nomination that had not been notified before
- **THEN** the nomination is marked as notified

### Requirement: Email Sent Count

Each nomination SHALL track the number of emails successfully sent for it, and the nominations table SHALL display this count. The count SHALL increase on both the bulk winner notification and the single resend, by the number of emails that actually succeed.

#### Scenario: Count shown in the table

- **WHEN** an administrator views the nominations table
- **THEN** each row shows how many emails have been sent for that nomination

#### Scenario: Count increases on send

- **WHEN** emails are successfully sent for a nomination (via bulk notify or single resend)
- **THEN** that nomination's email-sent count increases by the number of emails that succeeded

### Requirement: Admin-Only Management Actions

Deleting a nomination and resending winner emails SHALL require a valid administrator session, verified independently of page layout.

#### Scenario: Non-admin blocked

- **WHEN** a request to delete a nomination or resend its emails arrives without a valid administrator session
- **THEN** the system rejects it and performs no storage, database, or email operation
