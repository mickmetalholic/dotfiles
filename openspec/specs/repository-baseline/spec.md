# repository-baseline Specification

## Purpose
Define repository-level maintenance safeguards for CI, editor defaults, Git attributes, ignore rules, and development tool constraints.

## Requirements
### Requirement: Cross-platform repository CI
The repository SHALL run validation automatically on POSIX and Windows CI runners.

#### Scenario: CI validates POSIX path
- **WHEN** the CI workflow runs on a POSIX runner
- **THEN** it runs repository validation for OpenSpec artifacts, POSIX script syntax, and any available static-analysis checks

#### Scenario: CI validates Windows path
- **WHEN** the CI workflow runs on a Windows runner
- **THEN** it runs repository validation through the PowerShell validation path and checks PowerShell syntax

### Requirement: Repository editor defaults
The repository SHALL define root-level editor defaults for common text files maintained in the repository.

#### Scenario: File is edited before chezmoi is applied
- **WHEN** a developer edits repository files with an editor that supports EditorConfig
- **THEN** the editor receives repository indentation, newline, charset, and final-newline defaults from the repository root

### Requirement: Repository attribute coverage
The repository SHALL define line-ending and text attributes for script and configuration file types used by the repository.

#### Scenario: Existing config type is committed
- **WHEN** Lua, KDL, JSON, YAML, TOML, Markdown, shell, PowerShell, or template files are committed
- **THEN** Git normalizes them according to repository attributes

### Requirement: Local state ignore coverage
The repository SHALL ignore common local caches, tool state, temporary files, and secret-like files that are not intended for version control.

#### Scenario: Local tool creates cache state
- **WHEN** local tools create cache, temporary, environment, editor, or runtime state under the repository
- **THEN** Git excludes those paths unless the repository explicitly allowlists a tracked template or config file

### Requirement: Development tool baseline
The repository SHALL expose expected validation and maintenance tool versions or version constraints through repository-level configuration where practical.

#### Scenario: Developer provisions local tools
- **WHEN** a developer uses the repository tool-version configuration
- **THEN** the configured tools support running repository validation without relying on undocumented versions
