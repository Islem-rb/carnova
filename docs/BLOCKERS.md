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
