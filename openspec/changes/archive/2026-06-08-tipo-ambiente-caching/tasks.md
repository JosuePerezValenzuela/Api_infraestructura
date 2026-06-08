# Tasks: Redis Cache — Tipo-Ambiente

## Review Workload Forecast

| Field | Value |
|-------|--------|
| Estimated changed lines | ~150–180 |
| 800-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | ask-on-risk |

## Phase 1: List Use Case Caching

- [x] 1.1 **ListTipoAmbientesUseCase.caching** — Inject `CacheService` + `ConfigService`. Wrap `repo.list(options)` in `getOrSet(CacheKeyBuilder.list('tipo_ambiente', params), ttl, () => repo.list(options))`. Tests: cache hit skips repo, cache miss calls repo, Redis error falls back.

## Phase 2: Write Use Case Invalidation

- [x] 2.1 **CreateTipoAmbienteUseCase.invalidation** — Inject `CacheService`. Call `invalidateNamespace('tipo_ambiente:*')` after `repo.create()`. Tests: called on success, NOT called on validation error, NOT called on repo error.
- [x] 2.2 **UpdateTipoAmbienteUseCase.invalidation** — Same pattern after `repo.update()`. Tests: same coverage.
- [x] 2.3 **DeleteTipoAmbienteUseCase.invalidation** — Same pattern after `repo.delete()`. Tests: same coverage.

## Phase 3: Module Registration

- [x] 3.1 **TipoAmbienteModule.providers** — Add `CacheService` to the module's providers array.

## Notes

- Pattern validated in `redis-cache-catalog`. Implementation is mechanical — no design decisions required.
- Existing tests (8 per use case) must continue passing alongside new cache tests.
- TTL is read from ConfigService via `CACHE_TTL` env var (default 300).
