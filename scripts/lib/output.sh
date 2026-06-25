#!/usr/bin/env sh

dot_section() {
  printf '\n%s\n' "$1"
}

dot_status() {
  status="$1"
  name="$2"
  detail="$3"
  if [ -n "$detail" ]; then
    printf '  [%s] %s: %s\n' "$status" "$name" "$detail"
  else
    printf '  [%s] %s\n' "$status" "$name"
  fi
}

dot_fix() {
  printf '        fix: %s\n' "$1"
}
