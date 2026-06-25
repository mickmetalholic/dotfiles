#!/usr/bin/env sh

dot_install_chezmoi() {
  if dot_has chezmoi; then
    dot_status ok chezmoi "already installed"
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
