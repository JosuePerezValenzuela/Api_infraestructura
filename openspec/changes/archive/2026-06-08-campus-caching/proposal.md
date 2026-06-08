# Proposal: Campus Caching

## Intent

Reduce database load on campus read queries by caching `list-campus` results in Redis, and keep cached data consistent by invalidating the campus namespace on every write operation (create, update, delete). Follows the proven pattern from tipo-ambiente and tipo-bloque.

## Scope

### In Scope
- `ListCampusUseCase` — wrap `repo.list()` in `cacheService.getOrSet()` with `CacheKeyBuilder`
- `CreateCampusUseCase` — call `cacheService.invalidateNamespace('campus:*')` after successful create
- `UpdateCampusUseCase` — call `cacheService.invalidateNamespace('campus:*')` after successful update
- `DeleteCampusUseCase` — call `cacheService.invalidateNamespace('campus:*')` after successful delete
- Register `CacheService` in `CampusModule` providers

### Out of Scope
- `findById` caching (not in the catalog pattern scope — individual entity lookups are not cached)
- Campus-to-facultad relationship caching (separate concern)
- New cache infrastructure (reuses existing `CacheService` / `CacheKeyBuilder`)

## Capabilities

### New Capabilities
- `campus-caching`: Redis-backed TTL cache for campus list queries with write-through invalidation

### Modified Capabilities
None — no existing spec is changing. Pure extension of the shared caching pattern.

## Approach

Mechanical extension of the proven catalog caching pattern:

1. **List use case**: Inject `CacheService` + `ConfigService`, build cache key via `CacheKeyBuilder.list('campus', { skip, take, search, orderBy, direction, activo })`, TTL from `CACHE_TTL` env var (default 300s). Wrap `repo.list()` in `getOrSet()`.
2. **Write use cases**: Inject `CacheService`, call `invalidateNamespace('campus:*')` after each successful repo operation.
3. **Module**: Add `CacheService` to `CampusModule.providers[]`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/modules/campus/application/list-campus.usecase.ts` | Modified | Add cache read wrapping |
| `src/modules/campus/application/create-campus.usecase.ts` | Modified | Add cache invalidation |
| `src/modules/campus/application/update-campus.usecase.ts` | Modified | Add cache invalidation |
| `src/modules/campus/application/delete-campus.usecase.ts` | Modified | Add cache invalidation |
| `src/modules/campus/campus.module.ts` | Modified | Register CacheService provider |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Stale cache after cascade deactivation (update sets campus inactive, cascades to faculties) | Low | Invalidation clears entire `campus:*` namespace — next read fetches fresh data |
| Redis unavailable degrades campus reads | Low | `CacheService` already handles errors gracefully: logs error, falls through to `factory()` |

## Rollback Plan

Revert changes in all 5 files listed above. No schema or config migration needed — pure code change. Deploy revert via standard PR.

## Dependencies

- `src/modules/_shared/infrastructure/cache/cache.service.ts` (exists, proven)
- `src/modules/_shared/infrastructure/cache/cache-key-builder.ts` (exists, proven)
- `CACHE_TTL` env var (already configured for catalog modules)

## Success Criteria

- [ ] `ListCampusUseCase` uses Redis cache on repeated identical queries (verify via Redis MONITOR or cache hit log)
- [ ] Create/update/delete invalidates campus cache — subsequent list queries return fresh data
- [ ] All existing campus unit tests pass without modification
- [ ] Redis unavailability does not break campus CRUD (graceful fallback to DB)
