## ADDED Requirements

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
