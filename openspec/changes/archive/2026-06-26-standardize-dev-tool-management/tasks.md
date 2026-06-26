## 1. Package Data Model

- [x] 1.1 Update `data/packages.yaml` to remove Windows `scoop` entries and represent Windows packages through `winget` or declared official fallbacks.
- [x] 1.2 Add managed developer baseline tools including `eza`, `zoxide`, HTTPie CLI, `bat`, `tlrc`, `git-delta`, `lazygit`, `just`, `yq`, `shellcheck`, `shfmt`, and supported config-format tooling.
- [x] 1.3 Add GUI development app declarations for supported editor, terminal, HTTPie Desktop, Cursor, Codex app, and Reasonix app entries while removing Obsidian.
- [x] 1.4 Add AI coding tool declarations that distinguish Codex CLI, Codex app, Reasonix CLI, and Reasonix app.
- [x] 1.5 Add direct host package overrides so `work-mac` manages Docker only and `linux-devbox` manages Docker plus native k3s.

## 2. Package Installation Scripts

- [x] 2.1 Update PowerShell package installation to use `winget` only on Windows and stop warning about or invoking `scoop`.
- [x] 2.2 Add POSIX package installation support for the expanded macOS and Linux developer tool lists.
- [x] 2.3 Add official fallback handling or actionable fallback messages for tools that are unavailable through the primary OS package manager.
- [x] 2.4 Ensure HTTPie CLI and HTTPie Desktop are handled as separate install targets.
- [x] 2.5 Ensure host-specific Docker and k3s selections are applied only for the named host overrides.

## 3. Bootstrap, Hooks, and Documentation

- [x] 3.1 Ensure bootstrap/package hooks continue delegating package work to repository scripts and respect GUI flags.
- [x] 3.2 Update README or command documentation to describe the development-focused software scope and Windows `winget` standardization.
- [x] 3.3 Document that Obsidian and general personal applications are outside the managed development environment.
- [x] 3.4 Document host-specific Docker and k3s behavior for `work-mac` and `linux-devbox`.

## 4. Validation

- [x] 4.1 Run OpenSpec validation for `standardize-dev-tool-management` and fix any proposal/spec/task issues.
- [x] 4.2 Run repository validation through `dot validate`.
- [x] 4.3 Run POSIX shell syntax checks for changed shell scripts.
- [x] 4.4 Run PowerShell syntax checks for changed PowerShell scripts when PowerShell is available.
- [x] 4.5 Run package command dry-runs where available to verify the expanded package selections without installing software.
