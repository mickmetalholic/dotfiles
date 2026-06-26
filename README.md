# dotfiles

Personal dotfiles and machine health checks for `mickmetalholic`.

This repository has two jobs:

- Manage home-directory configuration with chezmoi.
- Inspect and bootstrap machines through a unified `dot` command.

## Install

After this repository is public, use the one-command install entrypoint for the target OS.

Windows:

```powershell
irm https://raw.githubusercontent.com/mickmetalholic/dotfiles/main/install.ps1 | iex
```

macOS/Linux:

```sh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/mickmetalholic/dotfiles/main/install.sh)"
```

The Windows install entrypoint installs `chezmoi` with `winget` when needed. The macOS/Linux install entrypoint installs `chezmoi` with Homebrew when available, otherwise it falls back to the official `get.chezmoi.io` installer into `~/.local/bin`.

The first run asks for the Git email used by managed Git config. For non-interactive setup, set `DOTFILES_EMAIL` before running the install command.

Before changing GitHub visibility to public, run:

```sh
dot public-readiness
dot validate
```

Review any metadata findings before changing repository visibility manually in GitHub settings.

## Daily Commands

```sh
dot doctor
dot bootstrap
dot apply
dot update
dot diff
dot edit
dot packages
dot public-readiness
dot runtime
dot validate
```

`dot doctor` and `dot public-readiness` are read-only. `dot bootstrap`, `dot packages`, and `dot runtime` may install or update local software.

## Layout

```text
data/       Shared defaults, host metadata, and package declarations.
home/       Chezmoi source root, projected into the user home directory.
scripts/    Testable command implementations used by dot and chezmoi hooks.
openspec/   Change proposals, specs, and implementation tasks.
```

Chezmoi is configured with `.chezmoiroot = home`, so repository metadata and orchestration scripts are not applied into `$HOME`. Chezmoi source-root files such as `.chezmoi.toml.tmpl`, `.chezmoiignore.tmpl`, and `run_*` hooks live under `home/` because that directory is the source state root.

## Configuration Model

Use only three layers:

- shared defaults
- OS-specific behavior
- direct host overrides

Do not add role/profile layers. If a single machine needs special behavior, put it directly in host data.

Set `DOTFILES_HOST` before `chezmoi init` to force a host profile when the OS hostname is not the desired key. Set `DOTFILES_EMAIL` to provide the Git email non-interactively.

## Secrets

Allowed in this repository:

- SSH config
- Git `includeIf` rules
- encrypted small files when they truly need to sync
- references to secret-manager paths

Forbidden in this repository:

- plaintext tokens
- SSH private keys
- API keys
- cookies
- plaintext `.env` files
- browser state
- shell history
- caches
- company secrets

Use 1Password or Bitwarden for real secrets. Use age only for small encrypted files that must travel with the dotfiles repository.

## Validation

```sh
dot validate
```

`dot validate` runs strict OpenSpec validation and script syntax checks. On hosts without PowerShell, it reports the PowerShell syntax check as skipped instead of hiding the gap.
