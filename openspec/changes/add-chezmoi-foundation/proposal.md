## Why

The repository needs a safe foundation before it can manage any machine state. Chezmoi should own home-directory projection while repository-level scripts, data, and docs stay outside the applied home tree.

## What Changes

- Add the initial dotfiles repository layout with `home/` as the chezmoi root.
- Add shared data files for defaults, hosts, and packages.
- Add first-version home templates for Git, shell startup, PowerShell, starship, mise, direnv, SSH config, editorconfig, and local `dot` shims.
- Keep the change limited to configuration files and templates; it does not install packages or mutate the host by itself.

## Non-goals

- Do not install software, run bootstrap, or apply chezmoi automatically.
- Do not add plaintext secrets or SSH private keys.
- Do not introduce role/profile layers beyond shared, OS, and host data.

## Capabilities

### New Capabilities

- `chezmoi-foundation`: Repository structure and chezmoi-managed home templates.

### Modified Capabilities

- None.

## Impact

- Adds repository files under `home/`, `data/`, and root-level chezmoi metadata.
- Establishes the path conventions used by later doctor, bootstrap, package, and documentation changes.
