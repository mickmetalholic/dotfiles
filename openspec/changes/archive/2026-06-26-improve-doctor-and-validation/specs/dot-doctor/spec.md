## ADDED Requirements

### Requirement: Doctor summary
`dot doctor` SHALL end with a summary that distinguishes blocking missing requirements from non-blocking warnings.

#### Scenario: Required tools are missing
- **WHEN** doctor detects one or more missing required commands
- **THEN** the summary lists the run as blocked and includes the number of blocking issues

#### Scenario: Only optional warnings are present
- **WHEN** doctor detects warnings but no missing required commands or failures
- **THEN** the summary lists the run as usable with warnings

#### Scenario: No issues are present
- **WHEN** all required checks pass and no warnings are present
- **THEN** the summary lists the run as ready

### Requirement: Summary fix hints
`dot doctor` SHALL preserve actionable fix hints for missing required tools and warned conditions.

#### Scenario: Missing command has a fix
- **WHEN** a required command check fails with a fix hint
- **THEN** doctor prints the fix hint near the check result and the final summary directs the user to resolve blocking items first
