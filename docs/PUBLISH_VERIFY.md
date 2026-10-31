# Latest retry: connected GitHub, publication rejected by session approval policy

The GitHub plugin is installed and repository/Actions reads now work. The remote branch is still at `c1cfe48`; its [run 41159293499](https://github.com/Islem-rb/carnova/actions/runs/41159293499) passed backend/frontend and six of seven browser tests. The 3D-to-driving case timed out while waiting for the link to become stable after rotation and repainting.

Local correction `cc4151d` renders static scenes when content/camera changes, avoids shader recompilation for color uniforms, and stops rotation on reset. The browser test asserts reset's paused state. All 43 frontend tests, production build and formatting pass; this does not replace the pending hosted browser run.

A 70-file reviewed UTF-8 publication manifest was prepared against the remote base tree, preserving original media and excluding real environment files. The connector's source-tree upload was rejected before mutation: `MCP tool call requires approval, but approval policy is never`. Repository push permission is present; the blocker is this session's tool-approval policy. No commit/ref was created or moved, no new Actions run exists, and existing local/remote history was not rewritten. Latest evidence: [connected-ci.json](reports/connected-ci.json).

The completion commands below still apply in a session with an allowed Git transport. Connector publication is another option only when its write gate permits it; that API route produces a new publication SHA and must preserve/merge the original local history as described in [DECISIONS.md](DECISIONS.md). Local Docker/browser restrictions remain separate from the GitHub connection.

---

# Publish and verify — blocked attempt, 31 October 2026

The request refers to `1916572`; the current local branch also contains the completed account milestone `c8c3ac6`. Both belong in the next fast-forward push of `redesign/v2`. No main-branch change, force push, history rewrite or deployment is involved.

## Actual result

| Check | Observed result |
| --- | --- |
| Push of `c8c3ac6` | Failed before remote contact: `Could not resolve host: github.com` |
| GitHub Actions | Unknown: the repository Actions API/page could not be fetched |
| Docker | Socket access denied at `/var/run/docker.sock` |
| Frontend/API HTTP | Both connections rejected with `Operation not permitted` |
| Desktop/mobile Playwright run | Both cases failed at browser launch: project-local Chromium is absent; no application steps ran |
| Screenshots | None produced by this attempt |

A GitHub plugin was also found, but it is not installed and no connector access is confirmed. No installation, credential inspection or account creation was performed.

These failures do not establish an application defect or a passing release. They establish that this session cannot complete publication or live verification. Newest machine-readable evidence: [publish-verification.json](reports/publish-verification.json). Earlier account and original live-run reports retain their own dates and scopes.

## Prepared and checked

The existing full publishing workflow now runs twice: **1440×1000 desktop** and **390×844 touch-enabled mobile emulation**. It signs up, signs in through the guarded listing route, uploads a photo/GLB, completes mock checkout, publishes and searches using the actual search form. Existing assistant/account/showroom coverage remains. Each variant checks unexpected console/page errors and horizontal overflow, and captures signup, login, published listing and search screenshots when it can run.

The expanded test TypeScript check passes. Full frontend formatting passes. Playwright discovers **10 tests**, including both publishing variants. No production source or dependency changed in this follow-up. Existing cleanup remains restricted to the suite's synthetic account/content; original media and user records are untouched.

## Finish from a session with GitHub, Docker and browser access

Use the normal writable checkout, currently `/tmp/carnova-review`. The shared workspace's original Git index is read-only and still points to the old baseline; do not push from that index. If the temporary checkout is gone, recover a new checkout from the updated bundle using [GIT_DELIVERY.md](GIT_DELIVERY.md).

```bash
cd /tmp/carnova-review
git status --short
git log --oneline -3
git push origin redesign/v2
git rev-parse HEAD
```

Check [CarNova Actions for redesign/v2](https://github.com/Islem-rb/carnova/actions?query=branch%3Aredesign%2Fv2). Inspect the run whose **head SHA equals the revision printed above**; an earlier green run does not verify this version. Check all three jobs: backend, frontend and platform. The platform job already starts Compose and runs the whole browser suite, including both publishing variants. No new workflow configuration is needed.

Run the focused walkthrough locally as well:

```bash
cd /tmp/carnova-review
docker compose up --build --wait
cd carnova-front
# Project dependencies are already available in this checkout.
# In a newly recovered checkout, first install the locked dependencies with npm ci.
PLAYWRIGHT_BROWSERS_PATH=../.cache/ms-playwright node_modules/.bin/playwright install chromium
PLAYWRIGHT_BROWSERS_PATH=../.cache/ms-playwright npm run test:e2e -- --grep 'signup, login, publish'
```

The browser download stays inside the project; these commands install no system dependencies and use only the local mock checkout. The default frontend URL is `http://localhost:8080`. To run all ten browser tests, omit the grep argument. Screenshot/trace artifacts are under `carnova-front/test-results`; the hosted workflow uploads them in `browser-report`. Review the four screenshots for each viewport, then record the actual run URL, exact head SHA and results before marking this phase verified.

Stopping the stack with `docker compose down` preserves the database/media volumes. No volume deletion or deployment is needed.
