#!/usr/bin/env sh
set -eu

DOTFILES_ROOT="${DOTFILES_ROOT:-$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)}"
. "$DOTFILES_ROOT/scripts/lib/output.sh"
. "$DOTFILES_ROOT/scripts/lib/detect.sh"
. "$DOTFILES_ROOT/scripts/lib/packages.sh"

dry_run=false
gui=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=true ;;
    --gui) gui=true ;;
    *) printf 'Unknown packages option: %s\n' "$arg" >&2; exit 2 ;;
  esac
done

dot_section "Packages"
dot_status ok data "$(dot_packages_file)"

dot_install_brew_cask() {
  cask="$1"
  if brew list --cask "$cask" >/dev/null 2>&1; then
    dot_status ok "$cask" "brew cask"
  elif [ "$dry_run" = true ]; then
    dot_status warn "$cask" "would install with brew cask"
  else
    dot_status warn "$cask" "installing with brew cask"
    brew install --cask "$cask"
  fi
}

dot_install_brew_or_dry_run() {
  pkg="$1"
  if [ "$dry_run" = true ]; then
    if brew list "$pkg" >/dev/null 2>&1; then
      dot_status ok "$pkg" "brew"
    else
      dot_status warn "$pkg" "would install with brew"
    fi
  else
    dot_install_brew_package "$pkg"
  fi
}

dot_install_apt_or_dry_run() {
  pkg="$1"
  if [ "$dry_run" = true ]; then
    if dpkg -s "$pkg" >/dev/null 2>&1; then
      dot_status ok "$pkg" "apt"
    else
      dot_status warn "$pkg" "would install with apt"
    fi
  else
    dot_install_apt_package "$pkg"
  fi
}

dot_official_fallback() {
  name="$1"
  url="$2"
  dot_status warn "$name" "official fallback required"
  dot_fix "$url"
}

os="$(dot_os)"
host="$(dot_host)"
case "$os" in
  darwin)
    if dot_has brew; then
      for pkg in git gh jq ripgrep fd fzf zoxide starship mise direnv uv eza httpie bat tlrc git-delta lazygit just yq shellcheck shfmt taplo stylua; do
        dot_install_brew_or_dry_run "$pkg"
      done
      if [ "$gui" = true ]; then
        for cask in ghostty visual-studio-code httpie cursor; do
          dot_install_brew_cask "$cask"
        done
      fi
      if [ "$host" = "work-mac" ]; then
        if [ "$gui" = true ]; then
          dot_install_brew_cask docker
        else
          dot_status warn docker "host devops tool; pass --gui to install Docker Desktop"
          dot_fix "dot packages --gui"
        fi
      fi
      dot_official_fallback codex-cli "https://developers.openai.com/codex/cli"
      dot_official_fallback codex-app "https://developers.openai.com/codex/app"
      dot_official_fallback psscriptanalyzer "Install-Module PSScriptAnalyzer -Scope CurrentUser"
      dot_official_fallback reasonix-cli "https://api-docs.deepseek.com/quick_start/agent_integrations/reasonix"
      dot_official_fallback reasonix-app "https://github.com/esengine/DeepSeek-Reasonix/releases"
    else
      dot_status missing brew
      dot_fix "install Homebrew from https://brew.sh"
    fi
    ;;
  linux)
    if dot_has apt-get; then
      if [ "$dry_run" = true ]; then
        dot_status warn apt "would install base apt packages"
      else
        sudo apt-get update
      fi
      for pkg in git curl unzip jq ripgrep fd-find fzf zsh httpie bat shellcheck shfmt; do
        dot_install_apt_or_dry_run "$pkg"
      done
    else
      dot_status warn apt-get "not available"
    fi

    if dot_has brew; then
      for pkg in gh eza zoxide starship mise uv tlrc git-delta lazygit just yq taplo stylua; do
        dot_install_brew_or_dry_run "$pkg"
      done
    else
      for pkg in gh eza zoxide starship mise uv tlrc git-delta lazygit just yq taplo stylua; do
        dot_status warn "$pkg" "Linux Homebrew package skipped"
      done
      dot_fix "install Homebrew on Linux for supplemental CLI packages, or install these tools from official sources"
    fi

    if [ "$host" = "linux-devbox" ]; then
      dot_official_fallback docker-engine "https://docs.docker.com/engine/install/"
      dot_official_fallback k3s "https://docs.k3s.io/quick-start"
    fi
    dot_official_fallback codex-cli "https://developers.openai.com/codex/cli"
    dot_official_fallback codex-app "https://developers.openai.com/codex/app"
    dot_official_fallback psscriptanalyzer "Install-Module PSScriptAnalyzer -Scope CurrentUser"
    dot_official_fallback reasonix-cli "https://api-docs.deepseek.com/quick_start/agent_integrations/reasonix"
    dot_official_fallback reasonix-app "https://github.com/esengine/DeepSeek-Reasonix/releases"
    ;;
  *)
    dot_status warn os "packages.sh is intended for macOS/Linux"
    ;;
esac
