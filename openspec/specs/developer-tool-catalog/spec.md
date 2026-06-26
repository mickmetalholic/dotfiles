# developer-tool-catalog Specification

## Purpose
TBD - created by archiving change standardize-dev-tool-management. Update Purpose after archive.
## Requirements
### Requirement: Development-focused software scope
The repository SHALL manage software that supports reproducible development environments and SHALL exclude general personal application inventory.

#### Scenario: Non-development application is considered
- **WHEN** a non-development personal application is proposed for the managed package catalog
- **THEN** it is excluded unless it is explicitly justified as part of the development workflow

#### Scenario: Development tool is considered
- **WHEN** a CLI, editor, terminal, runtime, formatter, linter, API client, or AI coding tool is proposed for the managed package catalog
- **THEN** it can be represented as a managed development tool

### Requirement: Tool categories
The repository SHALL categorize managed tools by development purpose without introducing role or profile layers.

#### Scenario: Developer baseline tools are declared
- **WHEN** package data declares tools shared by development machines
- **THEN** the tools are grouped as shared development defaults or OS-specific entries

#### Scenario: Host-specific tools are declared
- **WHEN** a tool applies only to a named machine
- **THEN** the tool is declared as a direct host override

### Requirement: GUI development applications
The repository SHALL manage GUI applications only when they are part of the development workflow and controlled by GUI installation settings.

#### Scenario: GUI apps are not requested
- **WHEN** package installation runs without GUI application installation enabled
- **THEN** GUI development applications are not installed

#### Scenario: Obsidian is evaluated
- **WHEN** managed GUI development applications are declared
- **THEN** Obsidian is not included in the catalog

### Requirement: HTTPie tool split
The repository SHALL treat HTTPie CLI and HTTPie Desktop as distinct managed tools.

#### Scenario: HTTPie tools are installed
- **WHEN** the HTTPie tool group is applied on a supported host
- **THEN** both the HTTPie command-line client and HTTPie Desktop are considered for installation through their appropriate channels

### Requirement: tldr client selection
The repository SHALL use `tlrc` as the managed tldr client.

#### Scenario: tldr support is declared
- **WHEN** package data declares tldr-style command help support
- **THEN** it declares `tlrc` rather than a generic `tldr` package

### Requirement: AI coding tools
The repository SHALL represent Codex and Reasonix as development tools with separate CLI and app entries where applicable.

#### Scenario: AI tools are declared
- **WHEN** package data declares AI coding tools
- **THEN** Codex CLI, Codex app, Reasonix CLI, and Reasonix app are represented distinctly

### Requirement: Host-specific devops tools
The repository SHALL manage Docker and Kubernetes tooling only for named host overrides.

#### Scenario: work-mac devops tools are applied
- **WHEN** package installation runs for `work-mac`
- **THEN** Docker is considered for installation and k3s or k3d is not installed

#### Scenario: linux-devbox devops tools are applied
- **WHEN** package installation runs for `linux-devbox`
- **THEN** Docker and native k3s are considered for installation

