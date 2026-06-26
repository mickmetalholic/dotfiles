## 1. Email Initialization

- [x] 1.1 Update `.chezmoi.toml.tmpl` to derive a single `email` value from `DOTFILES_EMAIL` or a one-time chezmoi prompt.
- [x] 1.2 Remove concrete email values from host-specific branches in `.chezmoi.toml.tmpl`.
- [x] 1.3 Remove `email` fields from `data/hosts.yaml`.
- [x] 1.4 Ensure Git config templates continue to use the local `.email` value.

## 2. Documentation and Public-readiness

- [x] 2.1 Document `DOTFILES_EMAIL` as the non-interactive install override.
- [x] 2.2 Verify public-readiness no longer reports repository-tracked concrete email defaults after implementation.
- [x] 2.3 Keep public-readiness review coverage for host names and work/personal markers.

## 3. Validation

- [x] 3.1 Run `dot validate`.
- [x] 3.2 Run `dot public-readiness` and record remaining review findings.
- [x] 3.3 Run `openspec validate --all --strict`.
- [x] 3.4 Run a targeted chezmoi template check or explain why it cannot be run on this host.
