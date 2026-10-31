# Follow-up review — 31 October 2026

Review baseline: delivered commit `c1cfe48` on `redesign/v2`. A normal writable checkout was reconstructed at `/tmp/carnova-review` from the verified delivery bundle. Its tracked files matched the shared workspace before changes; main and the original read-only Git metadata were not modified.

## Fixed

1. **Search race:** retrying an unchanged search created an independent request. A slower retry could replace results from newer filters. Retry and URL changes now share one `switchMap` pipeline. Destroying the page cancels the active request.
2. **Detail race:** a previous listing's related request could replace the current listing's suggestions, even showing the current car among its own suggestions. Listing and related requests now cancel as one chain on route changes and destruction. Missing-listing and suggestions-failure states retain their intended behavior.
3. **Ignored source:** root `core`/`core.*` patterns also matched Angular's `src/app/core` directory. Existing tracked files were delivered, but future files would silently be ignored. Crash dumps are now scoped to application roots and numeric dump names.
4. **CI format gate:** the frontend job now runs the existing `format:check` command before tests/build.

The two original search regressions and two original detail regressions were reproduced as failing tests before their fixes. Seven regression tests cover out-of-order responses, cancellation and detail failure states. The complete frontend suite now has **18 passing tests**.

## Verified in this session

- Clean checkout of the delivered Git history, with no source differences before review.
- Production frontend build passes without warnings: **418.96 KB raw / 109.21 KB estimated transfer**, within existing budgets.
- Frontend **18 tests pass**, formatting passes, and the installed dependency tree is valid. Existing project dependencies were reused; a networked `npm ci` was not rerun.
- All **32 production Java files compile for Java 17** using the exact runtime libraries from the delivered application JAR. This is a supplementary source compilation check, not a substitute for Maven integration tests.
- New core source paths are no longer ignored; root/application crash dumps remain ignored.

Machine-readable evidence: [followup-review.json](reports/followup-review.json).

## Checks blocked by this session

**The hosted GitHub Actions conclusion is unknown.** GitHub's API/page could not be fetched through browsing, and shell network access cannot resolve remote hosts. No CI success or failure is inferred from local checks.

**A fresh browser/Compose walkthrough was not possible.** Docker socket access is denied and local HTTP connections are forbidden. The previously recorded browser/Docker/Lighthouse results remain historical evidence in [VERIFICATION.md](VERIFICATION.md). This review does not re-label those older results as current reruns.

The local Maven cache contains Spring Boot 3.5.0, not the pinned 3.5.16 parent/test artifacts. The original Maven integration suite cannot be rerun offline, and dependencies were not downgraded to fit this environment.

The follow-up commits and updated incremental bundle are prepared locally. Remote push requires a session with GitHub network access. See [GIT_DELIVERY.md](GIT_DELIVERY.md).

## Live review to complete when access is available

| Flow | Check |
| --- | --- |
| Hosted CI | Open the newest run for redesign/v2; verify backend, frontend and platform jobs. |
| Search | Retry a failed search, change filters immediately, and confirm that the newest filters remain authoritative. |
| Listing details | Navigate rapidly between cars; related suggestions should never revert to the previous car or include the current listing. |
| Publishing | Signup/login → photo and GLB upload → mock payment → publish → account status/edit/delete. |
| Mobile | Repeat search, seller contact and assistant keyboard interactions at 390px and 320px. |

After this release check, account recovery/email verification and account settings remain the next product milestone. Optional Stripe TEST/Ollama validation still requires separately configured existing services; no hosted accounts, paid calls or deployments were introduced here.
