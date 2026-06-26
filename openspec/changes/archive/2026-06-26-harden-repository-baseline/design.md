## Context

The repository has a unified validation command and good initial line-ending and ignore rules, but the safeguards are mostly local. There is no CI workflow to run validation on both POSIX and Windows, no root `.editorconfig`, no static-analysis path, and the Windows validation script has a manually maintained POSIX script list that can drift from the repository contents.

This change is infrastructure-only. It should make repository maintenance more predictable without changing package behavior, host data, or files applied into a user home directory.

## Goals / Non-Goals

**Goals:**

- Run repository validation automatically in CI on POSIX and Windows runners.
- Keep local validation read-only and deterministic.
- Make validation file discovery symmetric across POSIX and PowerShell entrypoints.
- Add repository-level editor, attributes, ignore, and optional tool-version baseline configuration.
- Add static-analysis hooks that run when analyzers are available and are visible when skipped.

**Non-Goals:**

- Do not add contribution or development-process documentation.
- Do not alter bootstrap, doctor, package, runtime, or chezmoi application behavior.
- Do not store secrets, machine-local state, or host-specific configuration.
- Do not install missing validation tooling from local validation scripts.

## Decisions

1. Use CI as the enforcement boundary.

   CI should run `dot validate` or the underlying validation scripts on macOS/Linux and Windows. CI may install validation-only tools such as PowerShell on POSIX or ShellCheck on runner images if needed, but the local scripts should continue to report missing optional tools instead of mutating the machine.

   Alternative considered: keep validation entirely local. That preserves the current gap where PowerShell checks can be skipped on POSIX machines and regressions only surface when someone remembers to run the right host.

2. Discover validation inputs dynamically.

   PowerShell validation should collect POSIX shell files and templates using `Get-ChildItem` rather than a hard-coded list. This matches the POSIX script's glob-based behavior and reduces maintenance when new scripts are added.

   Alternative considered: update the hard-coded list each time. That is simple for the current file count but creates a recurring drift risk.

3. Treat static analyzers as optional locally and enforceable in CI.

   Local validation should run ShellCheck and PSScriptAnalyzer when present and print a visible skipped warning otherwise. CI can provision those tools so analyzer regressions are caught consistently without requiring every local host to have the same setup.

   Alternative considered: fail local validation when analyzers are missing. That would make early bootstrap and minimal hosts harder to use.

4. Keep repository baseline files separate from managed home files.

   Root `.editorconfig`, `.gitattributes`, `.gitignore`, and optional dev-tool version files apply to repository maintenance. They should not replace or depend on the chezmoi-managed `home/` configuration files.

   Alternative considered: rely on `home/dot_editorconfig` only. That config is intended for projection into `$HOME`, not necessarily for editing this repository before chezmoi is applied.

## Risks / Trade-offs

- CI can fail due to external tool installation changes -> Keep the workflow minimal and prefer tools already available on runners where possible.
- Optional local analyzer skips can hide issues before push -> CI should install analyzers and run the same validation path with full coverage.
- Dynamic file discovery can include unsupported templates -> Use narrow patterns for script files and script templates only.
- More repository metadata can feel noisy -> Keep additions limited to files that directly improve validation, editor consistency, or accidental-commit prevention.

## Migration Plan

Implement repository metadata first, then update validation discovery and optional analyzer checks, then add CI. Run `dot validate` locally and verify the CI workflow commands are runnable on the intended platforms.

Rollback is straightforward: remove the CI workflow and repository baseline files, then restore the previous validation scripts. No user machine state or applied dotfiles need migration.

## Open Questions

- Should CI run on every push, every pull request, or both?
- Should ShellCheck/PSScriptAnalyzer failures be blocking in CI from the first implementation, or introduced as a warning-only phase first?
