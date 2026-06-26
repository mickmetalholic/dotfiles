# dot-doctor Specification

## Purpose
TBD - created by archiving change add-dot-doctor. Update Purpose after archive.
## Requirements
### Requirement: Read-only doctor
`dot doctor` SHALL inspect machine and repository state without modifying files, packages, authentication, or shell configuration.

#### Scenario: Doctor checks missing tools
- **WHEN** a required command is absent
- **THEN** doctor reports it as missing and prints a fix hint without installing it

### Requirement: Status output
Doctor output SHALL group checks into readable sections and use `[ok]`, `[warn]`, `[missing]`, or `[fail]` status markers.

#### Scenario: Doctor reports runtime state
- **WHEN** runtime tools are checked
- **THEN** each tool result includes a status marker and version detail when available

### Requirement: Security checks
Doctor SHALL warn when repository-managed files appear to contain plaintext secrets, SSH private keys, `.env` files, cookies, or token-like values.

#### Scenario: Risky secret file is present
- **WHEN** a managed file path resembles a forbidden secret file
- **THEN** doctor reports a warning with a removal or relocation hint

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
