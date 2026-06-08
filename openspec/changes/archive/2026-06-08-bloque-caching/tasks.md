# Tasks: Bloque Caching

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~200–280 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-always |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Foundation — Module wiring

- [x] 1.1 Add `CacheService` to `providers[]` in `src/modules/bloque/bloque.module.ts`

## Phase 2: RED — Write failing cache tests

- [x] 2.1 Refactor `list-bloques.usecase.spec.ts` — add `CacheService` + `ConfigService` mocks; add cache hit (repo not called), miss (factory invoked), and Redis error (falls through) tests
- [x] 2.2 Refactor `create-bloque.usecase.spec.ts` — add `CacheService` mock; add invalidation-called and invalidation-NOT-called (on validation/repo error) tests
- [x] 2.3 Refactor `update-bloque.usecase.spec.ts` — add `CacheService` mock; add invalidation-called and invalidation-NOT-called (on error) tests
- [x] 2.4 Refactor `delete-bloque.usecase.spec.ts` — add `CacheService` mock; add invalidation-called and invalidation-NOT-called (on error) tests

## Phase 3: GREEN — Implement caching

- [x] 3.1 Inject `CacheService` + `ConfigService` in `list-bloques.usecase.ts`; build key via `CacheKeyBuilder.list('bloque', { page, limit, search, orderBy, orderDir, facultadId, campusId, tipoBloqueId, activo, pisosMin, pisosMax })`; wrap `repo.list()` with `cacheService.getOrSet(key, ttl, factory)`
- [x] 3.2 Inject `CacheService` in `create-bloque.usecase.ts`; call `cacheService.invalidateNamespace('bloque:*')` after `repo.create()`
- [x] 3.3 Inject `CacheService` in `update-bloque.usecase.ts`; call `cacheService.invalidateNamespace('bloque:*')` after update + optional cascade block
- [x] 3.4 Inject `CacheService` in `delete-bloque.usecase.ts`; call `cacheService.invalidateNamespace('bloque:*')` after `repo.delete()`

## Phase 4: VERIFY — Focused verification gap closure

- [x] 4.1 Run `docker exec infraestructura-api-dev pnpm exec jest --testPathPatterns='bloque' --verbose` — bloque cache tests pass (hit, miss, recache evidence, invalidation, DI wiring)
- [x] 4.2 Run `pnpm lint` — no lint errors on changed files
