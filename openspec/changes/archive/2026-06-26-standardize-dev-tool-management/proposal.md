## Why

The package management layer is currently split across package managers and only covers a small baseline, which makes new-machine setup less predictable across Windows, macOS, and Linux. The repository should standardize developer tooling as a reproducible dev environment while keeping non-development personal software out of scope.

## What Changes

- Standardize Windows package installation on `winget` and remove `scoop` as a managed Windows package manager.
- Add official-source fallback handling for developer tools that are unavailable or unsuitable through the primary OS package manager.
- Expand the managed developer tool baseline with modern CLI tools for navigation, search, diffs, HTTP/API work, shell productivity, formatting, linting, and AI coding workflows.
- Install both HTTPie CLI and HTTPie Desktop where applicable.
- Use `tlrc` as the managed tldr client instead of a generic `tldr` package.
- Remove Obsidian from managed GUI applications because the repository should focus on development environment setup.
- Add host-specific devops tooling so `work-mac` manages Docker only, while `linux-devbox` manages Docker and native k3s.
- Keep GUI and heavyweight devops tools explicit and host-scoped rather than part of every machine baseline.

## Non-goals

- Do not manage every personal application installed on a machine.
- Do not manage secrets, browser state, application login state, or per-app caches.
- Do not install k3s, k3d, or Kubernetes tooling on macOS as part of this change.
- Do not add cloud-provider CLIs, Terraform, or other broad DevOps suites unless they are directly requested for a host.
- Do not make `dot doctor` install missing tools; package installation remains under bootstrap/package commands.

## Capabilities

### New Capabilities

- `developer-tool-catalog`: Defines the repository's managed development-tool categories, package-manager preference, official fallback behavior, GUI handling, and host-specific devops tooling.

### Modified Capabilities

- `package-runtime-management`: Package declarations and package commands gain Windows `winget` standardization, expanded developer tool coverage, removal of Windows `scoop`, and host-specific package groups.
- `bootstrap-workflow`: Bootstrap/package workflows may install expanded developer tools and host-specific devops tooling as explicit machine setup behavior.

## Impact

- Affects `data/packages.yaml` and host metadata for tool grouping, OS package declarations, GUI packages, official fallbacks, and host-specific devops choices.
- Affects POSIX and PowerShell package scripts, especially Windows installation paths and fallback messaging.
- Affects bootstrap/package hooks because package data changes will trigger broader package installation.
- Affects README or command documentation to explain development-focused scope, Windows `winget` standardization, and optional host-specific devops tooling.
- This change affects system state when `dot bootstrap`, `dot packages`, or chezmoi package hooks run. It is not read-only.
