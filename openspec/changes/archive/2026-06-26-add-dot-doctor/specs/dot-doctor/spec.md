## ADDED Requirements

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
