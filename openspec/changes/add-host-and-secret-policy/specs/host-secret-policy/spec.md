## ADDED Requirements

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
