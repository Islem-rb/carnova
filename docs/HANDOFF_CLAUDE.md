# CarNova — Claude Code handoff

## Immediate objective

Continue the existing redesign's **publish and verify** phase. Do not restart the redesign or add unrelated features. The latest application code is published; finish the remaining 3D browser failure, achieve green CI, review the captured desktop/mobile screens, update evidence/progress, and push `redesign/v2`.

This handoff supersedes older documentation saying the branch is unpublished or the new account flows were never exercised. Those statements describe previous sessions. Check actual current GitHub state before acting.

## Repository and authoritative checkout

- Repository: `https://github.com/Islem-rb/carnova`.
- Shared project files: `/home/islem/Projects/carnova`.
- **Use the normal writable checkout `/tmp/carnova-review`, branch `redesign/v2`.** Its tree was clean before this handoff; the handoff adds only documentation/evidence.
- The original shared workspace's `.git` was read-only and still points to `b91de95745d7eff6ff1ca20d0bee8343e8358855`, despite newer source files being mirrored there. Do not reset, pull into, or push from that old index. Normal root `git status` therefore misrepresents the delivered changes.
- An ignored incremental bundle `/home/islem/Projects/carnova/redesign-v2.bundle` preserves all redesign/follow-up commits after `b91de95`. See `docs/GIT_DELIVERY.md` if `/tmp/carnova-review` has disappeared. Recover into a fresh normal checkout; do not overwrite the shared source or user data.
- Frontend `node_modules` in the temporary checkout is a symlink to the shared project's existing dependencies. Keep application/test changes in the normal checkout and mirror reviewed changed files back to the shared project, checking for concurrent edits before overwrite.
- Some session-specific source/test libraries and logs are in `/tmp`; do not rely on them instead of normal project commands when your environment can build/test normally.

## Published history

The user successfully ran this from their own terminal:

```bash
git -C /tmp/carnova-review push git@github.com:Islem-rb/carnova.git refs/heads/redesign/v2:refs/heads/redesign/v2
```

GitHub was independently checked afterward. Remote `redesign/v2` points to **`c1921b07e9a56a2860732009eaaf305bd748e58f`**. This includes the original local commits and preserves history:

- `c1cfe48`: original redesign delivery.
- `1916572`: search/detail cancellation fixes, regression tests, ignore-rule fix, CI formatting gate.
- `c8c3ac6`: password reset, email verification/resend, profile settings, password changes and JWT revocation.
- `022aefe`: complete publishing workflow on desktop and touch-mobile, form-based search and screenshot checkpoints.
- `cc4151d`: viewer idle rendering/paint/reset correction.
- `c1921b0`: connected-CI/write-gate documentation.

A documentation-only handoff commit may follow `c1921b0` locally; inspect `git log`. The application source tested below is exactly `c1921b0`. No connector-generated replacement commits, force pushes, rebases or main changes occurred.

## Actual hosted CI results — latest run

Run: **https://github.com/Islem-rb/carnova/actions/runs/41212911198**

Revision: `c1921b07e9a56a2860732009eaaf305bd748e58f`.

| Job | Observed result |
| --- | --- |
| Backend, job `124571445528` | **Success:** Maven verify on Java 17; **60 tests**, zero failures/errors/skips, including V3 account persistence tests |
| Frontend, job `124571445298` | **Success:** clean dependency install, formatting, **43 tests**, production build without warnings; initial **419.44 KB / 109.68 KB transfer**, unchanged 420 KB warning budget |
| Platform, job `124571445692` | Docker builds succeed, including the same 60 backend tests; Postgres/backend/frontend/Mailpit start successfully; browser suite has **9 passed, 1 failed** |

The following browser checks **passed on that actual published revision**:

- Automated accessibility, dark-mode and narrow reflow sweep.
- Email verification, profile persistence, authenticated password change, reset through real local Mailpit capture, revocation and single-use reset link.
- Incomplete recovery links on mobile.
- Full signup → login → listing wizard → photo/GLB uploads → mock checkout → publication → actual search form on **1440×1000 desktop**.
- The same complete flow on **390×844 touch-enabled mobile emulation**.
- Assistant, favorites and owner/showroom management inside those flows.
- Contact, responsive navigation, theme persistence and guarded administration.
- 3D loading failure fallback.
- Admin editorial publishing/removal.
- Desktop/mobile visual capture with clean browser console checks.

The sole failure is `tests/platform.spec.ts`, test **“3D model loads, orbit controls work and driving is available”** (around line 134 at `c1921b0`). It exceeds **90 seconds** in both its initial attempt and retry. The current logs do not identify the exact pending action, so inspect its trace; do not assume it is still the same line as the earlier run.

## Trace and artifact needed for the remaining failure

Artifact: **https://github.com/Islem-rb/carnova/actions/runs/41212911198/artifacts/13047108038**

Name `browser-report`, artifact ID `13047108038`, ZIP ~31 MB. Contains the HTML report, trace ZIPs/error contexts and captured test images. Important entries include:

- `test-results/platform-3D-model-loads-or-60521-rk-and-driving-is-available/trace.zip`
- Its `-retry1` counterpart and `error-context.md` files.
- Publishing checkpoints (`signup`, `login`, `published-listing`, `search`) for desktop/mobile, plus account captures.

If authenticated GitHub CLI is available in your session:

```bash
gh run download 41212911198 -R Islem-rb/carnova -n browser-report -D /tmp/carnova-ci-41212911198
```

