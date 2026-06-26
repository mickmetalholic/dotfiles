# host-secret-policy Specification

## Purpose
TBD - created by archiving change add-host-and-secret-policy. Update Purpose after archive.
## Requirements
### Requirement: Three-layer configuration
The repository SHALL model configuration as shared defaults, OS-specific behavior, and direct host overrides.

#### Scenario: Host has an override
- **WHEN** a host defines a value that also exists in defaults
- **THEN** templates use the host value for that host

### Requirement: Explicit secret boundary
The repository SHALL forbid plaintext tokens, SSH private keys, API keys, cookies, `.env` files, browser state, history, caches, and company secrets.

#### Scenario: Forbidden secret path appears
- **WHEN** a forbidden secret-like file is added under managed paths
- **THEN** ignore rules or doctor checks identify it as unsafe for the repository

### Requirement: Secret manager guidance
The repository SHALL document that real secrets live in 1Password or Bitwarden, with age reserved only for small encrypted files that must sync.

#### Scenario: User needs a secret in a template
- **WHEN** documentation describes secret handling
- **THEN** it points to a secret manager reference rather than plaintext repository storage

### Requirement: Public-readiness review
The repository SHALL provide a repeatable review path before changing repository visibility to public.

#### Scenario: Public-readiness check runs
- **WHEN** the public-readiness check runs
- **THEN** it scans repository-managed data, templates, scripts, and docs for forbidden secret material and review-required public metadata

#### Scenario: Forbidden material is found
- **WHEN** public-readiness detects plaintext tokens, private keys, `.env` files, cookies, browser state, history, caches, or company secrets
- **THEN** it reports the finding as unsafe to publish

#### Scenario: Review-required metadata is found
- **WHEN** public-readiness detects hostnames, email addresses, internal-looking domains, SSH aliases, or other personal metadata
- **THEN** it reports the finding for manual review before visibility changes

### Requirement: Visibility change remains manual
The repository SHALL NOT change GitHub repository visibility from local install, doctor, validation, or public-readiness commands.

#### Scenario: Public-readiness passes
- **WHEN** public-readiness completes without unsafe findings
- **THEN** it instructs the user to change repository visibility manually if they choose to proceed

### Requirement: Repository-tracked email defaults
The repository SHALL NOT store concrete per-user Git email defaults in host data or chezmoi config templates.

#### Scenario: Public-readiness scans email defaults
- **WHEN** public-readiness scans repository-managed host data and templates
- **THEN** it does not find concrete Git email defaults that are intended to identify the user

#### Scenario: Non-interactive email override is documented
- **WHEN** a user needs non-interactive setup
- **THEN** documentation points them to `DOTFILES_EMAIL` instead of repository-tracked email defaults

