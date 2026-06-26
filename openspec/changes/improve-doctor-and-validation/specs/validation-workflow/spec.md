## ADDED Requirements

### Requirement: Unified validation command
The repository SHALL expose a validation command through the unified `dot` command surface.

#### Scenario: User runs validation
- **WHEN** the user runs `dot validate`
- **THEN** the command runs repository validation checks for OpenSpec artifacts and script syntax

### Requirement: OpenSpec validation
The validation workflow SHALL run strict validation for all OpenSpec specs and active changes.

#### Scenario: OpenSpec artifacts are valid
- **WHEN** validation runs against valid OpenSpec artifacts
- **THEN** the OpenSpec validation step passes

#### Scenario: OpenSpec artifacts are invalid
- **WHEN** validation detects invalid OpenSpec artifacts
- **THEN** the validation command exits with a failure status

### Requirement: POSIX syntax validation
The validation workflow SHALL parse POSIX shell scripts and shell templates without executing machine-changing behavior.

#### Scenario: Shell syntax is valid
- **WHEN** validation checks POSIX scripts and templates
- **THEN** it runs shell syntax checks and reports success without applying dotfiles or installing packages

### Requirement: PowerShell syntax validation
The validation workflow SHALL parse PowerShell scripts and PowerShell templates when `pwsh` is available.

#### Scenario: PowerShell is available
- **WHEN** `pwsh` is available during validation
- **THEN** validation parses PowerShell scripts and templates and fails if parsing fails

#### Scenario: PowerShell is unavailable
- **WHEN** `pwsh` is not available during validation
- **THEN** validation reports that PowerShell syntax validation was skipped without hiding that limitation
