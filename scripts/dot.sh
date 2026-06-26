#!/usr/bin/env sh
set -eu

DOTFILES_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
export DOTFILES_ROOT

usage() {
  cat <<'USAGE'
dot commands:
  doctor      inspect this machine without modifying it
  bootstrap   install foundational tooling and apply dotfiles
  apply       run chezmoi apply
  update      run chezmoi update
  diff        run chezmoi diff
  edit        open the chezmoi source directory
  packages    install/update declared packages
  public-readiness
              check whether repository content is ready to publish
  runtime     run mise install
  validate    run repository validation checks
USAGE
}

cmd="${1:-help}"
if [ "$#" -gt 0 ]; then
  shift
fi

case "$cmd" in
  doctor) exec "$DOTFILES_ROOT/scripts/doctor.sh" "$@" ;;
  bootstrap) exec "$DOTFILES_ROOT/scripts/bootstrap.sh" "$@" ;;
  packages) exec "$DOTFILES_ROOT/scripts/packages.sh" "$@" ;;
  public-readiness) exec "$DOTFILES_ROOT/scripts/public-readiness.sh" "$@" ;;
  runtime) exec "$DOTFILES_ROOT/scripts/runtime.sh" "$@" ;;
  validate) exec "$DOTFILES_ROOT/scripts/validate.sh" "$@" ;;
  apply) exec chezmoi apply "$@" ;;
  update) exec chezmoi update "$@" ;;
  diff) exec chezmoi diff "$@" ;;
  edit)
    editor="${EDITOR:-nvim}"
    src="$(chezmoi source-path)"
    exec "$editor" "$src"
    ;;
  help|-h|--help) usage ;;
  *)
    printf 'Unknown command: %s\n\n' "$cmd" >&2
    usage >&2
    exit 2
    ;;
esac
