## ADDED Requirements

### Requirement: POSIX chezmoi auto-install
POSIX install and bootstrap setup paths SHALL install `chezmoi` automatically when `chezmoi` is missing and a supported installer path is available.

#### Scenario: Homebrew is available
- **WHEN** a POSIX setup path needs `chezmoi` and `brew` is available
- **THEN** it installs `chezmoi` with Homebrew before running `chezmoi init` or `chezmoi apply`

#### Scenario: Homebrew is unavailable
- **WHEN** a POSIX setup path needs `chezmoi` and Homebrew is unavailable
- **THEN** it attempts a supported non-Homebrew install path or reports a clear manual installation fallback

#### Scenario: Chezmoi is already installed
- **WHEN** a POSIX setup path finds `chezmoi` on `PATH`
- **THEN** it does not reinstall `chezmoi`
