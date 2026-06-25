#!/usr/bin/env sh

dot_packages_file() {
  printf '%s/data/packages.yaml' "$DOTFILES_ROOT"
}

dot_install_brew_package() {
  pkg="$1"
  if brew list "$pkg" >/dev/null 2>&1; then
    dot_status ok "$pkg" "brew"
  else
    dot_status warn "$pkg" "installing with brew"
    brew install "$pkg"
  fi
}

dot_install_apt_package() {
  pkg="$1"
  if dpkg -s "$pkg" >/dev/null 2>&1; then
    dot_status ok "$pkg" "apt"
  else
    dot_status warn "$pkg" "install with apt"
    sudo apt-get install -y "$pkg"
  fi
}
