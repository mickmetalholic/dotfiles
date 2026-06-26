# bootstrap-workflow Specification

## Purpose
TBD - created by archiving change add-bootstrap-workflow. Update Purpose after archive.
## Requirements
### Requirement: Conservative bootstrap
`dot bootstrap` SHALL install foundational tooling, apply dotfiles, and delegate package installation through explicit, idempotent steps that respect GUI and host-specific package settings.

#### Scenario: Bootstrap runs without GUI flag
- **WHEN** the user runs `dot bootstrap`
- **THEN** GUI applications are not installed by default

#### Scenario: Bootstrap runs on a host with devops overrides
- **WHEN** bootstrap or package hooks apply package installation for a host with direct devops overrides
- **THEN** only the devops tools declared for that host are considered for installation

### Requirement: Remote install entrypoints
The repository SHALL provide POSIX and PowerShell install entrypoints that install chezmoi when needed, initialize the repository, run bootstrap, and finish with doctor.

#### Scenario: User runs Windows install entrypoint
- **WHEN** `install.ps1` is invoked
- **THEN** it ensures chezmoi is available and delegates further setup to repository bootstrap scripts

### Requirement: Explicit stronger behavior
Bootstrap SHALL require explicit flags for GUI installation and forceful overwrite behavior, and SHALL NOT treat host-specific heavyweight tools as global defaults.

#### Scenario: User allows GUI apps
- **WHEN** bootstrap receives `--gui`
- **THEN** GUI package groups may be installed according to host settings

#### Scenario: Host-specific heavyweight tools are absent
- **WHEN** bootstrap runs on a host without Docker or k3s overrides
- **THEN** Docker and k3s are not installed as part of the default bootstrap behavior

### Requirement: Public one-command install
The repository SHALL support a public install path that does not require GitHub authentication when the repository is public.

#### Scenario: POSIX public install
- **WHEN** a user runs the documented POSIX raw-file install command against a public repository
- **THEN** the install script initializes the dotfiles without requiring `gh auth login`

#### Scenario: Windows public install
- **WHEN** a user runs the documented Windows raw-file install command against a public repository
- **THEN** the install script initializes the dotfiles without requiring `gh auth login`

### Requirement: POSIX chezmoi auto-install
POSIX install and bootstrap setup paths SHALL install `chezmoi` automatically when `chezmoi` is missing and a supported installer path is available.

#### Scenario: Homebrew is available
- **WHEN** a POSIX setup path needs `chezmoi` and `brew` is available
- **THEN** it installs `chezmoi` with Homebrew before running `chezmoi init` or `chezmoi apply`

#### Scenario: Homebrew is unavailable
- **WHEN** a POSIX setup path needs `chezmoi` and Homebrew is unavailable
- **THEN** it attempts a supported non-Homebrew install path or reports a clear manual installation fallback

#### Scenario: Chezmoi is already installed
- **WHEN** a POSIX setup path finds `chezmoi` on `PATH`
- **THEN** it does not reinstall `chezmoi`
