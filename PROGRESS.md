# Free deployment prepared — Render + Neon (branch `deploy/render`)

**Goal:** a public demo at no cost. One Render free Docker service (root `Dockerfile`: Angular served by Spring Boot from one origin) and a Neon free Postgres. Compose stays the local setup. Guide: [docs/DEPLOY.md](docs/DEPLOY.md).

**Measured locally at Render's 0.1 CPU / 512 MB:** cold start 233 s plain, ~100 s with Spring AOT + a build-time CDS archive, ~175 MB memory. The demo has email disabled (the UI says so), keeps visitor uploads only until a restart, and uses mock payments.

**Fixed on the way:** rate limiting was shared by all visitors behind any proxy (now per visitor, via a proxy-overwritten header); unknown resources returned 500 (now 404/405); demo seeding was not atomic.

**Verified:** backend 68 tests (Java 17 container), frontend 48 tests, formatting and production build; browser suite 10/10 on Compose and 9/10 on the Render image (the remaining test reads mail from Mailpit, disabled there by design); the new `render-image` CI smoke test passes locally.

**Remaining (needs the owner's accounts):** unlink the old Netlify site (its failing checks would block `checksPass` deploys), create the Neon project and the Render Blueprint, set `DEMO_ADMIN_PASSWORD`. Demo video and portfolio section follow.

---

# 3D/driving failure fixed — hosted CI fully green

**Root cause (measured):** under SwiftShader, the WebGL implementation headless CI uses, the drive scene rendered every frame even when parked, at **~850 ms per frame** on a 16-core machine. The ToyCar's transmission/clearcoat/sheen materials, MSAA and soft shadows made each frame expensive, which starved the main thread so every Playwright action waited. Pinning the browser to 2 cores reproduced the hosted 90 s timeout on the old code locally. Studio reset also coasted on OrbitControls damping momentum.

**Fix (`e7bd2c1`):** drive mode renders only while keys are held, the car moves or the camera settles; reset snaps; a software-WebGL tier drops MSAA, shadows and transmission and draws motion at reduced resolution with a sharp settled frame. GPU users keep full quality. No timeout, forced-click or test changes. Parked drive frame: 850 → **17 ms**; focused test on 2 cores: timeout → **25 s (3/3)**.

**Hosted CI:** [run 41217581261](https://github.com/Islem-rb/carnova/actions/runs/41217581261) at `e7bd2c1`: backend, frontend and platform/browser jobs **all success** (platform 6 min 6 s; previously failed after 9 min 17 s). Evidence: [hosted-ci-41217581261.json](docs/reports/hosted-ci-41217581261.json). Hosted per-test logs need an authenticated token that this session did not have; the counts below are local.

**Local verification on the production container:** 45 frontend unit tests (2 new for renderer detection), formatting, production build without warnings (419.49 KB / 109.71 KB); full browser suite **10/10**, three times during the work.

**Also:** reviewing the regenerated captures found the recovery pages' back link running into the eyebrow ("connexionVOTRE ACCÈS"), fixed in `25ce2d5`; refreshed screenshots now include the recovery/verification/settings pages. Studio captures keep the earlier GPU look (see [decisions](docs/DECISIONS.md)). Lighthouse was not rerun.

---

# Published revision verified — one 3D browser failure remains

**Publication confirmed:** user SSH push published `c1921b0` to `redesign/v2`, preserving `1916572`, the account milestone and subsequent fixes. The [actual hosted run](https://github.com/Islem-rb/carnova/actions/runs/41212911198) now verifies that exact revision; older “unpublished” entries below are historical.

**Passed:** Java 17 Maven **60 tests** (including persistence), frontend **43 tests**, formatting and production build without warnings; four-service Compose startup; **9/10 browser checks**, including the full signup → login → listing/photo/GLB/mock checkout → search flows on desktop and touch-mobile, real captured-mail account recovery/verification, accessibility and visual capture.

**Remaining:** the standalone 3D viewer → driving workflow still exceeds 90 seconds on both attempts. The prior rendering/reset correction improves idle work but has not resolved this failure. Trace artifact `13047108038` is available on the run; local transfer/visual inspection remains blocked in the Codex session. A user-local ZIP path was requested but not supplied before handoff.

**Continue here:** [Claude Code handoff](docs/HANDOFF_CLAUDE.md), [machine-readable hosted evidence](docs/reports/hosted-ci-41212911198.json). Use the normal `/tmp/carnova-review` checkout on `redesign/v2`; the shared workspace's original Git index is stale/read-only. No new application changes were made after the pushed revision; this handoff adds local documentation only. Retest Claude's own permissions instead of assuming the previous session restrictions apply.

---

# GitHub connected — hosted CI inspected; publication blocked by tool approval

**Confirmed:** the GitHub plugin can read CarNova and reports repository push permission. Remote `redesign/v2` still points to `c1cfe48`. Its [hosted run](https://github.com/Islem-rb/carnova/actions/runs/41159293499) passed backend/frontend and six browser tests; the 3D-to-driving case timed out. This is the older revision, not validation of the new account/mobile work.

**Prepared correction:** local commit `cc4151d` stops unnecessary idle rendering and paint shader recompilation, and makes viewer reset stop rotation. All 43 frontend tests, production build without warnings, and formatting pass. The updated real browser assertion and both desktop/mobile publishing variants remain pending a hosted run.

**Publication result:** the connector source-tree upload was rejected before mutation: “MCP tool call requires approval, but approval policy is never.” No remote commit/ref was changed and no new CI run was created. Ordinary terminal push still fails DNS; local Docker access remains denied. This is a session tool-approval block, not missing repository push permission. No attempt was made to change permissions, bypass the rejection or rewrite history.

Current evidence: [connected-ci.json](docs/reports/connected-ci.json). Original local history and reviewed workspace changes are preserved in `redesign-v2.bundle`. Resume publication/CI when an allowed write transport is available; [PUBLISH_VERIFY.md](docs/PUBLISH_VERIFY.md) retains the full walkthrough commands.

---

# GitHub connection available — publication and hosted verification in progress

The installed GitHub connector can now read the repository and Actions. The old hosted run at `c1cfe48` passed backend/frontend and six of seven browser tests; its 3D-to-driving interaction timed out. Static rendering/paint/reset corrections pass 43 frontend tests, production build without warnings and formatting. Connector publication and exact-revision CI are next. Terminal DNS and local Docker remain blocked; hosted Actions can provide the full stack/browser run.

Publication will append to `redesign/v2` using an expected-head, non-forced update. The API creates a new commit SHA for the same reviewed tree; original local commits are preserved and the connector commit is merged locally without resetting/rebasing. See [decisions](docs/DECISIONS.md).

---

# Publication and live verification — blocked by current access

**Attempted:** publish the latest account milestone (which includes requested commit `1916572`), retrieve GitHub Actions, connect to Docker/frontend/API, and launch the requested desktop/mobile browser cases. Push failed on GitHub DNS; hosted CI is unknown; Docker/local HTTP access is denied; Chromium is unavailable. **No application walkthrough or fresh screenshots were produced.**

**Prepared and verified locally:** the complete publishing workflow now has desktop and touch-mobile variants, actual form-based search, overflow/console checks and four screenshot checkpoints per viewport. TypeScript, formatting and discovery of all ten browser tests pass. This prepares verification; it does not complete the blocked live checks.

**Next:** publish from the normal writable checkout and inspect exact-head CI, then execute/review the two viewport cases in a session with access. Commands and evidence: [PUBLISH_VERIFY.md](docs/PUBLISH_VERIFY.md). Changes remain on `redesign/v2`, mirrored into this workspace and preserved in the delivery bundle.

---

# Account essentials — implementation complete, full live verification pending

**Added:** password recovery, email confirmation/resend, editable name settings, and authenticated password changes. Open **Mon espace → Mon compte**. Account emails are captured locally at `http://localhost:8025`; start all four services with `docker compose up --build --wait` when Docker is available. See [account guide](docs/ACCOUNTS.md).

**Verified now:** 43 frontend unit tests; 34 new backend service/controller/mail/JWT-filter tests through the offline JUnit runner; Java 17-target production/test compilation; production build without warnings (**419.44 KB raw / 109.68 KB transfer**, unchanged 420 KB budget); formatting and new test TypeScript checks; Compose configuration validation.

**Pending:** the two authored persistence integration tests, fresh full Maven verification, nine browser workflows including two new account workflows, new screenshots/accessibility sweeps, hosted CI and branch push. Current package-network/Docker/local HTTP restrictions prevent these runs. Earlier live evidence below remains historical. Local account mail is a capture inbox, with no external delivery configured.

**Review first:** [ACCOUNTS.md](docs/ACCOUNTS.md), [API](docs/API.md), and additive [V3 migration](carnova-back/src/main/resources/db/migration/V3__account_security.sql). Work remains on `redesign/v2` in `/tmp/carnova-review`, with reviewed changes mirrored into the shared workspace and preserved in the ignored delivery bundle; original Git metadata/main/uploads/models remain unchanged.

---

# Follow-up review — local fixes verified, remote/live checks pending

**Review baseline:** pushed redesign/v2 commit `c1cfe48`. A normal writable checkout is available at `/tmp/carnova-review`; changed source files are mirrored into this shared workspace. The original `.git` remains read-only and unchanged.

**Done:** fixed stale search retries and stale related-listing requests, added seven regression tests, corrected crash-dump ignore rules, and added the frontend formatting gate to CI.

**Verified now:** 18 frontend tests; production build without warnings (~419 KB raw / ~109 KB transfer); formatting and dependency-tree checks; Java 17-target compilation of all 32 production Java files using the delivered JAR's runtime libraries. See [follow-up review](docs/FOLLOWUP_REVIEW.md).

**Not verified now:** the actual hosted CI conclusion, a fresh Compose/browser run, and a fresh Maven integration test run. This session cannot access GitHub, the local HTTP stack or Docker; pinned Maven test dependencies are not cached. The earlier results below are historical and have not been presented as reruns. Follow-up publication remains pending network access; the updated local bundle carries the new commits.

---

# CarNova v2 — final summary

Rebuilt the platform on **redesign/v2**: Angular 22/Tailwind premium marketplace, complete account/showroom/news/admin flows, deferred 3D studio and driving, offline/local assistant, secured Spring Boot 3.5/Java 17 API, migrations, containers and CI.

**Run:** `docker compose up --build --wait` → http://localhost:8080. The verified stack is already running locally. Review the landing page, a listing, the publishing wizard, `/studio`, then `/admin` (default local demo account and overrides in README).

**Verified:** 24 backend tests on local Maven and Java 17 Docker; 11 frontend unit tests; 5 final browser workflow tests plus 2 accessibility/visual tests. Production build passes without warnings. All three containers healthy. Mobile Lighthouse **96 performance / 100 accessibility / 100 best practices / 100 SEO**, CLS 0. **33 screenshots** reviewed. Runtime npm audit reports zero vulnerabilities. Original uploads/models/assets are preserved.

**Known limits:** external Stripe TEST/Ollama adapters need separately configured services; default mock/offline paths work without accounts. Historical exposed credentials still need owner rotation. The original `.git` is read-only, so commits use `/tmp/carnova-v2.git`; an ignored incremental `redesign-v2.bundle` accompanies the files. See [Git delivery](docs/GIT_DELIVERY.md) before later operations in the original checkout.

**Start reviewing:** [README](README.md), [verification](docs/VERIFICATION.md), [screenshots](docs/screenshots), [decisions](docs/DECISIONS.md). Delivery branch: [redesign/v2](https://github.com/Islem-rb/carnova/tree/redesign/v2). This summary is committed before the final branch push; no deployment or main-branch change is part of delivery.

## Phase 5 — polish and portfolio

Complete: final screenshot and keyboard/reflow review, responsive image optimization, model/brand search regression coverage, strict CSP/header check, code/credential/media review, full README/API/database notes and evidence artifacts. The final branch push follows the final verified commit.

# Phase log

## Phase 1 — audit and direction
Done: application audit, API/data inventory, security priorities, implementation phases and design direction. Verified: baseline b91de95; already on redesign/v2; Docker daemon available; npm registry confirms Angular stable 22.2.4; runtime compatibility checked. Existing uploads/models untouched.

Next: backend modernization, verified tests, frontend rebuild, Compose flows and visual/accessibility/performance review. See docs/PLAN.md, docs/DECISIONS.md and docs/BLOCKERS.md.

## Phase 2 — backend foundation
Done: Spring Boot 3.5.16 / Java 17 target, OAuth2/Nimbus JWT validation, server-assigned roles, BCrypt 12, typed validated DTOs, owner-scoped writes, safe uploads, listing search/details/status, showroom update, test/mock billing, offline/local assistant, news administration, contact inbox, OpenAPI, Flyway V1/V2. Removed arbitrary URL probes, credential logs and Windows-only image shell execution.
Verified: Maven package successful; 14 integration tests pass with real Spring Security and H2 PostgreSQL mode. Tests cover role escalation, password hashing, token tampering, public search privacy, validation, ownership, spoofed uploads, protected admin/news/debug routes, billing ownership/server pricing, assistant, contact, CORS and OpenAPI. PostgreSQL/Compose checks remain in phase 4.

## Phase 3 — frontend rebuild
Done: Angular 22.2.4 standalone application, strict typed forms, signals, functional guards/interceptor and lazy routes; Tailwind 4 semantic light/dark design; all marketplace, account, showroom, auth, news, guide, contact, admin and studio pages. URL-based filters, galleries, favorites, four-step wizard, optional GLB uploads, explicit mock/test checkout, offline assistant dialog, charts and admin inbox. Three.js dynamically imported; model loads cancel on navigation, with loader and fallback; driving mode and keyboard/touch controls. Original UI with locally hosted Manrope, original icon paths and optimized existing assets.
Verified: production build without warnings; initial ~350 KB raw / ~94 KB estimated transfer, below 360/420 KB warning/error budgets. Eleven rendering/security helper tests pass. Prettier formats separated templates, TypeScript and CSS. All selected marketplace images ~452 KB combined. Browser/a11y/visual tests are prepared but not yet marked passed.

## Phase 4 — containers, CI and integration fixes
Done: non-root Java 17 and Nginx containers, PostgreSQL 17, separate persistent media/data volumes, health checks, cached builds, localhost-only ports, `.env.example`, same-origin reverse proxy and security headers. GitHub Actions uses pinned current release commits and verifies Java 17, Node 22, unit/build checks and browser workflows against Compose.
Verified: all three containers healthy; Flyway V1/V2 applied on PostgreSQL; Swagger/OpenAPI works. Backend now has 23 passing tests on both local Maven and the Java 17 Docker build. Core browser workflows and 27 desktop/mobile screenshots passed in the previous complete run; the mobile table audit exposed a keyboard-scroll fix now included in the final run. Corrected model API proxy precedence, native assistant form submission, lazy seller proxy access and public UI labels.
Phase 5: final audit, refreshed screenshots, Lighthouse measurements, final documentation and branch push remain.
