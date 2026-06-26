## Context

Bootstrap is the first command a new machine may run from a raw install URL. It therefore needs conservative behavior, clear flags, and idempotent steps that can resume after partial setup.

## Goals / Non-Goals

**Goals:**

- Provide `install.sh` and `install.ps1` remote entrypoints.
- Provide `dot bootstrap` for Windows, macOS, and Linux.
- Install or guide installation of chezmoi, package managers, core CLI tools, mise, and then run doctor.

**Non-Goals:**

- Silent overwrites of existing user config.
- GUI app installs unless `--gui` is supplied.
- Secret retrieval or credential storage.

## Decisions

- Install scripts focus on getting chezmoi and the repository initialized, then delegate to `scripts/bootstrap.*`. This keeps remote entrypoints small and auditable.
- Bootstrap accepts `--gui` and `--force` but defaults to minimal CLI/runtime setup.
- Windows uses winget as the primary installer and scoop as optional CLI supplement. POSIX shells use Homebrew when available and apt on Debian-like Linux.

## Risks / Trade-offs

- [Risk] Package managers differ across hosts -> Mitigation: detect available managers and print skipped steps when unsupported.
- [Risk] Remote install scripts are sensitive -> Mitigation: keep them short, fail fast, and delegate to versioned repository scripts.
