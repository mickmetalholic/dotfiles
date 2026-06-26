## Why

Git email is user-specific metadata and should not be stored as host data in a public dotfiles repository. Moving email collection to initialization keeps the repository generic while still letting Git templates render correctly on each machine.

## What Changes

- Prompt for Git email during chezmoi initialization and store it in local chezmoi config.
- Keep `DOTFILES_EMAIL` as a non-interactive override for scripted installs.
- Remove concrete email values from repository-tracked host data and chezmoi config templates.
- Update public-readiness behavior so repository-tracked email defaults are no longer expected.

## Non-goals

- Do not add prompts for name, editor, terminal, host profile, or other values in this change.
- Do not introduce secret-manager integration.
- Do not remove host selection or OS-specific behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chezmoi-foundation`: Chezmoi initialization collects Git email locally instead of using repository-tracked email defaults.
- `host-secret-policy`: Email addresses should not be stored as concrete per-host defaults in repository-managed data.

## Impact

- Affects `home/.chezmoi.toml.tmpl`, host/default data, and any validation/public-readiness expectations around email.
- May affect first-run install behavior by introducing an interactive prompt unless `DOTFILES_EMAIL` is set.
- The change writes the email only to local chezmoi configuration generated from the template, not back to the repository.
