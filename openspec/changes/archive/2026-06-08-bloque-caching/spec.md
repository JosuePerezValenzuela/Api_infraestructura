# Bloque Caching Specification

## Purpose

Add Redis-backed TTL caching to `ListBloquesUseCase` with write-through invalidation on create, update, and delete. Reuses the existing `CacheService` and `CacheKeyBuilder` — the same pattern proven on campus, tipo-bloque, tipo-ambiente, and facultad.

Bloque differs from prior modules: list uses `page/limit` params with 10+ filterable fields (`search`, `orderBy`, `orderDir`, `facultadId`, `campusId`, `tipoBloqueId`, `activo`, `pisosMin`, `pisosMax`). Write use cases have complex validation (geo, relationships, code uniqueness) but invalidation follows the same namespace-clearing approach.

## Requirements

### Requirement: List cache with TTL

`ListBloquesUseCase` MUST wrap `repo.list()` in `CacheService.getOrSet()`. The key MUST be built by `CacheKeyBuilder.list('bloque', { page, limit, search, orderBy, orderDir, facultadId, campusId, tipoBloqueId, activo, pisosMin, pisosMax })`. TTL MUST be configurable via `CACHE_TTL` env var (default: 300s).

#### Scenario: Cache hit returns cached data

- GIVEN a previous `ListBloquesUseCase.execute({ page:1, limit:10, facultadId:3 })` call completed
- WHEN the same input is executed again within the TTL window
- THEN the cached result is returned WITHOUT calling `repo.list()`

#### Scenario: Cache miss after TTL expiry

- GIVEN a cached bloque list entry has exceeded its TTL
- WHEN `ListBloquesUseCase.execute({ page:1, limit:10 })` is called
- THEN `repo.list()` is invoked AND the result is re-cached with a fresh TTL

#### Scenario: Different filter params produce separate cache entries

- GIVEN a cached result for `{ page:1, limit:6, search:'A', facultadId:3 }`
- WHEN a request with `{ page:1, limit:6, search:'A', facultadId:5 }` is executed
- THEN `repo.list()` is called for the new params AND cached independently

### Requirement: Cache invalidation on create

`CreateBloqueUseCase` MUST call `CacheService.invalidateNamespace('bloque:*')` after a successful `repo.create()`, before returning the result.

#### Scenario: Cache cleared after bloque creation

- GIVEN bloque list results are cached
- WHEN a new bloque is created successfully
- THEN the `bloque:*` namespace is invalidated
- AND subsequent list queries fetch fresh data from the database

### Requirement: Cache invalidation on update

`UpdateBloqueUseCase` MUST call `CacheService.invalidateNamespace('bloque:*')` after the final write operation (update + optional cascade deactivation), before returning the result.

#### Scenario: Cache cleared after bloque update

- GIVEN bloque list results are cached
- WHEN an existing bloque is updated successfully
- THEN the `bloque:*` namespace is invalidated
- AND subsequent list queries return up-to-date data

### Requirement: Cache invalidation on delete

`DeleteBloqueUseCase` MUST call `CacheService.invalidateNamespace('bloque:*')` after a successful `repo.delete()`, before returning the result.

#### Scenario: Cache cleared after bloque deletion

- GIVEN bloque list results are cached
- WHEN a bloque is deleted successfully
- THEN the `bloque:*` namespace is invalidated
- AND deleted bloque no longer appears in subsequent list queries

### Requirement: Graceful degradation on Redis failure

The system MUST NOT fail a request when Redis is unavailable. Cache errors MUST be logged and the request MUST fall through to the database.

#### Scenario: Redis down falls through to DB

- GIVEN Redis is unreachable
- WHEN `ListBloquesUseCase.execute()` is called
- THEN the request succeeds with data from `repo.list()`
- AND an error is logged for the failed cache operation

### Requirement: Module registration

`BloqueModule` MUST include `CacheService` in its `providers` array for DI resolution.

#### Scenario: CacheService is available to bloque use cases

- GIVEN the `BloqueModule` is imported
- WHEN a bloque use case is instantiated
- THEN `CacheService` is successfully resolved by the DI container

## Out of Scope

- Single-entity caching (`findById`) — not part of the catalog pattern
- Changes to validation or business logic in write use cases
- New cache infrastructure — reuses existing `CacheService` / `CacheKeyBuilder`
- Spec-level contract changes — caching is transparent to bloque's external interface
