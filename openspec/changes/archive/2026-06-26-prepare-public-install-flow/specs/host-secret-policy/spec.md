## ADDED Requirements

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
