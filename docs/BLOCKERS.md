# Publication/verification retry — 31 October 2026

A fresh push failed with `Could not resolve host: github.com`; the repository Actions API/page were unavailable. Docker socket access and local frontend/API HTTP were denied. The desktop/mobile browser attempt failed before page navigation because project-local Chromium is absent. No live flow, screenshot or hosted CI result is inferred. See [PUBLISH_VERIFY.md](PUBLISH_VERIFY.md) for observed results and exact completion commands. Both viewport cases are now authored, type-checked, formatted and discoverable; publication/live verification remains blocked.

---

# Account milestone verification limits (31 October 2026)

Implementation and offline checks are complete; see [ACCOUNTS.md](ACCOUNTS.md). The new Maven persistence tests/browser workflows have been added but cannot be run with the current restricted network, inaccessible Docker socket and forbidden local HTTP access. Offline Maven confirms the pinned Spring Boot 3.5.16 parent is absent. Production/test Java compilation and 34 account JUnit tests were run using delivered runtime libraries, cached test libraries, Java 17 target and the available Java 25 JVM. A temporary interface-only Mockito configuration addresses this sandbox's restricted agent attachment.

The Superdesign CLI preflight failed to resolve the npm registry, so the UI extends the existing repository design system directly. No paid design generation, new service account or external email sending was used. Full browser/real-mail capture/database verification and new screenshots remain pending, not assumed successful.

---

# Current follow-up access limits

- GitHub API/page access is unavailable; shell DNS/network access is restricted. Actual hosted CI status and follow-up push are unverified/pending.
- Docker socket access is denied and localhost HTTP connections are forbidden. A fresh live browser/Compose review cannot be performed in this session.
- The pinned Spring Boot 3.5.16 Maven parent/test dependencies are not cached. Maven verify cannot be rerun offline. Production Java source compilation with the delivered runtime libraries passed; versions were not changed.
- A normal writable checkout was recovered at `/tmp/carnova-review`; its commits are preserved in the updated workspace delivery bundle. See GIT_DELIVERY.md and FOLLOWUP_REVIEW.md.

The entries below describe the earlier redesign environment, rather than current successful access.

---

# Blockers and safe fallbacks

- Superdesign remote design is unavailable without login. Local design context and original source implementation are used; no account or credits required.
- Historical credentials cannot be revoked through repository changes. Values are removed from working configuration and never displayed; owner must rotate any previously exposed credentials. Git history is preserved as instructed.

- The original .git directory and global npm/Docker cache locations are read-only in this environment. Resolved with writable Git metadata and task-scoped /tmp caches; no global installs or system changes. See GIT_DELIVERY.md.
- Default HTTPS Git push has no credential helper, and the host SSH configuration has a permissions error. Resolved using the existing SSH identity with a per-command `ssh -F /dev/null` override, BatchMode and strict host-key checking. Dry-run push succeeded; no credential values were read or printed.
- Lighthouse’s full Chromium launcher hit this environment’s crashpad/config limitation. The installed project-local Chromium headless shell works via CHROME_PATH; no system browser or packages were installed.
- Stripe TEST and an optional local Ollama service were not invoked against external credentials/services. The local mock payment and offline assistant paths are verified; live payment mode is intentionally unavailable.
