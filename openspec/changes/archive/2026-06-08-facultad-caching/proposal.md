# Proposal: facultad-caching

## Intent

Extend Redis caching to the facultad module to reduce database load on repeated reads, following the proven pattern already applied to tipo-bloque, tipo-ambiente, and campus.

## Scope

### In Scope
- Add cache to `ListFacultadesUseCase` via `getOrSet` + `CacheKeyBuilder`
- Add cache invalidation (`facultad:*` namespace) to `CreateFacultadUseCase`
- Add cache invalidation to `UpdateFacultadUseCase`
- Add cache invalidation to `DeleteFacultadUseCase`
- Register `CacheService` in `FacultadModule` providers
- Unit tests for cache behavior in all 4 use cases

### Out of Scope
- Read-through cache for single-entity lookup (`findById`) — not part of pattern
- Changing facultad module exports (fine as-is)
- Modifying existing validation or business logic in write use cases

## Capabilities

### New Capabilities
None — extends existing caching infrastructure; no new spec-level capability.

### Modified Capabilities
None — pure implementation change; no spec-level requirement changes.

## Approach

1. **ListFacultadesUseCase**: inject `CacheService`, `ConfigService`. Build key via `CacheKeyBuilder.list('facultad', params)`. Read `CACHE_TTL` from config. Wrap `repo.findPaginated(query)` in `cacheService.getOrSet()`.

2. **CreateFacultadUseCase**: inject `CacheService`. After `repo.create()`, call `cacheService.invalidateNamespace('facultad:*')`.

3. **UpdateFacultadUseCase**: inject `CacheService`. After `update()` + optional cascade, call `cacheService.invalidateNamespace('facultad:*')`.

4. **DeleteFacultadUseCase**: inject `CacheService`. After the final write (deleteRelationship or deleteFacultad), call `cacheService.invalidateNamespace('facultad:*')`.

5. **FacultadModule**: add `CacheService` to providers array.

Key differences from prior modules:
- List uses `page/take` + `findPaginated()` — cache key uses same param naming
- Write use cases have multiple existing deps — `CacheService` adds one more constructor param
- Delete is relationship-based — invalidation still goes after final write

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/modules/facultad/application/list-facultades.usecase.ts` | Modified | Add cache to list |
| `src/modules/facultad/application/create-facultad.usecase.ts` | Modified | Add cache invalidation |
| `src/modules/facultad/application/update-facultad.usecase.ts` | Modified | Add cache invalidation |
| `src/modules/facultad/application/delete-facultad.usecase.ts` | Modified | Add cache invalidation |
| `src/modules/facultad/facultad.module.ts` | Modified | Register CacheService |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Stale cache on concurrent writes | Low | Namespace invalidation clears all facultad keys after writes |
| Redis unavailable | Low | CacheService catches errors, falls through to repo |
| Cache key collision | Low | Namespace prefix `facultad` is unique across modules |

## Rollback Plan

Revert the 4 use case files and `facultad.module.ts` to pre-change state. No data migration required.

## Dependencies

- `CacheService` available in `_shared/infrastructure/cache/`
- `CacheKeyBuilder` already available
- `CACHE_TTL` env var already configured

## Success Criteria

- [ ] ListFacultadesUseCase serves cached results on repeated identical queries
- [ ] Create/Update/Delete invalidate `facultad:*` namespace after writes
- [ ] All existing facultad tests pass unchanged
- [ ] `pnpm lint` and `pnpm build` pass
