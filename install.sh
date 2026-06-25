#!/usr/bin/env sh
set -eu

repo="${DOTFILES_REPO:-https://github.com/mickmetalholic/dotfiles.git}"

if ! command -v chezmoi >/dev/null 2>&1; then
  printf 'chezmoi is required. Install it from https://www.chezmoi.io/install/ and re-run this script.\n' >&2
  exit 1
fi

chezmoi init --apply "$repo"
src="$(chezmoi source-path)"
"$src/scripts/bootstrap.sh"
"$src/scripts/doctor.sh"
