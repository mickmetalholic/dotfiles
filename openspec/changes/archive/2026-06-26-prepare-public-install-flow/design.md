## Context

The repository is currently documented as a private dotfiles repository. That makes `gh auth login` or equivalent GitHub authentication part of the new-machine setup story, even though the install scripts can already initialize from a public GitHub repository URL.

Making the repository public would simplify install to a single raw-file command, but dotfiles commonly contain hostnames, email addresses, SSH aliases, internal domains, package preferences, and sometimes secret-like values. Public visibility should happen only after the repository-managed surface is reviewed and any unsafe details are removed, generalized, or explicitly accepted.

## Goals / Non-Goals

**Goals:**

- Make public one-command install the primary documented path.
- Add a repeatable public-readiness review for managed data, templates, docs, and scripts.
- Ensure the default install repository URL does not require `gh` when the GitHub repository is public.

**Non-Goals:**

- Do not change GitHub repository visibility from scripts.
- Do not remove personal preferences that are safe to publish.
- Do not add encrypted secret syncing or secret-manager lookups.
- Do not change package/runtime installation behavior except where docs mention the install flow.

## Decisions

1. Treat public visibility as a manual release gate.

   Scripts should prepare and validate the repository, but the actual GitHub visibility change belongs in repository settings. This avoids making a local command responsible for an external irreversible policy decision.

   Alternative considered: use `gh repo edit --visibility public`. That would reintroduce a `gh` dependency into the very flow we are trying to simplify and makes the visibility change too easy to run accidentally.

2. Keep raw GitHub install commands as the only documented install path.

   The public flow should be `curl | sh` for POSIX and `irm | iex` for Windows because those are already the install entrypoints. README should not include private or fork fallback instructions; this keeps the intended usage simple and avoids reintroducing `gh` as part of setup.

   Alternative considered: require users to install `chezmoi` first and run `chezmoi init`. That works, but it does not meet the one-command goal.

3. Add repository-local public-readiness checks before publishing.

   Public-readiness should scan managed files and docs for forbidden paths, secret-like tokens, private keys, company/internal hints, and host data that should be reviewed. Some findings may be intentional personal configuration, so the output should distinguish hard forbidden patterns from review-required patterns.

   Alternative considered: rely only on existing doctor secret checks. Doctor focuses on machine health and managed secret paths; public-readiness needs a broader repository-facing review.

## Risks / Trade-offs

- A scanner can miss sensitive context that is not token-shaped. Mitigation: include a manual review checklist for host data, SSH aliases, Git identities, company domains, and package names.
- A scanner can produce false positives for words like `secret` in policy docs. Mitigation: categorize findings and allow review rather than treating every match as fatal.
- Public raw install depends on the repository actually being public. Mitigation: README should state that the one-command flow works after GitHub visibility is public.

## Migration Plan

First implement public-readiness checks and clean up any unsafe findings. Then update README to make one-command public install primary. After validation passes and the user reviews findings, the repository visibility can be changed manually in GitHub settings.

Rollback is documentation-only for most of the change: restore earlier install docs and keep the checks as optional safety tooling if they remain useful.

## Open Questions

- Which host identifiers are acceptable to publish as personal machine names, and which should be generalized before changing visibility?
