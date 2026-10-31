# Implementation plan

Every phase ends in a commit after its stated checks; failures are fixed before continuing. No change to main; no deployments or paid API calls.

1. **Audit and direction** — inspect application; document endpoints, model, risks and original design tokens. Check: audit/plan/decisions exist, branch is redesign/v2.
2. **Backend foundation and API** — Spring Boot 3.5 / Java 17; consolidated dependencies; env config; Flyway baseline and additive migration; validation and safe response DTOs; secure auth/ownership/files; safe payment mock/test adapter; assistant local fallback; OpenAPI; core integration tests. Check: Maven package/test and PostgreSQL startup/migration.
3. **Frontend foundation and product** — latest stable Angular 22 standalone/signals, strict typed forms, lazy routes, functional auth; Tailwind v4; responsive original design; all product pages; Three.js deferred with fallback; account/admin workflows. Check: production build budgets and browser flows.
4. **Local platform and CI** — non-root containers, PostgreSQL health checks and named volumes, sample config, GitHub Actions. Check: docker compose up --build, health, signup/login/listing/search/showroom/3D/assistant end to end.
5. **Polish and portfolio** — desktop/mobile screenshots; review and fix visual issues; automated accessibility/browser checks and Lighthouse; README architecture/run/screenshots; final secret/dead-code review. Check: clean production build/test/e2e, record real measurements and limitations; push redesign/v2.

## Completion policy
PROGRESS.md records evidence, not assumed success. Five materially different failed approaches produce an entry in docs/BLOCKERS.md and a safe fallback. Never delete uploads/models or user data. A new local Compose database is used for verification. Existing database adoption requires a backup and schema review described in the README.
