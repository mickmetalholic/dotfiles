## Context

The doctor workflow must be safe to run on any machine. It should report state and recommended fixes without installing tools, changing authentication, or applying dotfiles.

## Goals / Non-Goals

**Goals:**

- Provide `dot doctor` on Windows and POSIX shells.
- Check system, tools, chezmoi, package managers, runtime, shell helpers, auth, editor/terminal availability, and security risks.
- Use consistent status output and fix hints.

**Non-Goals:**

- Repairing missing tools directly.
- Treating optional GUI applications as hard failures.

## Decisions

- Implement platform-native doctor scripts (`doctor.ps1` and `doctor.sh`) with small shared helpers, because shell-specific command detection and process invocation are clearer than a single cross-shell script.
- Keep doctor read-only by using detection commands such as `Get-Command`, `command -v`, `git status`, `chezmoi diff`, and `gh auth status`.
- Security checks scan repository-managed paths for risky patterns and private-key filenames. This is not a secret scanner replacement, but it catches common mistakes before adoption.

## Risks / Trade-offs

- [Risk] Auth checks can fail because of network or service state -> Mitigation: report warnings with fix hints rather than failing the entire run.
- [Risk] Security pattern checks can produce false positives -> Mitigation: scope checks to likely secret file names and token-like strings.
