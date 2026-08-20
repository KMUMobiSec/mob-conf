## ADDED Requirements

### Requirement: Notify Winners Action

The admin nominations table SHALL provide an action that emails award winners and their nominators. The action SHALL target winners (nominations with the winner status) for the currently selected year that have not yet been notified, and SHALL display the number of pending winners before sending.

#### Scenario: Pending count shown

- **WHEN** an administrator views the nominations table with winners that have not been notified
- **THEN** the notify control indicates how many winners are pending notification

#### Scenario: Confirmation before sending

- **WHEN** an administrator activates the notify control
- **THEN** the system asks for confirmation, stating how many winners and how many emails will be sent, before sending anything

#### Scenario: No pending winners

- **WHEN** there are no un-notified winners for the selected scope
- **THEN** the system does not send emails and indicates there is nothing to send

#### Scenario: Sending is non-blocking

- **WHEN** an administrator confirms the send
- **THEN** the system schedules the emails to be sent in the background and responds promptly without waiting for delivery to complete

### Requirement: Two Distinct Emails Per Winner

For each notified winner the system SHALL send, via Resend from the awards sender address, two distinct emails: a congratulatory email to the winner (the nominee) and a separate notification email to the nominator informing them that their nominee has won. The two emails SHALL have different subjects and body copy.

#### Scenario: Winner receives congratulations

- **WHEN** a winner is notified
- **THEN** the nominee's email address receives a congratulatory message naming the award and year

#### Scenario: Nominator receives notification

- **WHEN** a winner is notified
- **THEN** the nominator's email address receives a separate message stating that the nominee they put forward has won the award

### Requirement: One-Time Notification (Idempotent)

The system SHALL record when a winner has been notified and SHALL NOT notify the same winner again on subsequent runs. A winner SHALL be marked notified only when both of its emails are sent successfully.

#### Scenario: Already-notified winners are skipped

- **WHEN** an administrator runs the notify action a second time
- **THEN** winners already notified are not emailed again, and only newly-marked, un-notified winners are sent

#### Scenario: Partial failure remains pending

- **WHEN** one of a winner's two emails fails to send
- **THEN** that winner is not marked notified and is reported as failed, so it can be retried

### Requirement: Notification Progress and Retry

When a notify run is started the system SHALL report how many winners were scheduled for notification. As background sending completes, notified winners SHALL no longer be counted as pending. Winners whose emails fail SHALL remain pending and be retryable on a later run, and failures SHALL be logged.

#### Scenario: Scheduling confirmed

- **WHEN** an administrator starts a notify run
- **THEN** the system reports how many winners were scheduled for notification

#### Scenario: Progress reflected after sending

- **WHEN** background sending completes successfully for a winner and the administrator refreshes the table
- **THEN** that winner is no longer counted among the pending winners

#### Scenario: Failures stay pending

- **WHEN** a winner's email fails to send in the background
- **THEN** that winner remains pending for a later run and the failure is logged

### Requirement: Admin-Only Notification

The notify action SHALL require a valid administrator session, verified independently of page layout.

#### Scenario: Non-admin blocked

- **WHEN** a request to run the notify action arrives without a valid administrator session
- **THEN** the system rejects it and sends no email and updates no record
