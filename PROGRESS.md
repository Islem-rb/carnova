# CarNova v2 progress

## Phase 1 — audit and direction
Done: application audit, API/data inventory, security priorities, implementation phases and design direction. Verified: baseline b91de95; already on redesign/v2; Docker daemon available; npm registry confirms Angular stable 22.2.4; runtime compatibility checked. Existing uploads/models untouched.

Next: backend modernization, verified tests, frontend rebuild, Compose flows and visual/accessibility/performance review. See docs/PLAN.md, docs/DECISIONS.md and docs/BLOCKERS.md.

## Phase 2 — backend foundation
Done: Spring Boot 3.5.16 / Java 17 target, OAuth2/Nimbus JWT validation, server-assigned roles, BCrypt 12, typed validated DTOs, owner-scoped writes, safe uploads, listing search/details/status, showroom update, test/mock billing, offline/local assistant, news administration, contact inbox, OpenAPI, Flyway V1/V2. Removed arbitrary URL probes, credential logs and Windows-only image shell execution.
Verified: Maven package successful; 14 integration tests pass with real Spring Security and H2 PostgreSQL mode. Tests cover role escalation, password hashing, token tampering, public search privacy, validation, ownership, spoofed uploads, protected admin/news/debug routes, billing ownership/server pricing, assistant, contact, CORS and OpenAPI. PostgreSQL/Compose checks remain in phase 4.
