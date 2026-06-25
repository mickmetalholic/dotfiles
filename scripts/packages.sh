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

os="$(dot_os)"
case "$os" in
  darwin)
    if dot_has brew; then
      for pkg in git gh jq ripgrep fd fzf zoxide starship mise direnv uv; do
        if [ "$dry_run" = true ]; then
          dot_status warn "$pkg" "would install with brew"
        else
          dot_install_brew_package "$pkg"
        fi
      done
      if [ "$gui" = true ]; then
        for cask in ghostty visual-studio-code obsidian; do
          dot_status warn "$cask" "cask install requested"
          [ "$dry_run" = true ] || brew install --cask "$cask"
        done
      fi
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
        for pkg in git curl unzip jq ripgrep fd-find fzf zsh; do
          dot_install_apt_package "$pkg"
        done
      fi
    elif dot_has brew; then
      for pkg in gh starship mise uv; do
        if [ "$dry_run" = true ]; then
          dot_status warn "$pkg" "would install with brew"
        else
          dot_install_brew_package "$pkg"
        fi
      done
    else
      dot_status warn "package manager" "no supported Linux package manager found"
    fi
    ;;
  *)
    dot_status warn os "packages.sh is intended for macOS/Linux"
    ;;
esac
