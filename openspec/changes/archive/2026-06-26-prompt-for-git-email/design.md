## Context

Git config templates require an email address, but storing concrete email defaults in `data/hosts.yaml` and `.chezmoi.toml.tmpl` creates public metadata that should not live in the repository. Chezmoi supports prompting once during initialization and persisting answers into local config, which fits this use case.

## Goals / Non-Goals

**Goals:**

- Prompt for Git email during initialization when `DOTFILES_EMAIL` is not provided.
- Store the selected email only in local chezmoi config generated from `.chezmoi.toml.tmpl`.
- Remove concrete email values from repository-tracked host data and template defaults.
- Keep non-interactive install support through `DOTFILES_EMAIL`.

**Non-Goals:**

- Do not prompt for name, editor, terminal, host selection, or other values.
- Do not change Git include rules or host profile names.
- Do not add secret-manager support.

## Decisions

1. Use `promptStringOnce` for interactive email collection.

   Chezmoi's prompt-once behavior stores the answer locally and avoids repeated prompts during later applies. This keeps the repository generic while preserving normal Git template rendering.

   Alternative considered: rely only on `DOTFILES_EMAIL`. That works for scripted installs but is poor UX for one-command public setup.

2. Keep `DOTFILES_EMAIL` as the first source of truth.

   If `DOTFILES_EMAIL` is set, initialization should use it without prompting. This keeps automation and CI-style setup possible.

   Alternative considered: always prompt. That would break non-interactive installs.

3. Remove email from host data.

   Host data should keep OS and behavior decisions, not personal email defaults. The email should be local user data instead of direct host override data.

   Alternative considered: replace real-looking values with `example.com` placeholders. That still preserves an unnecessary repository field and keeps public-readiness warnings noisy.

## Risks / Trade-offs

- Non-interactive public install can block waiting for prompt input. Mitigation: document `DOTFILES_EMAIL` as the non-interactive override.
- Existing machines may keep old email in their local chezmoi config. Mitigation: the change affects new initialization; existing users can update local config or set `DOTFILES_EMAIL` when reinitializing.
- Chezmoi template syntax must be validated carefully because `.chezmoi.toml.tmpl` is rendered before normal managed files. Mitigation: run `dot validate` and a targeted template/render check if available.

## Migration Plan

Remove email keys from repository host data and replace all hard-coded email defaults in `.chezmoi.toml.tmpl` with one local value derived from `DOTFILES_EMAIL` or `promptStringOnce`. Update README with the non-interactive override.

Rollback is to restore repository-tracked email defaults, but that should be avoided for public-readiness.

## Open Questions

- Should a later change also prompt for Git user name, or keep the public repository's current `name` default?
