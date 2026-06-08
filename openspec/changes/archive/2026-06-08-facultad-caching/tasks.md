# Tasks: Facultad Redis Caching

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~280 (additions only) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-always |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Foundation

- [x] 1.1 Register `CacheService` in `FacultadModule` providers (add import + provider entry)

## Phase 2: List Cache

- [x] 2.1 Inject `CacheService` + `ConfigService` in `ListFacultadesUseCase`, read `CACHE_TTL`, build key via `CacheKeyBuilder.list('facultad', {page, take, search, orderBy, orderDir, activo})`
- [x] 2.2 Wrap `repo.findPaginated(query)` in `cacheService.getOrSet(key, ttl, factory)`
- [x] 2.3 Add cache hit/miss/Redis-error tests to `list-facultades.usecase.spec.ts`

## Phase 3: Write Invalidation

- [x] 3.1 Inject `CacheService` in `CreateFacultadUseCase`, call `invalidateNamespace('facultad:*')` after `repo.create()`
- [x] 3.2 Add invalidation test (called on success, NOT called on error) to `create-facultad.usecase.spec.ts`
- [x] 3.3 Create `update-facultad.usecase.spec.ts` — migrate existing update tests + add invalidation test
- [x] 3.4 Inject `CacheService` in `UpdateFacultadUseCase`, call `invalidateNamespace('facultad:*')` after update + optional cascade
- [x] 3.5 Add invalidation test for update to `update-facultad.usecase.spec.ts`
- [x] 3.6 Inject `CacheService` in `DeleteFacultadUseCase`, call `invalidateNamespace('facultad:*')` once after the if/else block
- [x] 3.7 Add invalidation tests (both delete paths) to `delete-facultad.usecase.spec.ts`

## Phase 4: Verify

- [x] 4.1 Run `pnpm lint && pnpm build && pnpm test` — confirm all pass
