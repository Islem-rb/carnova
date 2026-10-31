# Account essentials

Implemented on `redesign/v2`, following review commit `1916572`.

## Use the features

Start the stack with `docker compose up --build --wait`. The platform remains at **http://localhost:8080**. A local capture inbox is now available at **http://localhost:8025**. It captures account messages for the portfolio demo; nothing is delivered to an external mailbox and no mail account or paid service is required.

1. Create a user at `/inscription`. Open its confirmation message in the capture inbox, follow the link, and explicitly select **Confirmer mon adresse**.
2. Sign in, open **Mon espace → Mon compte** (`/espace/parametres`), and edit your first/last name. Reload to confirm persistence. The email card shows confirmation status and offers a resend when needed.
3. Change your password in the same page. Enter your current password and confirm the new one. The app returns to sign-in and every previously issued session is invalidated.
4. Use **Mot de passe oublié ?** on sign-in. Enter your address, open the reset message in the capture inbox, choose and confirm a new password, then sign in again. The reset link cannot be reused.

A missing, expired or already-used link offers a way to request a new one. Confirmation requires a button click, so opening an email link alone does not consume it. The token is removed from the address bar after the recovery page captures it in memory; after a reload, reopen the original email link.

## Configuration

| Variable | Local default | Purpose |
| --- | --- | --- |
| `FRONTEND_URL` | `http://localhost:8080` | Fixed public origin used in links; never derived from request headers |
| `MAILPIT_URL` | `http://localhost:8025` outside Compose | Capture API origin; Compose uses its internal `http://mailpit:8025` |
| `MAILPIT_PORT` | `8025` | Localhost-only capture inbox port |
| `MAIL_FROM` | `bonjour@carnova.test` | Sender in captured messages |

For Angular development, set `FRONTEND_URL=http://localhost:4200` in the backend environment. When changing `FRONTEND_PORT`, change `FRONTEND_URL` to match. Spring Boot launched through Maven needs exported environment variables; it does not load the root `.env` automatically.

The maintained [Mailpit API](https://mailpit.axllent.org/docs/api-v1/) supports the local HTTP send adapter, avoiding a new application dependency. Compose pins Mailpit to [v1.33.0](https://github.com/axllent/mailpit/releases/tag/v1.33.0). SMTP relay/forwarding is not configured. Its inbox is a development surface bound to localhost, and messages are transient container data. The capture service is independent of the preserved database/upload/model volumes.

## API

All bodies are JSON. Errors retain the existing `message` / validation `fields` contract.

| Method and path | Access | Body / response |
| --- | --- | --- |
| `POST /api/auth/forgot-password` | Public | `{email}`; always the same accepted message for registered, unknown and cooldown-limited addresses |
| `POST /api/auth/reset-password` | Public | `{token,newPassword}`; changes password, consumes link and revokes sessions |
| `POST /api/auth/verify-email` | Public | `{token}`; confirms email and consumes link |
| `POST /api/auth/verification-email` | Authenticated | `{}`; requests a confirmation link; 429 during the 60-second cooldown |
| `GET /api/auth/me` | Authenticated | Existing identity fields plus `prenom`, `nom`, `emailVerified` |
| `PATCH /api/auth/me` | Authenticated | `{prenom,nom}`; returns the private profile |
| `POST /api/auth/change-password` | Authenticated | `{currentPassword,newPassword}`; verifies current password, changes it and revokes sessions |

`/signup` and `/signin` keep their previous response shapes. Public recovery responses never include a link, token or private profile. Profile input cannot change role, email or another user's identity. Email-address changes require a separate reauthentication/verification flow and are outside this milestone.

## Security and persistence

- Flyway **V3** adds account state to `users` without rewriting V1/V2 or deleting records. Existing users start unverified and can continue signing in and using the marketplace. Verification is a visible account status, not a new publishing or login gate.
- Tokens contain 32 cryptographically random bytes. Only their SHA-256 hashes are stored in the account table. Reset and verification have separate fields and cannot be used interchangeably.
- Reset links expire after **30 minutes**; verification links after **24 hours**. Consumption clears the hash. A new issued link replaces the previous one for that purpose.
- Database pessimistic row locks serialize token issuance/consumption and password updates. Request-specific locks are covered by source/integration tests; a fresh real-database run remains pending in this session.
- Passwords use BCrypt. Validation enforces at least 10 characters and a maximum of **72 UTF-8 bytes**, including correct handling of accented characters and emoji. The current password is required for authenticated changes; the new password must differ from the old one.
- A persisted session version increments on every successful reset/change. The real JWT filter compares the version and reads the current role from the database. Legacy tokens without a version remain valid only while the account version is zero. Removed accounts and stale sessions return 401.
- Anonymous reset replies do not reveal account existence. Mail work is queued only after commit, so mailbox/network latency is outside the public request. Existing IP rate limiting applies to all new auth POST routes, with a 60-second per-account resend limit.
- Local mail is best effort with a bounded executor queue and short network timeouts. Failure logs omit addresses, tokens and exception bodies; the user can request another link after the cooldown. No automatic retry or durable mail outbox is claimed.
- Email links use fragments, keeping the token out of HTTP access logs and referrers. Public auth calls omit any stored bearer token so an expired session cannot prevent recovery.

## Verification in this session

- **43 frontend unit tests pass**, including form byte limits, matching confirmation, profile persistence, resend timing, missing/expired links, public interceptor behavior and stale-session handling.
- **34 new backend account tests pass**: 18 service tests, 6 controller tests, 5 capture-adapter/transaction/wiring tests and 5 real JWT security-filter tests. These run through the JUnit launcher with the delivered runtime libraries and available local test libraries; repository doubles isolate persistence. Production/test sources compile with `javac --release 17`; the available test JVM is Java 25. A temporary interface-only Mockito configuration avoids restricted agent attachment. This is supplementary offline validation, not a successful Maven lifecycle claim.
- The production frontend build passes **without warnings**, with an initial bundle of **419.44 KB raw / 109.68 KB estimated transfer**, below the unchanged 420 KB warning budget. Auth/account styles now load with their pages; the dashboard imports its shared management styles too.
- Frontend formatting and new unit/browser test TypeScript checks pass. `docker compose config --quiet` passes.
- Two new database integration tests compile and are included in the Maven suite. Two new Playwright workflows cover captured email → verification → profile update → password change → recovery, plus incomplete links on mobile. Existing accessibility/visual sweeps include the new routes. **These database/browser checks have not run here.**
- Full Maven verification remains blocked by the absent pinned parent/H2 test dependencies and restricted package-network access. Docker/localhost/browser execution and branch publication remain blocked by the current session. No new screenshots or hosted CI success are claimed.

Run the pending complete checks in a session with Docker/network/browser access:

```bash
mvn -B -ntp -f carnova-back/pom.xml verify
npm ci --prefix carnova-front
npm run format:check --prefix carnova-front
npm test --prefix carnova-front
npm run build --prefix carnova-front
docker compose up --build --wait
# From carnova-front, after project-local Chromium is available:
npm run test:e2e
```

Browser tests use `E2E_MAILPIT_URL` (default `http://localhost:8025`) to read only their uniquely addressed local capture messages. They also generate account screenshots in test artifacts; the existing visual suite can refresh the portfolio captures when actually run. Current evidence: [accounts.json](reports/accounts.json).
