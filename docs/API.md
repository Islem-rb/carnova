# API guide

Base URL: `http://localhost:8081`, or same-origin `/api` through the frontend. Interactive documentation: `/swagger-ui.html`; schema: `/v3/api-docs`. JSON errors contain `message`; validation errors also contain `fields`. Bearer access tokens expire after one hour by default. Only test/mock payment modes are accepted.

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Public, rate limited | nom, prenom, email, password (10–72 characters); always ROLE_USER; 201 |
| POST | `/api/auth/signin` | Public, rate limited | email/password; session token, identity, roles and expiresIn |
| GET | `/api/auth/me`, `/api/auth/test` | Authenticated | Private identity / compatibility check |
| GET | `/api/meta` | Public | Version and explicit portfolio-demo indicator |
| GET | `/api/annonces` | Public | Compatibility array, most recent 100 |
| GET | `/api/annonces/search` | Public | q, marque, carburant, typeVehicule, ville, typeAnnonce, maxPrice, minYear, maxKm, sort, page, size (1–50); returns items/total/page/pages |
| GET | `/api/annonces/{id}` | Public | Listing detail, seller display name, gallery; no email/password |
| GET | `/api/annonces/my-annonces` | Authenticated | Current owner's listings |
| POST | `/api/annonces` | Authenticated | Validated JSON vehicle/listing fields or legacy multipart titre/description/typeAnnonce/image; 201 |
| PUT | `/api/annonces/{id}` | Owner | Full JSON update |
| PATCH | `/api/annonces/{id}/status` | Owner | `{ "statut": "DISPONIBLE" / "RESERVE" / "VENDU" }` |
| DELETE | `/api/annonces/{id}` | Owner | Removes listing record; original media files remain |
| POST | `/api/uploads` | Authenticated | Multipart `image`, JPEG/PNG, 8 MiB and 24 megapixels; decodes/re-encodes image, resizes within 1920×1440, random filename |
| GET | `/uploads/{name}`, `/api/annonces/uploads/{name}` | Public | Confined image serving; no path traversal/symlink escape |
| POST | `/api/models/upload` | Authenticated / owner when linked | Multipart `glb`, optional annonceId; GLB 2.0, 40 MiB, embedded resources only |
| GET | `/api/models/{name}` | Public | Confined GLB serving |
| GET | `/api/showrooms`, `/api/showrooms/{id}` | Public | Bounded directory and detail |
| GET | `/api/showrooms/me` | Authenticated | Owner's showrooms |
| POST / PUT | `/api/showrooms`, `/api/showrooms/{id}` | Authenticated / owner | Validated nom/description/ville/telephone/images/voitures; create 201 |
| DELETE | `/api/showrooms/{id}` | Owner | Showroom and associated vehicle records; media files retained |
| GET | `/api/payments/config` | Public | mock/test, fixed 500 euro cents, publishable TEST key only |
| POST | `/api/payments/create-payment-intent` | Authenticated | Ignores client amounts; fixed €5 test fee |
| POST | `/api/payments/confirm` | Payment owner | `{paymentIntentId}`; checks provider status, amount, currency, metadata in test mode |
| POST | `/api/assistant/chat` | Public, rate limited | `{message, annonceId?}`; offline guide or configured local Ollama; provider explicitly returned |
| GET | `/api/news` | Public | sinceHours 1–87600, limit 1–100 |
| GET | `/api/news/count` | Public | Count only |
| POST | `/api/news`, `/api/news/refresh`, `/api/news/_seed` | Admin | Editorial publishing, fixed-source RSS refresh, compatibility seed |
| DELETE | `/api/news/{id}` | Admin | Remove chosen article |
| POST | `/api/contact` | Public, rate limited | `{name,email,message}`; persists inbox entry; no external email sent |
| GET | `/api/admin/overview` | Admin | Counts, six-month publication chart, recent listings, last 50 contact messages |
| GET | `/actuator/health` | Public | Readiness including database health; no details |

Listing JSON uses French field names: `titre`, `description`, `typeAnnonce`, `marque`, `modele`, `annee`, `prix` (TND), `kilometrage`, `carburant`, `boiteVitesse`, `couleur`, `ville`, `typeVehicule`, `telephone`, `images`, `model3dUrl`. Enum values remain French uppercase. Empty photos/model are permitted. Legacy listings with missing specs show an explicit unspecified value.

Intentional security changes and removals are documented in [DECISIONS.md](DECISIONS.md). Public URL probing, destructive bulk news purging, nonexistent photo-to-3D reconstruction and test-token UI routes are not recreated.
