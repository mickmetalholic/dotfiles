## Context

After foundation, doctor, bootstrap, packages, and host policy exist, the daily interface should feel coherent. Users should not need to remember which underlying script implements each operation.

## Goals / Non-Goals

**Goals:**

- Expose `doctor`, `bootstrap`, `apply`, `update`, `diff`, `edit`, `packages`, and `runtime`.
- Provide help output and consistent logging.
- Document install, daily usage, layout, validation, and safety boundaries.

**Non-Goals:**

- Building an interactive TUI.
- Replacing chezmoi or mise commands entirely.

## Decisions

- `dot` remains a thin dispatcher, because the implementation should stay testable through individual scripts.
- Help output is generated in both PowerShell and POSIX wrappers rather than from a separate dependency.
- Documentation stays in README for first version, with room to split into docs files later if it grows.

## Risks / Trade-offs

- [Risk] Wrapper behavior can drift between PowerShell and POSIX -> Mitigation: keep commands minimal and validate both parser paths.
- [Risk] README can become too long -> Mitigation: focus on first-run, daily workflow, and safety policy only.
