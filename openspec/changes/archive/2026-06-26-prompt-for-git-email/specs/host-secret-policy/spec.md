## ADDED Requirements

### Requirement: Repository-tracked email defaults
The repository SHALL NOT store concrete per-user Git email defaults in host data or chezmoi config templates.

#### Scenario: Public-readiness scans email defaults
- **WHEN** public-readiness scans repository-managed host data and templates
- **THEN** it does not find concrete Git email defaults that are intended to identify the user

#### Scenario: Non-interactive email override is documented
- **WHEN** a user needs non-interactive setup
- **THEN** documentation points them to `DOTFILES_EMAIL` instead of repository-tracked email defaults
