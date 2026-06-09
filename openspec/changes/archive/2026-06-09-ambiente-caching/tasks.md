# Tasks: Ambiente Caching

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 320-460 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: read-path cache + module wiring → PR 2: write invalidations + remaining specs |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Cache `GET /ambientes` and `GET /ambientes/disponibles` | PR 1 | Base = current feature branch; include list specs + module spec |
| 2 | Invalidate `ambiente:*` on writes | PR 2 | Base = PR 1 branch; include write specs and success-path invalidation |

## Phase 1: RED — Cache read paths

- [x] 1.1 Add failing assertions in `src/modules/ambiente/application/list-ambientes.usecase.spec.ts` for `CacheService.getOrSet`, `CacheKeyBuilder.list('ambiente', ...)`, and cache-hit behavior.
- [x] 1.2 Add failing assertions in `src/modules/ambiente/application/list-ambientes-disponibles.usecase.spec.ts` for separate `ambiente:disponibles` keys and cache isolation.
- [x] 1.3 Add `src/modules/ambiente/ambiente.module.spec.ts` to prove `CacheService` is registered and injected into Ambiente use cases.

## Phase 2: GREEN — Implement cache/invalidation

- [x] 2.1 Update `src/modules/ambiente/ambiente.module.ts` to provide `CacheService`.
- [x] 2.2 Wire `src/modules/_shared/infrastructure/cache/cache.service.ts` and `src/modules/_shared/infrastructure/cache/cache-key-builder.ts` into `src/modules/ambiente/application/list-ambientes.usecase.ts` and `list-ambientes-disponibles.usecase.ts`, using `CacheKeyBuilder.list(...)` and `CACHE_TTL`.
- [x] 2.3 In `create-ambiente.usecase.ts`, `update-ambiente.usecase.ts`, `delete-ambiente.usecase.ts`, and `replace-horarios.usecase.ts`, call `invalidateNamespace('ambiente:*')` only after successful persistence.
- [x] 2.4 Keep `get-ambiente-completo.usecase.ts` and `buscar-ambiente-horario.usecase.ts` unchanged.

## Phase 3: Verification

- [x] 3.1 Extend write-use-case specs to assert no invalidation on validation/not-found failures and invalidation on success.
- [x] 3.2 Add cache-miss/cache-hit and distinct-query-key coverage for both list specs.
- [x] 3.3 Run focused Ambiente tests to confirm repeated reads hit cache and writes refresh subsequent reads.

## Phase 4: Cleanup

 - [x] 4.1 Remove any temporary test helpers and align imports/order with ESLint + Prettier.
