## MODIFIED Requirements

### Requirement: Conservative bootstrap
`dot bootstrap` SHALL install foundational tooling, apply dotfiles, and delegate package installation through explicit, idempotent steps that respect GUI and host-specific package settings.

#### Scenario: Bootstrap runs without GUI flag
- **WHEN** the user runs `dot bootstrap`
- **THEN** GUI applications are not installed by default

#### Scenario: Bootstrap runs on a host with devops overrides
- **WHEN** bootstrap or package hooks apply package installation for a host with direct devops overrides
- **THEN** only the devops tools declared for that host are considered for installation

### Requirement: Explicit stronger behavior
Bootstrap SHALL require explicit flags for GUI installation and forceful overwrite behavior, and SHALL NOT treat host-specific heavyweight tools as global defaults.

#### Scenario: User allows GUI apps
- **WHEN** bootstrap receives `--gui`
- **THEN** GUI package groups may be installed according to host settings

#### Scenario: Host-specific heavyweight tools are absent
- **WHEN** bootstrap runs on a host without Docker or k3s overrides
- **THEN** Docker and k3s are not installed as part of the default bootstrap behavior
