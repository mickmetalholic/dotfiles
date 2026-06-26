## 1. Repository Metadata

- [x] 1.1 Add a root `.editorconfig` with repository editing defaults for shell, PowerShell, YAML, TOML, Markdown, Lua, KDL, JSON, and templates.
- [x] 1.2 Expand `.gitattributes` coverage for existing repository file types such as Lua, KDL, JSON, PowerShell modules, and templates.
- [x] 1.3 Expand `.gitignore` coverage for local caches, temporary paths, editor state, direnv/mise state, and other non-source local artifacts while preserving existing allowlists.
- [x] 1.4 Add repository-level tool-version or tool-constraint configuration for validation and maintenance tools where practical.

## 2. Validation Scripts

- [x] 2.1 Update PowerShell validation to discover POSIX scripts and POSIX script templates dynamically instead of using a hand-maintained file list.
- [x] 2.2 Ensure both POSIX and PowerShell validation entrypoints dynamically discover PowerShell scripts and templates.
- [x] 2.3 Add ShellCheck execution when available and a visible skipped warning when unavailable.
- [x] 2.4 Add PSScriptAnalyzer execution when available and a visible skipped warning when unavailable.
- [x] 2.5 Keep local validation read-only and avoid installing missing validation tools.

## 3. CI

- [x] 3.1 Add a GitHub Actions workflow that runs repository validation on a POSIX runner.
- [x] 3.2 Add a GitHub Actions workflow path or matrix entry that runs repository validation on a Windows runner.
- [x] 3.3 Provision CI-only validation tools needed for full analyzer coverage without changing local validation behavior.

## 4. Verification

- [x] 4.1 Run `openspec validate --all --strict`.
- [x] 4.2 Run POSIX validation from `scripts/validate.sh`.
- [x] 4.3 Run PowerShell validation from `scripts/validate.ps1` when `pwsh` is available, or record the skip when unavailable.
- [x] 4.4 Confirm the new change does not add contribution/development-process documentation and does not modify applied dotfile behavior.