Use existing tools/authentication; no global installs or credential printing. Inspect trace events, screenshots and the last completed/pending action, then reproduce the focused test against the running stack. The default whole-suite command is `npm run test:e2e --prefix carnova-front`; focused command from `carnova-front` is `node_modules/.bin/playwright test tests/platform.spec.ts --grep '3D model loads'`.

Codex could obtain the artifact download reference through GitHub but could not transfer ZIP bytes locally because shell DNS was blocked. A text-input request asked the user to download `browser-report.zip` and supply its local path. **No path/file was provided before handoff.** Check Downloads/project cache or ask for the path only if your own tools cannot fetch it. The artifact was not visually reviewed locally; do not claim otherwise.

## Previous 3D diagnosis and attempted correction

Earlier hosted run `41159293499`, revision `c1cfe48`, had backend/frontend success and 6/7 browser tests passing. Its failure explicitly waited forever for the **Conduire** link to become stable after starting rotation, resetting the view and selecting paint.

Commit `cc4151d` changed:

- `carnova-front/src/app/shared/three-engine.ts`: static viewer draws only when OrbitControls reports a camera change or scene/paint/resize is dirty. Driving remains animated. Painting updates color uniforms without `material.needsUpdate` shader recompilation.
- `shared/viewer.ts` + `viewer.html`: `resetView()` stops auto-rotation, updates the rotating signal and resets the scene.
- Browser test asserts reset exposes the paused rotation control before proceeding.

That correction passes strict production compilation, formatting and all 43 frontend unit tests. On the latest hosted run, accessibility completed in ~65 seconds versus ~236 seconds originally, but the **driving workflow still timed out**. Do not describe the remaining failure as fixed. Inspect the latest trace rather than increasing timeouts, using forced clicks, or skipping the test to obtain a green badge. Consider software WebGL performance/continuous driving rendering only if the trace supports it. Keep useful performance changes unless evidence calls for another approach.

## Existing product and architecture

- Angular **22.2.4**, standalone components/signals, typed forms, lazy routes, Tailwind 4, Three.js, French-first marketplace. No Bootstrap.
- Spring Boot **3.5.16**, Java 17, PostgreSQL 17, Spring Security JWT, Flyway V1–V3, OpenAPI, protected owner/admin operations, validated uploads, mock/Stripe TEST payments, offline/optional local Ollama assistant.
- All main marketplace, showroom, admin, news, contact, studio/driving and account features are implemented. Account settings: `/espace/parametres`; recovery/verification routes are in `routes.ts`.
- Local mail is captured by **Mailpit v1.33.0**, not external SMTP. Password changes/reset revoke JWT sessions via persisted version. Existing users can sign in without a new verification gate.
- Run stack: `docker compose up --build --wait`; app `http://localhost:8080`, API `8081`, capture inbox `8025`.
- Existing screenshots/Lighthouse 96/100/100/100 are **historical original local measurements**. Do not claim Lighthouse was rerun for the current revision.

Useful documents: `README.md`, `PROGRESS.md`, `docs/AUDIT.md`, `docs/PLAN.md`, `docs/DECISIONS.md`, `docs/ACCOUNTS.md`, `docs/API.md`, `docs/DATABASE.md`, `docs/GIT_DELIVERY.md`, and the latest hosted report. Older blocker and verification files must be read with their dated scope; current publication/60-test/account/mobile outcomes above supersede earlier pending statuses.

## Environment restrictions: retest, do not assume

These were **Codex-session restrictions**, not necessarily Claude Code restrictions:

- Shell GitHub DNS and local HTTP were blocked; Docker socket denied.
- GitHub plugin **reads work** and repo metadata grants push permission, but write tools were rejected: “MCP tool call requires approval, but approval policy is never.” No API mutation occurred. Do not bypass a denied tool gate.
- Normal user-terminal SSH push works. Original system SSH config also failed owner checks in Codex; a per-command `-F /dev/null` read-only probe then failed DNS. Do not modify system SSH files/permissions or inspect keys.
- Codex Maven cache lacked pinned parent/H2 dependencies, but **hosted Maven/Docker now ran all 60 tests successfully**. Do not downgrade dependencies to fit an offline cache.

First test your own allowed Git/Docker/browser access. Prefer a real local reproduction and normal Git push if available. If only the user can push, complete and verify concrete changes locally before giving the exact branch-scoped command; do not ask for redundant task approval.

## Non-negotiable user boundaries and workflow

- Work only on **`redesign/v2`**. Never touch main, force-push, amend/rebase or rewrite history.
- Never read/print/commit real secrets. Config stays environment-based, `.env.example` uses placeholders, Stripe TEST/mock only. Existing synthetic test fixtures/local demo defaults are not production secrets.
- No deployments, cloud provisioning, paid services, purchases, account creation or global/system installs/changes. Project-local dependencies/browser downloads are allowed.
- Preserve original user data, `uploads/`, `models/`, and existing assets. Test cleanup only affects its own synthetic records.
- No copied copyrighted designs/assets; reuse existing design system and licensed assets.
- Work autonomously within scope; do not ask approval repeatedly. Record reasonable decisions in `docs/DECISIONS.md`.
- Small verified changes and clear commits. Run checks appropriate to the changed code, fix failures, and do not call a phase complete on assumption. After about five distinct failed approaches, document a blocker and safe fallback instead of looping forever.
- Keep `PROGRESS.md` current, distinguish source/runtime/CI evidence and old/current runs. Update the root bundle and mirrored reviewed source if continuing to use the temporary checkout.
- Finish with exact published SHA/run URL and honest remaining limitations. All-green CI and actual reviewed artifacts are the desired endpoint, not a deployment.
