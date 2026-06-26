## ADDED Requirements

### Requirement: Chezmoi home root
The repository SHALL configure chezmoi to project only the `home/` tree into the user home directory.

#### Scenario: Repository metadata is not applied
- **WHEN** chezmoi reads the source directory
- **THEN** files outside `home/` are not treated as home-directory targets

### Requirement: First-version managed files
The repository SHALL include initial managed templates for Git, shell startup, PowerShell, starship, mise, direnv, SSH config, editorconfig, and local `dot` command shims.

#### Scenario: User inspects managed scope
- **WHEN** the repository files are listed
- **THEN** the first-version configuration files are present under `home/`

### Requirement: Shared data files
The repository SHALL include defaults, hosts, and packages data files that later scripts can consume.

#### Scenario: Scripts need configuration data
- **WHEN** scripts look for repository data
- **THEN** `data/defaults.yaml`, `data/hosts.yaml`, and `data/packages.yaml` exist
