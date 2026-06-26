## 1. Public-readiness Review

- [x] 1.1 Add or update a repository-local public-readiness check covering managed files, data, scripts, and docs.
- [x] 1.2 Scan for forbidden secret material including private keys, tokens, `.env` files, cookies, history, caches, and company secrets.
- [x] 1.3 Scan for review-required metadata including hostnames, email addresses, internal-looking domains, SSH aliases, and personal identifiers.
- [x] 1.4 Remove, generalize, or explicitly document any unsafe or review-required findings before public visibility changes.

## 2. Public Install Flow

- [x] 2.1 Confirm POSIX and PowerShell install entrypoints default to the intended public GitHub repository URL.
- [x] 2.2 Remove private/fork fallback setup guidance from README.
- [x] 2.3 Update README install guidance so public one-command install is the primary path.
- [x] 2.4 Keep installation documentation focused on the public one-command flow.
- [x] 2.5 Document that changing GitHub repository visibility remains a manual step after public-readiness review.

## 3. Validation

- [x] 3.1 Run `dot validate`.
- [x] 3.2 Run the public-readiness check and record whether findings remain for manual review.
- [x] 3.3 Run `openspec validate --all --strict`.
- [x] 3.4 Verify the new install documentation mentions both Windows and POSIX one-command flows.
