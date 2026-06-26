#!/usr/bin/env sh

dot_has() {
  command -v "$1" >/dev/null 2>&1
}

dot_os() {
  uname_s="$(uname -s 2>/dev/null || printf unknown)"
  case "$uname_s" in
    Darwin) printf darwin ;;
    Linux) printf linux ;;
    MINGW*|MSYS*|CYGWIN*) printf windows ;;
    *) printf '%s' "$uname_s" | tr '[:upper:]' '[:lower:]' ;;
  esac
}

dot_arch() {
  uname -m 2>/dev/null || printf unknown
}

dot_host() {
  if [ -n "${DOTFILES_HOST:-}" ]; then
    printf '%s' "$DOTFILES_HOST"
  else
    hostname 2>/dev/null || printf unknown
  fi
}
