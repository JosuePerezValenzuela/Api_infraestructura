# Proposal: Bloque Caching

## Intent

Extend Redis caching to the bloque module following the proven pattern from tipo-bloque, tipo-ambiente, campus, and facultad. Reduce DB load on repeated bloque list reads with 10+ filter combinations.

## Scope

### In Scope
- Add `CacheService` + `ConfigService` to ListBloquesUseCase, wrap `repo.list()` in `cacheService.getOrSet()`
- Add `CacheService` + `cacheService.invalidateNamespace('bloque:*')` to CreateBloqueUseCase after `repo.create()`
- Add `CacheService` + `cacheService.invalidateNamespace('bloque:*')` to UpdateBloqueUseCase after update completes
- Add `CacheService` + `cacheService.invalidateNamespace('bloque:*')` to DeleteBloqueUseCase after `repo.delete()`
- Register `CacheService` in BloqueModule providers
- Cache key includes all filter params (page, limit, search, orderBy, orderDir, facultadId, campusId, tipoBloqueId, activo, pisosMin, pisosMax)
- Update unit tests for all 4 use cases with CacheService mock

### Out of Scope
- Single-bloque cache (`findById` reads) — no pattern precedent in other modules
- Spec-level changes — caching is transparent at the requirements layer

## Capabilities

> Caching is an implementation concern. Bloque's external contract is unchanged.

### New Capabilities
None — caching is transparent at the spec level.

### Modified Capabilities
None — no existing spec's requirements change.

## Approach

Follow the tipo-bloque pattern exactly for each use case:

| Use Case | Injection | Caching Change |
|----------|-----------|----------------|
| ListBloquesUseCase | CacheService + ConfigService | `CacheKeyBuilder.list('bloque', { page, limit, search, orderBy, orderDir, facultadId, campusId, tipoBloqueId, activo, pisosMin, pisosMax })` → `cacheService.getOrSet(key, ttl, () => this.repo.list(options))` |
| CreateBloqueUseCase | CacheService | `cacheService.invalidateNamespace('bloque:*')` after `repo.create()` |
| UpdateBloqueUseCase | CacheService | `cacheService.invalidateNamespace('bloque:*')` after update ops complete |
| DeleteBloqueUseCase | CacheService | `cacheService.invalidateNamespace('bloque:*')` after `repo.delete()` |

List key: `CacheKeyBuilder` filters null/undefined, sorts alphabetically, builds `${resource}:list:${k=v&k2=v2}`. TTL from `CACHE_TTL` env var (default 300s).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/modules/bloque/bloque.module.ts` | Modified | Add `CacheService` to providers |
| `src/modules/bloque/application/list-bloques.usecase.ts` | Modified | Add CacheService+ConfigService, wrap list with getOrSet |
| `src/modules/bloque/application/create-bloque.usecase.ts` | Modified | Add CacheService, invalidate after create |
| `src/modules/bloque/application/update-bloque.usecase.ts` | Modified | Add CacheService, invalidate after update |
| `src/modules/bloque/application/delete-bloque.usecase.ts` | Modified | Add CacheService, invalidate after delete |
| `src/modules/bloque/application/*.spec.ts` (4) | Modified | Add CacheService mock to test setup |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cache connection errors | Low | `getOrSet` falls through to factory on Redis error — no data loss |
| Stale cache after writes | Low | Invalidation runs after every successful write op |
| Constructor bloat (update has 4 deps) | Low | CacheService uses Nest DI — single extra param |

## Rollback Plan

Remove CacheService injection + import from all 4 use cases and module. Revert test files. Single-commit revert.

## Dependencies

- `CacheService` + `CacheKeyBuilder` (already in `_shared/infrastructure/cache/`)

## Success Criteria

- [ ] All 4 use cases compile with CacheService injection
- [ ] ListBloquesUseCase caches and returns from cache on repeated identical queries
- [ ] Create/Update/Delete invalidate `bloque:*` on success
- [ ] Existing unit tests pass with CacheService mock
- [ ] TTL configurable via `CACHE_TTL` env var
