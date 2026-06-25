#!/usr/bin/env sh

dot_check_command() {
  name="$1"
  fix="$2"
  if dot_has "$name"; then
    version="$("$name" --version 2>/dev/null | head -n 1)"
    dot_status ok "$name" "$version"
  else
    dot_status missing "$name"
    [ -n "$fix" ] && dot_fix "$fix"
  fi
}

dot_check_optional_command() {
  name="$1"
  if dot_has "$name"; then
    dot_status ok "$name" "available"
  else
    dot_status warn "$name" "optional"
  fi
}
