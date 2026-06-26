## ADDED Requirements

### Requirement: Local Git email initialization
Chezmoi initialization SHALL collect Git email as local user data instead of requiring a repository-tracked email default.

#### Scenario: Email is provided by environment
- **WHEN** `DOTFILES_EMAIL` is set during initialization
- **THEN** the generated local chezmoi config uses that email without prompting

#### Scenario: Email is not provided by environment
- **WHEN** `DOTFILES_EMAIL` is not set during initialization
- **THEN** chezmoi prompts once for Git email and stores the answer in local chezmoi config

#### Scenario: Git config is rendered
- **WHEN** managed Git config templates render
- **THEN** they use the locally configured email value
