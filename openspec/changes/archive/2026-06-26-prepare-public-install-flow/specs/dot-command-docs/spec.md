## ADDED Requirements

### Requirement: Public install documentation
The README SHALL document public one-command install as the setup path once the repository is safe to publish.

#### Scenario: User reads install section
- **WHEN** the user reads the README install section
- **THEN** the public POSIX and Windows raw-file install commands are presented without private/authenticated fallback instructions

### Requirement: Public safety documentation
The README SHALL state that repository visibility should only be changed after public-readiness checks and manual review.

#### Scenario: User plans to make repository public
- **WHEN** the user reads the public install guidance
- **THEN** they can identify the required safety review before changing GitHub visibility
