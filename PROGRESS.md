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
