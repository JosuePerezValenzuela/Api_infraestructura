# Seed Batch Order

This directory contains batch seed migrations that populate the infraestructura schema using raw SQL.

Execution order (TypeORM sorts by timestamp):
1. 1760000000001-SeedTipoBloquesBatch.ts
2. 1760000000002-SeedTipoAmbientesBatch.ts
3. 1760000000003-SeedCampusBatch.ts
4. 1760000000004-SeedFacultadesBatch.ts
5. 1760000000005-SeedBloquesBatch.ts
6. 1760000000006-SeedAmbientesBatch.ts

Each migration is global infrastructure data and must be implemented with raw SQL inserts in the up method and matching deletes in down.
