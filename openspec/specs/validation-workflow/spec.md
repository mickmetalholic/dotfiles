# validation-workflow Specification

## Purpose
Define the repository validation command that checks OpenSpec artifacts and script syntax without changing machine state.

## Requirements
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

### Requirement: Dynamic validation file discovery
The validation workflow SHALL discover script and script-template files from the repository tree instead of relying on hand-maintained file lists.

#### Scenario: New POSIX script is added
- **WHEN** a POSIX script or POSIX script template is added under the repository's validation scope
- **THEN** both POSIX and PowerShell validation entrypoints include it in POSIX syntax validation without requiring a manually updated file list

#### Scenario: New PowerShell script is added
- **WHEN** a PowerShell script or PowerShell script template is added under the repository's validation scope
- **THEN** validation includes it in PowerShell syntax validation without requiring a manually updated file list

### Requirement: Optional static analysis
The validation workflow SHALL run script static-analysis checks when the relevant analyzer is available and report a visible skip when it is unavailable.

#### Scenario: Shell analyzer is available
- **WHEN** ShellCheck is available during validation
- **THEN** validation runs ShellCheck against POSIX scripts and templates and fails if ShellCheck reports blocking issues

#### Scenario: Shell analyzer is unavailable
- **WHEN** ShellCheck is unavailable during local validation
- **THEN** validation reports that shell static analysis was skipped without hiding that limitation

#### Scenario: PowerShell analyzer is available
- **WHEN** PSScriptAnalyzer is available during validation
- **THEN** validation runs it against PowerShell scripts and templates and fails if it reports blocking issues

#### Scenario: PowerShell analyzer is unavailable
- **WHEN** PSScriptAnalyzer is unavailable during local validation
- **THEN** validation reports that PowerShell static analysis was skipped without hiding that limitation
