# Facultad Caching Specification

## Purpose

Add Redis-backed TTL caching to `ListFacultadesUseCase` with write-through invalidation on create, update, and delete. Reuses the existing `CacheService` and `CacheKeyBuilder` — the same pattern proven on campus, tipo-bloque, and tipo-ambiente.

Facultad differs from prior modules: list uses `page/take` params and `findPaginated()` returns `{ items, meta }` directly. Delete is relationship-based but invalidation follows the same namespace-clearing approach.

## Requirements

### Requirement: List cache with TTL

`ListFacultadesUseCase` MUST wrap `repo.findPaginated()` in `CacheService.getOrSet()`. The key MUST be built by `CacheKeyBuilder.list('facultad', { page, take, search, orderBy, orderDir, activo })`. TTL MUST be configurable via `CACHE_TTL` env var (default: 300s).

#### Scenario: Cache hit returns cached data

- GIVEN a previous `ListFacultadesUseCase.execute({ page:1, take:10 })` call completed
- WHEN the same input is executed again within the TTL window
- THEN the cached result is returned WITHOUT calling `repo.findPaginated()`

#### Scenario: Cache miss after TTL expiry

- GIVEN a cached facultad list entry has exceeded its TTL
- WHEN `ListFacultadesUseCase.execute({ page:1, take:10 })` is called
- THEN `repo.findPaginated()` is invoked AND the result is re-cached with a fresh TTL

#### Scenario: Different params produce separate cache entries

- GIVEN a cached result for `{ page:1, take:10, search:'medicina' }`
- WHEN a request with `{ page:2, take:10, search:'medicina' }` is executed
- THEN `repo.findPaginated()` is called for the new params AND cached independently

### Requirement: Cache invalidation on create

`CreateFacultadUseCase` MUST call `CacheService.invalidateNamespace('facultad:*')` after a successful `repo.create()`.

#### Scenario: Cache cleared after facultad creation

- GIVEN facultad list results are cached
- WHEN a new facultad is created successfully
- THEN the `facultad:*` namespace is invalidated
- AND subsequent list queries fetch fresh data from the database

### Requirement: Cache invalidation on update

`UpdateFacultadUseCase` MUST call `CacheService.invalidateNamespace('facultad:*')` after the final write operation (update + optional cascade deactivation).

#### Scenario: Cache cleared after facultad update

- GIVEN facultad list results are cached
- WHEN an existing facultad is updated successfully
- THEN the `facultad:*` namespace is invalidated
- AND subsequent list queries return up-to-date data

### Requirement: Cache invalidation on delete

`DeleteFacultadUseCase` MUST call `CacheService.invalidateNamespace('facultad:*')` after the final write operation (relationship deletion or facultad deletion).

#### Scenario: Cache cleared after facultad deletion

- GIVEN facultad list results are cached
- WHEN a facultad-campus relationship is deleted (with or without cascading facultad deletion)
- THEN the `facultad:*` namespace is invalidated
- AND deleted facultad no longer appears in subsequent list queries

### Requirement: Graceful degradation on Redis failure

The system MUST NOT fail a request when Redis is unavailable. Cache errors MUST be logged and the request MUST fall through to the database.

#### Scenario: Redis down falls through to DB

- GIVEN Redis is unreachable
- WHEN `ListFacultadesUseCase.execute()` is called
- THEN the request succeeds with data from `repo.findPaginated()`
- AND an error is logged for the failed cache operation

### Requirement: Module registration

`FacultadModule` MUST include `CacheService` in its `providers` array for DI resolution.

#### Scenario: CacheService is available to facultad use cases

- GIVEN the `FacultadModule` is imported
- WHEN a facultad use case is instantiated
- THEN `CacheService` is successfully resolved by the DI container

## Out of Scope

- Single-entity caching (`findById`) — not part of the catalog pattern
- Relationship cache between facultad and campus — separate concern
- New cache infrastructure — reuses existing `CacheService` / `CacheKeyBuilder`
- Changes to validation or business logic in write use cases
