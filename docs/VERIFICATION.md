# Verification record

Verified on 31 October 2026 against the local Docker Compose stack. Source implementation is on `redesign/v2`. Full machine-readable evidence: [test summary](reports/test-summary.json), [Lighthouse summary](reports/lighthouse-summary.json), [manual review](reports/manual-review.json), [repository review](reports/repository-review.json).

| Check | Result |
| --- | --- |
| Maven verify, Java 17 target | 24 tests, zero failures/errors/skips |
| Docker backend build on Java 17 | Same 24 tests pass; runnable production JAR |
| Frontend unit tests | 11 pass |
| Frontend production build | Pass, no warnings; strict templates and unused-code checks |
| Bundle budgets | ~419 KB raw / ~109 KB estimated transfer; 420 KB warning / 500 KB error |
| Docker Compose | Frontend, backend and PostgreSQL running and healthy |
| PostgreSQL migrations | Flyway V1/V2 applied; Hibernate validation passes |
| Browser workflows | 5 pass on final backend; signup/login, photo/GLB publishing, mock checkout, search, favorites, status, delete, showroom create/edit, assistant, contact, guards, 3D, drive, fallback and admin publishing |
| Accessibility/visual suite | 2 pass; 39 automated WCAG A/AA audit views plus 16 routes at 320 CSS pixels |
| Browser consoles | Zero errors in normal desktop/mobile page captures |
| Screenshots | 33 desktop/mobile/dark/assistant/3D captures, reviewed |
| Optional 71 MB Datsun | Successfully loaded and rendered; additional screenshot reviewed |
| Runtime npm audit | Zero reported vulnerabilities (including high/critical) |
| Formatting / whitespace | Prettier check and git diff --check pass |
| Credential-pattern review | No matches in changed working-tree text; historical credential values/logs not displayed |
| Original media | Uploads, backend models and original frontend assets unchanged from b91de95 |

## Performance

Mobile Lighthouse 13.6.0 on the local Compose site, simulated throttling:

| Category | Score |
| --- | --- |
| Performance | 96 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |

FCP 0.9 s; LCP 2.6 s; total blocking time 90 ms; CLS **0**. Initial measurements exposed route-loading layout shift; viewport reservation, eager landing content, responsive hero images and CSP-compatible stylesheet loading corrected it. The final two measured runs both scored 96/100/100/100. These are local-run measurements and can vary with hardware/network.

[Open the full local Lighthouse report](reports/lighthouse-mobile.html).

## Visual and interaction review

Desktop 1440×1000, mobile 390×844 and narrow 320×740 were checked. Reviewed landing, filters/results, gallery/detail, auth, account, publishing, showrooms, Journal, guide, contact, administrator charts and the studio. Corrected Journal image sizing/overlap, missing mobile labels, native assistant form navigation, lazy seller access, model proxy routing, table keyboard access and narrow showroom-header wrapping. Captures wait for images and fonts; reduced motion is respected. Dialog sending, Escape, native modal focus, theme persistence, keyboard/touch driving, model fallback and both demonstration models are exercised.

Automated WCAG checks supplement the manual keyboard/layout review; they do not replace every assistive-technology test.

## Scope and limits

- Only a new local demo database and synthetic test accounts were used. Test cleanup removes only records created by this run and retains account/media data; original data is untouched.
- Local mock payments and the offline guide are fully verified. No Stripe account was created or paid API contacted; optional Stripe TEST and user-managed Ollama need their own configured service to exercise those adapters.
- No cloud resources or deployments were created. GitHub Actions configuration is added and pinned; its hosted execution follows the final push and is not claimed as observed here.
- Previously exposed credentials require owner rotation. History was preserved; no credential revocation was attempted.
- Original .git is mounted read-only; see [Git delivery notes](GIT_DELIVERY.md) for the writable metadata copy and recovery bundle.
