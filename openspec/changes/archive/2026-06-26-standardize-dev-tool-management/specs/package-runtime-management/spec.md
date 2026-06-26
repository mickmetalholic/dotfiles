## MODIFIED Requirements

### Requirement: Declarative package data
The repository SHALL declare shared runtimes, shared developer tools, OS-specific package manager entries, official fallback entries, GUI development applications, and direct host-specific package overrides in `data/packages.yaml`.

#### Scenario: Package scripts locate declarations
- **WHEN** a package script starts
- **THEN** it can find shared runtime declarations, shared developer tool declarations, the current OS package groups, and current host package overrides

#### Scenario: Host package overrides are declared
- **WHEN** a package applies only to a named machine
- **THEN** it is declared as a direct host override rather than through a role or profile layer

### Requirement: Package installation command
`dot packages` SHALL install or update supported packages through available OS package managers and declared official fallback handling while tolerating already-installed packages.

#### Scenario: Package already installed
- **WHEN** a declared package is already present
- **THEN** the command does not treat that package as a fatal error

#### Scenario: Package requires official fallback
- **WHEN** a declared tool is unavailable through the primary OS package manager
- **THEN** the command reports or uses the declared official fallback path without relying on an undeclared package manager

## ADDED Requirements

### Requirement: Windows winget standardization
Windows package installation SHALL use `winget` as the only managed Windows package manager.

#### Scenario: Windows packages are installed
- **WHEN** `dot packages` runs on Windows
- **THEN** declared Windows packages are installed or updated through `winget` or declared official fallback handling

#### Scenario: Scoop is unavailable
- **WHEN** `dot packages` runs on Windows and `scoop` is not installed
- **THEN** the command does not warn about missing `scoop` and does not require it

### Requirement: Expanded developer tool baseline
The package catalog SHALL include developer baseline tools for file listing, directory navigation, HTTP/API workflows, file viewing, command help, diffs, Git TUI, task running, shell linting, shell formatting, PowerShell analysis, and selected configuration format tooling where supported.

#### Scenario: Baseline developer tools are applied
- **WHEN** package installation runs on a supported OS
- **THEN** supported baseline developer tools are installed or reported with actionable fallback guidance

### Requirement: GUI package removal
Obsidian SHALL NOT be installed by managed package commands.

#### Scenario: GUI apps are installed
- **WHEN** GUI application installation is enabled
- **THEN** Obsidian is not included in the packages selected for installation

### Requirement: Host-specific devops installation
Package installation SHALL apply Docker and k3s only according to direct host overrides.

#### Scenario: work-mac packages are installed
- **WHEN** package installation runs for host `work-mac`
- **THEN** Docker is selected and k3s is not selected

#### Scenario: linux-devbox packages are installed
- **WHEN** package installation runs for host `linux-devbox`
- **THEN** Docker and native k3s are selected
