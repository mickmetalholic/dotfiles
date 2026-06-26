#!/usr/bin/env sh
set -eu

DOTFILES_ROOT="${DOTFILES_ROOT:-$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)}"
. "$DOTFILES_ROOT/scripts/lib/output.sh"
. "$DOTFILES_ROOT/scripts/lib/detect.sh"

tmpdir="${TMPDIR:-/tmp}/dotfiles-public-readiness.$$"
mkdir -p "$tmpdir"
trap 'rm -rf "$tmpdir"' EXIT INT TERM

scope_file="$tmpdir/scope"
find "$DOTFILES_ROOT/data" "$DOTFILES_ROOT/home" "$DOTFILES_ROOT/scripts" -type f \
  ! -name 'public-readiness.sh' \
  ! -name 'public-readiness.ps1' \
  -print >"$scope_file"
printf '%s\n' "$DOTFILES_ROOT/README.md" "$DOTFILES_ROOT/install.sh" "$DOTFILES_ROOT/install.ps1" >>"$scope_file"

unsafe_count=0
review_count=0

dot_public_grep() {
  pattern="$1"
  output="$2"
  if [ -s "$scope_file" ]; then
    xargs grep -nEIH "$pattern" <"$scope_file" >"$output" 2>/dev/null || true
  fi
}

dot_public_report_file() {
  file="$1"
  sed "s#^$DOTFILES_ROOT/##" "$file" | sed 's/^/        /'
}

dot_section "Public Readiness"
dot_status ok scope "README, install entrypoints, data, home, scripts"

path_hits="$tmpdir/path-hits"
find "$DOTFILES_ROOT/data" "$DOTFILES_ROOT/home" "$DOTFILES_ROOT/scripts" -type f \( \
  -name '.env' -o \
  -name '.env.*' -o \
  -name '*.pem' -o \
  -name '*.key' -o \
  -name 'id_*' -o \
  -name '*cookies*' -o \
  -name '*history*' -o \
  -name '*cache*' \
  \) -print >"$path_hits" 2>/dev/null || true

if [ -s "$path_hits" ]; then
  unsafe_count=$((unsafe_count + 1))
  dot_status fail "forbidden paths" "unsafe to publish"
  dot_public_report_file "$path_hits"
  dot_fix "remove forbidden files from repository-managed paths"
else
  dot_status ok "forbidden paths" "none"
fi

secret_hits="$tmpdir/secret-hits"
dot_public_grep '-----BEGIN [A-Z ]*PRIVATE KEY-----|github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9_]+|AKIA[0-9A-Z]{16}|(api[_-]?key|token|password)[[:space:]]*[:=][[:space:]]*["'\'']?[A-Za-z0-9._/-]{20,}' "$secret_hits"

if [ -s "$secret_hits" ]; then
  unsafe_count=$((unsafe_count + 1))
  dot_status fail "secret-like content" "unsafe to publish"
  dot_public_report_file "$secret_hits"
  dot_fix "move secrets to 1Password or Bitwarden before making the repository public"
else
  dot_status ok "secret-like content" "none"
fi

metadata_hits="$tmpdir/metadata-hits"
: >"$metadata_hits"
dot_public_grep '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|includeIf "gitdir:~/(work|personal)/"' "$metadata_hits"
if [ -f "$DOTFILES_ROOT/data/hosts.yaml" ]; then
  grep -nEH '^[[:space:]]{2}[A-Za-z0-9._-]+:' "$DOTFILES_ROOT/data/hosts.yaml" >>"$metadata_hits" 2>/dev/null || true
fi
if [ -d "$DOTFILES_ROOT/data" ] || [ -d "$DOTFILES_ROOT/home" ]; then
  find "$DOTFILES_ROOT/data" "$DOTFILES_ROOT/home" -type f -print 2>/dev/null |
    xargs grep -nEIH '(^|[^A-Za-z])(work|company|corp|internal|bytedance)([^A-Za-z]|$)' >>"$metadata_hits" 2>/dev/null || true
fi
grep -vE 'git@github\.com' "$metadata_hits" | sort -u >"$metadata_hits.filtered" || true
mv "$metadata_hits.filtered" "$metadata_hits"

if [ -s "$metadata_hits" ]; then
  review_count=$((review_count + 1))
  dot_status warn "review metadata" "manual review required"
  dot_public_report_file "$metadata_hits"
  dot_fix "confirm hostnames, emails, SSH aliases, and work markers are safe to publish"
else
  dot_status ok "review metadata" "none"
fi

dot_section "Publish Gate"
if [ "$unsafe_count" -gt 0 ]; then
  dot_status fail "public visibility" "$unsafe_count unsafe finding group(s)"
  dot_fix "do not make the repository public until unsafe findings are removed"
  exit 1
fi

if [ "$review_count" -gt 0 ]; then
  dot_status warn "public visibility" "$review_count review finding group(s)"
  dot_fix "review findings manually before changing GitHub repository visibility"
else
  dot_status ok "public visibility" "no unsafe or review-required findings"
fi

dot_fix "change GitHub repository visibility manually only after this review"
