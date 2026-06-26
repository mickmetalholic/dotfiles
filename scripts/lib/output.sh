#!/usr/bin/env sh

: "${DOT_STATUS_MISSING_COUNT:=0}"
: "${DOT_STATUS_WARNING_COUNT:=0}"
: "${DOT_STATUS_FAILURE_COUNT:=0}"

dot_section() {
  printf '\n%s\n' "$1"
}

dot_status() {
  status="$1"
  name="$2"
  detail="${3:-}"
  case "$status" in
    missing) DOT_STATUS_MISSING_COUNT=$((DOT_STATUS_MISSING_COUNT + 1)) ;;
    warn) DOT_STATUS_WARNING_COUNT=$((DOT_STATUS_WARNING_COUNT + 1)) ;;
    fail) DOT_STATUS_FAILURE_COUNT=$((DOT_STATUS_FAILURE_COUNT + 1)) ;;
  esac
  if [ -n "$detail" ]; then
    printf '  [%s] %s: %s\n' "$status" "$name" "$detail"
  else
    printf '  [%s] %s\n' "$status" "$name"
  fi
}

dot_fix() {
  printf '        fix: %s\n' "$1"
}

dot_summary() {
  blocking_count=$((DOT_STATUS_MISSING_COUNT + DOT_STATUS_FAILURE_COUNT))
  dot_section "Summary"
  if [ "$blocking_count" -gt 0 ]; then
    dot_status_plain blocked "machine setup" "$blocking_count blocking issue(s), $DOT_STATUS_WARNING_COUNT warning(s)"
    dot_fix "resolve missing/failing required checks first"
  elif [ "$DOT_STATUS_WARNING_COUNT" -gt 0 ]; then
    dot_status_plain warn "machine setup" "usable with $DOT_STATUS_WARNING_COUNT warning(s)"
    dot_fix "review warnings when you have time"
  else
    dot_status_plain ok "machine setup" "ready"
  fi
}

dot_status_plain() {
  status="$1"
  name="$2"
  detail="${3:-}"
  if [ -n "$detail" ]; then
    printf '  [%s] %s: %s\n' "$status" "$name" "$detail"
  else
    printf '  [%s] %s\n' "$status" "$name"
  fi
}
