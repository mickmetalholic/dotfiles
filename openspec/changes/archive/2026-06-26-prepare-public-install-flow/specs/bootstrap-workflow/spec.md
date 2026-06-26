## ADDED Requirements

### Requirement: Public one-command install
The repository SHALL support a public install path that does not require GitHub authentication when the repository is public.

#### Scenario: POSIX public install
- **WHEN** a user runs the documented POSIX raw-file install command against a public repository
- **THEN** the install script initializes the dotfiles without requiring `gh auth login`

#### Scenario: Windows public install
- **WHEN** a user runs the documented Windows raw-file install command against a public repository
- **THEN** the install script initializes the dotfiles without requiring `gh auth login`
