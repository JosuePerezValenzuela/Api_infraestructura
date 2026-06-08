# Campus Caching Specification

## Purpose

Add Redis-backed TTL caching for campus list queries with write-through invalidation on every write operation (create, update, delete). Reuses the existing `CacheService` and `CacheKeyBuilder` from the shared infrastructure — the same pattern already proven on tipo-ambiente and tipo-bloque.

## Requirements

### Requirement: List cache with TTL

`ListCampusUseCase` MUST wrap `repo.list()` in `CacheService.getOrSet()` with a cache key built by `CacheKeyBuilder.list('campus', { skip, take, search, orderBy, direction, activo })`. The TTL MUST be configurable via `CACHE_TTL` env var (default: 300s).

#### Scenario: Cache hit returns cached data

- GIVEN a previous `ListCampusUseCase.execute({ skip:0, take:10 })` call completed
- WHEN the same input is executed again within the TTL window
- THEN the cached result is returned WITHOUT calling `repo.list()`

#### Scenario: Cache miss after TTL expiry

- GIVEN a cached campus list entry has exceeded its TTL
- WHEN `ListCampusUseCase.execute({ skip:0, take:10 })` is called
- THEN `repo.list()` is invoked AND the result is re-cached with a fresh TTL

#### Scenario: Different params produce separate cache entries

- GIVEN a cached result for `{ skip:0, take:10, activo:true }`
- WHEN a request with `{ skip:0, take:10, activo:false }` is executed
- THEN `repo.list()` is called for the new params AND cached independently

### Requirement: Cache invalidation on create

`CreateCampusUseCase` MUST call `CacheService.invalidateNamespace('campus:*')` after a successful `repo.create()`.

#### Scenario: Cache cleared after campus creation

- GIVEN campus list results are cached
- WHEN a new campus is created successfully
- THEN the `campus:*` namespace is invalidated
- AND subsequent list queries fetch fresh data from the database

### Requirement: Cache invalidation on update

`UpdateCampusUseCase` MUST call `CacheService.invalidateNamespace('campus:*')` after a successful `repo.update()`.

#### Scenario: Cache cleared after campus update

- GIVEN campus list results are cached
- WHEN an existing campus is updated successfully
- THEN the `campus:*` namespace is invalidated
- AND subsequent list queries return up-to-date data

### Requirement: Cache invalidation on delete

`DeleteCampusUseCase` MUST call `CacheService.invalidateNamespace('campus:*')` after a successful `repo.delete()`.

#### Scenario: Cache cleared after campus deletion

- GIVEN campus list results are cached
- WHEN a campus is deleted successfully
- THEN the `campus:*` namespace is invalidated
- AND deleted campus no longer appears in subsequent list queries

### Requirement: Graceful degradation on Redis failure

The system MUST NOT fail a request when Redis is unavailable. Cache read/write errors MUST be logged and the request MUST fall through to the database via the factory function.

#### Scenario: Redis down falls through to DB

- GIVEN Redis is unreachable
- WHEN `ListCampusUseCase.execute()` is called
- THEN the request succeeds with data from `repo.list()`
- AND an error is logged for the failed cache operation

### Requirement: Module registration

`CampusModule` MUST include `CacheService` in its `providers` array so it can be injected into all four use cases.

#### Scenario: CacheService is available to campus use cases

- GIVEN the `CampusModule` is imported
- WHEN a campus use case is instantiated
- THEN `CacheService` is successfully resolved by the DI container

## Out of Scope

- `findById` or single-entity caching (not part of the catalog pattern)
- Campus-to-facultad relationship caching (separate concern)
- New cache infrastructure — reuses existing `CacheService` / `CacheKeyBuilder`
