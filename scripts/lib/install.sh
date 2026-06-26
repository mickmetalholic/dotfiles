#!/usr/bin/env sh

dot_install_chezmoi() {
  if dot_has chezmoi; then
    dot_status ok chezmoi "already installed"
    return 0
  fi

  if dot_has brew; then
    dot_status warn chezmoi "installing with brew"
    brew install chezmoi
  else
    bindir="${HOME:-.}/.local/bin"
    mkdir -p "$bindir"
    if dot_has curl; then
      dot_status warn chezmoi "installing with get.chezmoi.io"
      sh -c "$(curl -fsLS https://get.chezmoi.io)" -- -b "$bindir"
    elif dot_has wget; then
      dot_status warn chezmoi "installing with get.chezmoi.io"
      sh -c "$(wget -qO- https://get.chezmoi.io)" -- -b "$bindir"
    else
      dot_status missing chezmoi
      dot_fix "install chezmoi from https://www.chezmoi.io/install/"
      return 1
    fi
    PATH="$bindir:$PATH"
    export PATH
  fi

  if dot_has chezmoi; then
    dot_status ok chezmoi "installed"
    return 0
  fi

  dot_status missing chezmoi
  dot_fix "install chezmoi from https://www.chezmoi.io/install/"
  return 1
}

dot_install_mise() {
  if dot_has mise; then
    dot_status ok mise "already installed"
    return 0
  fi

  dot_status missing mise
  dot_fix "install mise with the OS package manager, then run dot runtime"
  return 1
}
