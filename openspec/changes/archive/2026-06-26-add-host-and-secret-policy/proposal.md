## Why

Personal dotfiles need host-specific behavior without leaking secrets or multiplying abstraction layers. The repository should make host overrides explicit and make unsafe secret storage difficult.

## What Changes

- Define shared defaults, OS-specific behavior, and direct host overrides.
- Add host data for the initial Windows desktop plus representative macOS/Linux examples.
- Add SSH and Git include templates that can vary by host and purpose.
- Add security checks for plaintext tokens, private keys, cookies, `.env` files, and sensitive browser/history/cache state.
- Document 1Password/Bitwarden and age usage boundaries.

## Non-goals

- Do not commit real company settings, credentials, or personal private keys.
- Do not add a role/profile layer.
- Do not automate secret retrieval in the first version.

## Capabilities

### New Capabilities

- `host-secret-policy`: Host overrides and repository secret safety rules.

### Modified Capabilities

- None.

## Impact

- Adds host and security conventions to data files, templates, doctor checks, and documentation.
- Strengthens the repository's safety boundary before real machine adoption.
