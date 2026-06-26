## Context

The repository currently has a small package baseline in `data/packages.yaml`, with POSIX and PowerShell scripts that hard-code package lists rather than fully consuming the declared data. Windows uses both `winget` and `scoop`, while macOS and Linux use Homebrew and apt where available. Host metadata exists, but package installation does not yet express host-specific developer tooling.

This change keeps the repository focused on reproducible development machines. The package layer may install software, but secrets, login state, browser state, caches, and broad personal app inventory remain outside the repository.

## Goals / Non-Goals

**Goals:**

- Make Windows package management use `winget` as the only managed Windows package manager.
- Expand the default developer baseline with CLI tools for shell productivity, file navigation, diffs, HTTP/API work, linting, formatting, and AI coding.
- Install HTTPie CLI and HTTPie Desktop as distinct managed tools.
- Manage `tlrc` as the tldr client.
- Remove Obsidian from managed GUI app lists.
- Add host-specific devops tooling: Docker for `work-mac`, Docker plus native k3s for `linux-devbox`.
- Keep package commands idempotent and safe to re-run.

**Non-Goals:**

- Do not make this repository a full personal software inventory.
- Do not install k3s, k3d, or Kubernetes tooling on macOS in this change.
- Do not add cloud-provider CLIs, Terraform, or broad DevOps suites to the default baseline.
- Do not store secrets, tokens, package credentials, or app login state.

## Decisions

### Windows uses winget only

Windows package installation will remove `scoop` from managed behavior and use `winget` for available packages. This reduces duplicate state and keeps one installation path for Windows developer machines.

Alternative considered: keep `scoop` for packages that are more convenient there. That keeps more packages available but preserves two package-manager states and complicates drift diagnosis.

### Official fallbacks are declared, not silently executed by default

Tools that are unavailable or unsuitable through the primary OS package manager will have explicit official fallback metadata or installer guidance. Package commands may report the fallback and, for low-risk installers with clear verification, can support explicit installation behavior. They must not silently execute arbitrary remote scripts without an intentional implementation decision and clear source.

Alternative considered: automatically download all official installers. That improves convenience but increases security and maintenance risk.

### Tool catalog separates baseline, GUI, AI, and host devops

The package data should represent categories such as CLI baseline, GUI development apps, AI coding tools, formatting/linting tools, and host-specific devops tools. These categories are still data under shared defaults, OS behavior, and direct host overrides; they are not roles or profiles.

Alternative considered: add role/profile layers such as `devops`, `personal`, or `work`. The repository explicitly avoids role/profile layers, so direct host overrides are simpler and easier to reason about.

### Host-specific devops stays direct

`work-mac` will manage Docker and no Kubernetes runtime. `linux-devbox` will manage Docker and native k3s. The implementation should make these choices visible in host data rather than inferring from host purpose strings.

Alternative considered: install Docker/k3s for every Linux/macOS host. That would make new machine setup heavier and violate the development-baseline boundary.

### HTTPie CLI and Desktop are distinct tools

HTTPie CLI and HTTPie Desktop should be declared independently because they have different installation channels, runtime behavior, and validation checks.

Alternative considered: manage only one HTTPie package name. That hides whether the command-line client, desktop app, or both are installed.

## Risks / Trade-offs

- Windows package IDs can change or differ between official and community manifests → verify package IDs during implementation and keep fallback guidance near each package declaration.
- Official fallback installers may be harder to automate safely → prefer clear manual/explicit fallback messaging over opaque remote execution.
- Expanded package lists make first-run setup slower → keep GUI and host-specific heavy tools explicit rather than defaulting them everywhere.
- Docker and k3s alter system services and networking → scope them to direct host overrides and make their installation behavior explicit in tasks and documentation.
- Tool categories could become hidden role layers → keep the schema tied to shared defaults, OS groups, and named host overrides only.

## Migration Plan

1. Update package and host data to express the new developer tool catalog, Windows `winget` entries, official fallbacks, GUI app changes, and host-specific devops choices.
2. Update POSIX and PowerShell package scripts to consume the revised data or faithfully mirror it while preserving idempotency.
3. Remove Windows `scoop` installation behavior and replace previous `scoop` packages with `winget` or official fallback handling.
4. Update validation and documentation to describe the development-focused scope and host-specific devops behavior.
5. Run repository validation and dry-run package paths where available.

Rollback is to restore the prior package declarations and package script behavior; no managed secrets or persisted app state are introduced by this change.

## Open Questions

- Which exact official installer path should be used for Codex app and Reasonix app on each OS if a primary package manager entry is unavailable?
- Should official fallback installers remain guidance-only in the first implementation, or should some be automated behind an explicit flag?
- Should Docker on macOS default to Docker Desktop, or should host data allow an alternate runtime such as Colima in a later change?
