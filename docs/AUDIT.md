# CarNova v1 audit

Audit baseline: `b91de95`, 31 October 2026. All application source, configuration keys, manifests, templates, styles and tests inspected. Credential values and historical logs deliberately excluded from output. Uploads and models must be preserved.

## Product and routes
Angular 16 NgModule application with eager routes: `/Home`, `/Login`, `/Registre`, `/admin`, `/espace`, listing/showroom creation and management, showroom details, `/info`, about, contact, actualités and four guide pages (FCR, customs, inspection, vignette). Listing search is in-memory on the homepage; no standalone listing details. Assistant is an embedded bubble. Three.js implements orbit/parts exploration and a driving modal. Admin is a stub. Contact calls an absent endpoint. Showroom update and 3D reconstruction calls have no backend implementation. Several test routes expose authentication state.

## Existing API
| Area | Method and path | Behavior / issues |
| --- | --- | --- |
| Auth | POST `/api/auth/signup`, `/signin`; GET `/test` | BCrypt exists, but caller chooses role; no `@Valid`; password/hash/JWT logging |
| Listings | GET/POST `/api/annonces`; GET `/my-annonces`; DELETE `/{id}` | Multipart creation, optional image; payment gate; owner delete. Public method annotation conflicts with authenticated filter chain. No detail/search endpoint |
| Images | GET `/api/annonces/uploads/{filename}`, `/uploads/**` | Missing consistent static mapping and path confinement |
| Showrooms | POST `/api/showrooms`; GET `/me`, `/{id}`; DELETE `/{id}` | Entity binding; delete has no ownership check; nested user leaks password hash; no PUT |
| Models | POST `/api/models/upload`; GET `/{filename}` | Upload can mutate another owner's listing; trusting MIME alone; unconstrained path resolution |
| Assistant | POST `/api/assistant/chat` | Hosted or Ollama requests; no body validation/timeouts; upstream exception details returned; unrestricted public work |
| News | GET `/api/news`, `/count`; POST `/_seed`, `/refresh`; DELETE `/purge-non-tn` | Public mutation endpoints; RSS refresh; destructive purge exposed too broadly |
| Debug | GET `/api/news/debug/ping?url=...`, `/quickcheck` | Arbitrary server-side URL fetch (SSRF), remove |
| Payments | POST `/api/payments/create-payment-intent`, `/confirm` | Caller-controlled amount; confirmation never verifies Stripe success or owner |
| Car3DSearch | empty class | No implemented API |

## Data model
PostgreSQL entities: `users` (nom, prenom, email, BCrypt password, role); `annonces` (titre, description, type, status, image URL, model URL, user FK, payment FK); `payments` (Stripe ID, email, double amount, currency, status); `showrooms` (name, description, user FK), `showroom_images` (text images), `vehicules` (brand, model, year, price, color, showroom FK); `news_items` (UUID, title, summary, image, source, date, unique key). Listing vehicle specs DTO exists but is unused. JPA schema update is used; the single V2 migration references a column different from the entity. There is no initial Flyway migration. No database connection or existing data touched during audit.

## Security priorities
1. Remove embedded configuration credentials without displaying values. Ignore runtime logs and environment files; existing leaked credentials require owner rotation outside this run.
2. Server assigns roles; bounded DTO validation; explicit response DTOs; no sensitive logs.
3. Specific public read endpoints; administrator news/admin APIs; owner-scoped writes; bounded uploads with decoded images/GLB headers and confined paths.
4. Consolidated env-based CORS, expiring signed JWTs, generic JSON errors, no arbitrary URL debug endpoint.
5. Server-authoritative test payment amounts and status checks; isolated local mock mode, no live keys accepted.

## Engineering and UX
POM has repeated JJWT, JAXB, ROME, Lombok and Web dependencies; unused MySQL/Feign/mail dependencies. Only an empty Spring context test. Frontend specs include copied implementation instead of real tests. Bootstrap, CDN Tailwind and Font Awesome are mixed, with document wrappers inside templates. Hardcoded localhost APIs, persistent bearer tokens, missing guards, placeholder links, inconsistent language/currency, broken poster images, autoplay videos, no shared tokens or consistent error/empty states. Heavy Three.js imports are eager. Actual assets are ~170 MB, including 71 MB and 36 MB GLBs, videos and ~12 MB HDR; larger than the brief estimate. No Docker or CI or root README.

## Environment
Node 22.23.1, Java 25, Maven 3.9.11, Docker 29.9.2 / Compose 5.6.1. Cache writes must remain within repository or /tmp. Angular registry latest stable is 22.2.4 (CLI/build 22.2.5); compatible Node is present. Java 17 remains the application target and container runtime. Superdesign preflight runs but is not authenticated; no account creation, paid generation or deployment allowed. Original in-repository UI design will be implemented directly.
