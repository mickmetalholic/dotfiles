## Why

The repository should be pleasant for daily use, not just installable once. A polished command surface and concise documentation make routine updates, diffs, edits, and validation predictable.

## What Changes

- Complete the unified `dot` command surface: `doctor`, `bootstrap`, `apply`, `update`, `diff`, `edit`, `packages`, and `runtime`.
- Add help output, consistent logging, and dry-run-friendly behavior where commands can support it.
- Add README documentation for new-machine setup, daily workflow, secrets policy, and repository layout.
- Add validation guidance for OpenSpec and script syntax checks.

## Non-goals

- Do not build a full interactive TUI.
- Do not add unrelated editor or terminal customizations beyond the first-version scope.
- Do not archive OpenSpec changes until implementation is validated.

## Capabilities

### New Capabilities

- `dot-command-docs`: Unified command UX and user-facing documentation.

### Modified Capabilities

- None.

## Impact

- Updates shell and PowerShell command wrappers and root documentation.
- Improves daily usability without changing the underlying security model.
