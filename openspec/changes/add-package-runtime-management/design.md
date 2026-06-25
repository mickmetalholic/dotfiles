## Context

Package installation and runtime installation are related but owned by different tools. System package managers provide CLIs and GUI apps; mise owns language/runtime versions.

## Goals / Non-Goals

**Goals:**

- Declare packages and runtimes in `data/packages.yaml`.
- Provide `dot packages` and `dot runtime`.
- Delegate chezmoi `run_onchange_*` hooks to scripts.

**Non-Goals:**

- Full package-name parity across every OS.
- Language-specific version managers outside mise.

## Decisions

- Keep package data grouped by `shared`, `darwin`, `linux`, and `windows`, because this mirrors how the installers are selected.
- Use PowerShell for Windows package orchestration and POSIX shell for macOS/Linux package orchestration.
- Chezmoi run hooks call `scripts/packages.*` and `scripts/runtime.*` instead of embedding package logic, making the scripts independently runnable and testable.

## Risks / Trade-offs

- [Risk] Some package IDs may drift over time -> Mitigation: doctor and packages scripts report skipped or failed packages clearly.
- [Risk] YAML parsing in shell is limited -> Mitigation: use simple package data and conservative line extraction in first version, leaving structured parser integration as a later improvement.
