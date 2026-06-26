#!/usr/bin/env sh
set -eu

DOTFILES_ROOT="${DOTFILES_ROOT:-$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)}"
. "$DOTFILES_ROOT/scripts/lib/output.sh"
. "$DOTFILES_ROOT/scripts/lib/detect.sh"
. "$DOTFILES_ROOT/scripts/lib/install.sh"

install_gui=false
force=false
for arg in "$@"; do
  case "$arg" in
    --gui) install_gui=true ;;
    --force) force=true ;;
    *) printf 'Unknown bootstrap option: %s\n' "$arg" >&2; exit 2 ;;
  esac
done

dot_section "Bootstrap"
dot_status ok mode "gui=$install_gui force=$force"

dot_install_chezmoi || true

os="$(dot_os)"
case "$os" in
  darwin)
    if ! dot_has brew; then
      dot_status missing brew
      dot_fix "install Homebrew from https://brew.sh"
    fi
    ;;
  linux)
    if dot_has apt-get; then
      dot_status ok apt-get "available"
      sudo apt-get update
      sudo apt-get install -y git curl unzip
    elif ! dot_has brew; then
      dot_status warn "linux package manager" "no apt-get or brew detected"
    fi
    ;;
  *)
    dot_status warn os "bootstrap.sh is intended for macOS/Linux"
    ;;
esac

dot_install_mise || true

if dot_has chezmoi; then
  dot_status warn chezmoi "applying source"
  chezmoi apply
fi

"$DOTFILES_ROOT/scripts/doctor.sh"
