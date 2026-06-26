#!/usr/bin/env sh
set -eu

repo="${DOTFILES_REPO:-https://github.com/mickmetalholic/dotfiles.git}"

has() {
  command -v "$1" >/dev/null 2>&1
}

install_chezmoi() {
  if has chezmoi; then
    return 0
  fi

  if has brew; then
    printf 'Installing chezmoi with Homebrew...\n'
    brew install chezmoi
  else
    bindir="${HOME:-.}/.local/bin"
    mkdir -p "$bindir"
    if has curl; then
      printf 'Installing chezmoi with https://get.chezmoi.io...\n'
      sh -c "$(curl -fsLS https://get.chezmoi.io)" -- -b "$bindir"
    elif has wget; then
      printf 'Installing chezmoi with https://get.chezmoi.io...\n'
      sh -c "$(wget -qO- https://get.chezmoi.io)" -- -b "$bindir"
    else
      printf 'chezmoi is required and no supported installer was found. Install it from https://www.chezmoi.io/install/ and re-run this script.\n' >&2
      exit 1
    fi
    PATH="$bindir:$PATH"
    export PATH
  fi
}

if ! command -v chezmoi >/dev/null 2>&1; then
  install_chezmoi
fi

if ! command -v chezmoi >/dev/null 2>&1; then
  printf 'chezmoi installation did not place chezmoi on PATH. Install it from https://www.chezmoi.io/install/ and re-run this script.\n' >&2
  exit 1
fi

chezmoi init --apply "$repo"
src="$(chezmoi source-path)"
"$src/scripts/bootstrap.sh"
"$src/scripts/doctor.sh"
