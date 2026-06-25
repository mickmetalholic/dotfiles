## Context

The repository starts empty apart from OpenSpec. The first implementation must define where managed files live, which data files drive templates, and how users reach the command surface without applying unrelated repository files into the home directory.

## Goals / Non-Goals

**Goals:**

- Use `home/` as the chezmoi root via `.chezmoiroot`.
- Keep data and orchestration scripts at repository root.
- Provide first-version templates for Git, shells, starship, mise, direnv, SSH config, and local command shims.

**Non-Goals:**

- Installing software or applying chezmoi automatically.
- Managing secrets, browser state, caches, or history.

## Decisions

- Chezmoi root is `home/`, because it cleanly separates managed home files from repository metadata and scripts. Alternative considered: root as chezmoi source, but that would require broad ignore rules and make repository scripts easier to project accidentally.
- Data lives in `data/*.yaml`, because simple YAML is readable by humans and can be consumed by scripts later. Alternative considered: TOML only, but package lists are easier to scan as YAML.
- Windows and POSIX command shims both live under `home/dot_local/bin`, so `dot` can be made available consistently after chezmoi apply. Windows also receives a PowerShell profile template that adds the local bin path.

## Risks / Trade-offs

- [Risk] Template variables may be missing on first apply -> Mitigation: provide conservative defaults and host examples.
- [Risk] Chezmoi-managed SSH config may be mistaken for secret storage -> Mitigation: templates only include public routing metadata and comments forbidding private keys.
