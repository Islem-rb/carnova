# Blockers and safe fallbacks

- Superdesign remote design is unavailable without login. Local design context and original source implementation are used; no account or credits required.
- Historical credentials cannot be revoked through repository changes. Values are removed from working configuration and never displayed; owner must rotate any previously exposed credentials. Git history is preserved as instructed.

- The original .git directory and global npm/Docker cache locations are read-only in this environment. Resolved with writable Git metadata and task-scoped /tmp caches; no global installs or system changes. See GIT_DELIVERY.md.
- Default HTTPS Git push has no credential helper, and the host SSH configuration has a permissions error. Resolved using the existing SSH identity with a per-command `ssh -F /dev/null` override, BatchMode and strict host-key checking. Dry-run push succeeded; no credential values were read or printed.
- Lighthouse’s full Chromium launcher hit this environment’s crashpad/config limitation. The installed project-local Chromium headless shell works via CHROME_PATH; no system browser or packages were installed.
- Stripe TEST and an optional local Ollama service were not invoked against external credentials/services. The local mock payment and offline assistant paths are verified; live payment mode is intentionally unavailable.
