# dotfiles

Private dotfiles and machine health checks for `mickmetalholic`.

This repository has two jobs:

- Manage home-directory configuration with chezmoi.
- Inspect and bootstrap machines through a unified `dot` command.

## Install

Recommended private-repo flow:

```powershell
gh auth login
winget install --id twpayne.chezmoi --exact
chezmoi init --apply https://github.com/mickmetalholic/dotfiles.git
dot doctor
```

If you already have an authenticated way to fetch private raw files, the install entrypoints are:

Windows:

```powershell
irm https://raw.githubusercontent.com/mickmetalholic/dotfiles/main/install.ps1 | iex
```

macOS/Linux:

```sh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/mickmetalholic/dotfiles/main/install.sh)"
```

Because this repository is private, a new machine needs GitHub access through `gh auth login`, Git credential manager, SSH, or an authenticated raw-file request before install scripts can clone or fetch repository content.

## Daily Commands

```sh
dot doctor
dot bootstrap
dot apply
dot update
dot diff
dot edit
dot packages
dot runtime
```

`dot doctor` is read-only. `dot bootstrap`, `dot packages`, and `dot runtime` may install or update local software.

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

Set `DOTFILES_HOST` before `chezmoi init` to force a host profile when the OS hostname is not the desired key. Set `DOTFILES_EMAIL` to override the Git email used by templates.

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
openspec validate --strict
pwsh -NoProfile -Command "Get-ChildItem scripts -Filter *.ps1 -Recurse | ForEach-Object { [scriptblock]::Create((Get-Content -Raw $_.FullName)) > $null }"
sh -n install.sh scripts/*.sh scripts/lib/*.sh
```
