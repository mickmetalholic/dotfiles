#!/usr/bin/env sh
set -eu

DOTFILES_ROOT="${DOTFILES_ROOT:-$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)}"
. "$DOTFILES_ROOT/scripts/lib/output.sh"
. "$DOTFILES_ROOT/scripts/lib/detect.sh"
. "$DOTFILES_ROOT/scripts/lib/checks.sh"

dot_section "System"
dot_status ok os "$(dot_os)"
dot_status ok host "$(hostname 2>/dev/null || printf unknown)"
dot_status ok arch "$(dot_arch)"
dot_status ok user "${USER:-unknown}"
dot_status ok shell "${SHELL:-unknown}"

dot_section "Core Tools"
dot_check_command git "dot bootstrap"
dot_check_command gh "dot bootstrap"
dot_check_command ssh "install OpenSSH"
dot_check_command curl "dot bootstrap"
dot_check_command unzip "dot bootstrap"
dot_check_command jq "dot packages"
dot_check_command rg "dot packages"
dot_check_command fd "dot packages"
dot_check_command fzf "dot packages"

dot_section "Config"
dot_check_command chezmoi "dot bootstrap"
if dot_has git; then
  if git -C "$DOTFILES_ROOT" diff --quiet && git -C "$DOTFILES_ROOT" diff --cached --quiet; then
    dot_status ok "dotfiles repo" "clean"
  else
    dot_status warn "dotfiles repo" "has local changes"
    dot_fix "review git diff in $DOTFILES_ROOT"
  fi
fi
if dot_has chezmoi; then
  if chezmoi diff >/tmp/dotfiles-chezmoi-diff.$$ 2>/dev/null && [ ! -s /tmp/dotfiles-chezmoi-diff.$$ ]; then
    dot_status ok "chezmoi diff" "clean"
  else
    dot_status warn "chezmoi diff" "pending changes or unavailable"
    dot_fix "run dot diff"
  fi
  rm -f /tmp/dotfiles-chezmoi-diff.$$
fi

dot_section "Package Managers"
dot_check_optional_command brew
dot_check_optional_command apt-get
dot_check_optional_command dnf
dot_check_optional_command pacman
dot_check_optional_command winget

dot_section "Runtime"
dot_check_command mise "dot bootstrap"
dot_check_optional_command node
dot_check_optional_command pnpm
dot_check_optional_command uv
dot_check_optional_command python
dot_check_optional_command bun
dot_check_optional_command go
dot_check_optional_command rustc

dot_section "Shell"
dot_check_optional_command zsh
dot_check_optional_command pwsh
dot_check_optional_command starship
dot_check_optional_command zoxide
dot_check_optional_command direnv

dot_section "Developer CLI"
dot_check_optional_command eza
dot_check_optional_command bat
dot_check_optional_command delta
dot_check_optional_command lazygit
dot_check_optional_command just
dot_check_optional_command yq
dot_check_optional_command shellcheck
dot_check_optional_command shfmt
dot_check_optional_command http

dot_section "Auth"
if dot_has gh; then
  if gh auth status >/dev/null 2>&1; then
    dot_status ok "gh auth" "authenticated"
  else
    dot_status warn "gh auth" "not authenticated"
    dot_fix "gh auth login"
  fi
fi
if dot_has ssh; then
  if ssh -T git@github.com >/dev/null 2>&1; then
    dot_status ok "github ssh" "authenticated"
  else
    dot_status warn "github ssh" "failed or not configured"
    dot_fix "ssh-add ~/.ssh/id_ed25519"
  fi
fi
dot_check_optional_command op
dot_check_optional_command bw

dot_section "Editor / Terminal"
dot_check_optional_command nvim
dot_check_optional_command code
dot_check_optional_command cursor
dot_check_optional_command wezterm
dot_check_optional_command ghostty

dot_section "Security"
secret_paths="$(find "$DOTFILES_ROOT/home" -type f \( -name '.env' -o -name '.env.*' -o -name '*.pem' -o -name '*.key' -o -name 'id_*' -o -name '*cookies*' -o -name '*history*' \) 2>/dev/null || true)"
if [ -n "$secret_paths" ]; then
  dot_status warn "managed secrets" "suspicious file paths found"
  printf '%s\n' "$secret_paths" | sed 's/^/        /'
  dot_fix "remove secrets from repository-managed paths"
else
  dot_status ok "managed secrets" "no suspicious paths"
fi

if grep -RIE "(gho_|ghp_|api[_-]?key|secret|token=)" "$DOTFILES_ROOT/home" "$DOTFILES_ROOT/data" >/dev/null 2>&1; then
  dot_status warn "plaintext token scan" "possible secret-like text"
  dot_fix "move secrets to 1Password or Bitwarden"
else
  dot_status ok "plaintext token scan" "no obvious tokens"
fi

dot_summary
