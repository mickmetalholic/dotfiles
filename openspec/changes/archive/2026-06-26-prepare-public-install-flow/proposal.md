## Why

The current setup still assumes a private repository and GitHub authentication before a new machine can install the dotfiles. If the repository is made public, the first-run experience can become a single copy/paste install command, but only after repository-managed content is checked for public-safe data.

## What Changes

- Audit repository-managed data, templates, and docs for material that should not be exposed in a public repository.
- Update installation docs to make public raw-file install commands the primary path.
- Ensure install scripts default to the public GitHub repository URL and do not require `gh` for the default flow.
- Add validation checks or documented review steps for public-readiness before changing GitHub repository visibility.

## Non-goals

- Do not change the GitHub repository visibility from code; that remains a manual repository setting.
- Do not remove useful personal dotfiles solely because they are personal preferences.
- Do not add secret-manager integration or move real secrets into the repository.
- Do not redesign bootstrap/package/runtime behavior beyond the public install path.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `bootstrap-workflow`: Public install entrypoints become the default documented setup path and must not require `gh` for public repositories.
- `host-secret-policy`: Public-readiness review covers host data, templates, docs, and managed files for sensitive values before visibility changes.
- `dot-command-docs`: README installation guidance presents one-command public install without private/fork fallback instructions.

## Impact

- Affects README install and validation sections.
- Affects install script defaults only if current defaults still imply private/authenticated access.
- Adds or strengthens repository safety checks for public-readiness.
- The change is mostly read-only validation and documentation, except for any edits needed to remove or generalize public-unsafe repository content.
