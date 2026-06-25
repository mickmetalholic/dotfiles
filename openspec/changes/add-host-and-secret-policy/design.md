## Context

The repository must adapt to multiple machines while remaining safe for a private but syncable repo. Host-specific behavior belongs in data and templates; real secrets belong outside the repository.

## Goals / Non-Goals

**Goals:**

- Model shared defaults, OS behavior, and direct host overrides.
- Include initial host examples and current Windows host settings.
- Add templates and doctor checks that reinforce secret safety.

**Non-Goals:**

- Automated secret retrieval.
- Role/profile abstraction layers.
- Storing real secrets, keys, cookies, or company-confidential files.

## Decisions

- Host data is explicit in `data/hosts.yaml`; users choose a host by hostname or `DOTFILES_HOST`.
- Templates use host data for Git email, shell, terminal, and GUI preferences.
- Secret policy is enforced through documentation, `.gitignore`, `.chezmoiignore.tmpl`, and doctor warnings rather than relying on one mechanism.

## Risks / Trade-offs

- [Risk] Private repos can still leak data accidentally -> Mitigation: layered ignore rules, documentation, and doctor checks.
- [Risk] Host detection can be wrong after renames -> Mitigation: support explicit host override through environment variables.
