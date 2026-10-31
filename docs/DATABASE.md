# Database and media preservation

The verified Compose stack uses a new, project-scoped PostgreSQL 17 named volume. It never connects to the database referenced by the original properties, and never modifies the repository's `uploads/` or `models/` directories. Local uploads/models use separate named volumes. Existing demonstration models are copied into a new model volume on first creation.

## New database

Flyway creates V1 (legacy-compatible core tables) and V2 (vehicle/listing specs, galleries, contact inbox and indexes). Hibernate validates the resulting schema. `ddl-auto=update`, automatic baselining and destructive clean are not used. Demo seeding is opt-in with `DEMO_DATA=true` and only runs when the users table is empty. It never overwrites existing accounts/listings.

## Adopting an existing installation

This operation was deliberately not performed during the redesign. Before pointing v2 at existing data:

1. Back up the database and media, and restore the backup into a separate staging database.
2. Compare the staging schema to `V1__legacy_core_schema.sql`, including legacy role values, null owners, column names (`showroom_images.image_data`), constraints and timestamp types.
3. Check whether any old migration was actually applied. The original V2 file was inconsistent and Flyway was not configured in the original POM; an installation that manually adopted it needs its own reviewed migration path.
4. For a schema matching V1 with no Flyway history, explicitly baseline at version 1 using Flyway tooling, then apply V2. Never turn on automatic baseline-on-migrate against an unknown database.
5. Mount copies of the existing upload/model directories using `UPLOADS_DIR` and `MODELS_DIR`, with read/write access for container UID 10001. Rehearse all owner and media flows before switching an installation.
6. Keep the backup and previous release available. Do not try to reverse a migration by deleting data; restore into a separate database for rollback if needed.

The application's public DTOs exclude owner email and password hashes. Public contact phone numbers are intentional and explained in the publishing forms. Original media files are retained even when a listing or showroom is removed, avoiding accidental deletion of shared/historical assets. Operators should define their own retention/cleanup policy before public use.

## Routine local operations

`docker compose down` stops the stack and preserves volumes. Do not use `down -v` unless you deliberately intend to discard the **local demonstration** database and media. No volume deletion is part of this project's normal run or verification commands.
