#!/usr/bin/env sh
set -eu

DOTFILES_ROOT="${DOTFILES_ROOT:-$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)}"
. "$DOTFILES_ROOT/scripts/lib/output.sh"
. "$DOTFILES_ROOT/scripts/lib/detect.sh"

dot_section "Runtime"
if dot_has mise; then
  dot_status ok mise "installing declared runtimes"
  exec mise install "$@"
else
  dot_status missing mise
  dot_fix "dot bootstrap"
  exit 1
fi
