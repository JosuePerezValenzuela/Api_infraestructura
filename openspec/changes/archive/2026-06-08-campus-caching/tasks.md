# Tasks: Campus Redis Caching

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~228 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Foundation — Module Wiring

- [x] 1.1 Add `CacheService` import + provider entry in `src/modules/campus/campus.module.ts`

## Phase 2: List Caching — Read Path

- [x] 2.1 Inject `CacheService` + `ConfigService` into `src/modules/campus/application/list-campus.usecase.ts`; add `CacheKeyBuilder.list('campus', {skip, take, search, orderBy, direction, activo})` key and wrap `repo.list()` + meta computation in `cacheService.getOrSet()` with TTL from `ConfigService`

## Phase 3: Write Invalidation

- [x] 3.1 Inject `CacheService` into `src/modules/campus/application/create-campus.usecase.ts`; call `cacheService.invalidateNamespace('campus:*')` after `repo.create()`
- [x] 3.2 Inject `CacheService` into `src/modules/campus/application/update-campus.usecase.ts`; call `cacheService.invalidateNamespace('campus:*')` after cascade deactivation step
- [x] 3.3 Inject `CacheService` into `src/modules/campus/application/delete-campus.usecase.ts`; call `cacheService.invalidateNamespace('campus:*')` after `repo.delete()`

## Phase 4: Testing

- [x] 4.1 Add cache hit (returns cached data without calling repo), cache miss (calls repo), and Redis error (falls through to DB) tests to `src/modules/campus/application/list-campus.usecase.spec.ts`
- [x] 4.2 Create `src/modules/campus/application/create-campus.usecase.spec.ts` with invalidation-called-after-success and no-invalidation-on-validation/repo-error tests
- [x] 4.3 Add invalidation-called-after-success and no-invalidation-on-validation/repo-error tests to `src/modules/campus/application/update-campus.usecase.spec.ts`
- [x] 4.4 Add invalidation-called-after-success and no-invalidation-on-error tests to `src/modules/campus/application/delete-campus.usecase.spec.ts`
