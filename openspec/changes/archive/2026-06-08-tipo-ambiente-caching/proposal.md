# Proposal: Redis Cache — Tipo-Ambiente

## Intent

Extend the proven Redis caching pattern from `tipo-bloque` to the `tipo-ambiente` module. The infrastructure (CacheService, CacheKeyBuilder, Redis config) is already in place — this is pure use case integration.

## Scope

### In Scope

- Wrap `ListTipoAmbientesUseCase.repo.list()` with `CacheService.getOrSet` + `CacheKeyBuilder`
- Call `CacheService.invalidateNamespace('tipo_ambiente:*')` after successful `Create`, `Update`, `Delete`
- Register `CacheService` provider in `TipoAmbienteModule`
- Unit tests for all cache behavior (hit/miss/invalidation)

### Out of Scope

- New Redis infrastructure (already shared from `redis-cache-catalog`)
- Configuration changes (REDIS_HOST, REDIS_PORT, CACHE_TTL already in place)
- Controller or repository changes
- Other catalog modules (will be separate changes)

## Tasks

1. **List** — Inject CacheService + ConfigService, wrap `repo.list` in `getOrSet(CacheKeyBuilder.list('tipo_ambiente', params), ttl, () => repo.list(options))`
2. **Create** — Inject CacheService, call `invalidateNamespace('tipo_ambiente:*')` after `repo.create`
3. **Update** — Inject CacheService, call `invalidateNamespace('tipo_ambiente:*')` after `repo.update`
4. **Delete** — Inject CacheService, call `invalidateNamespace('tipo_ambiente:*')` after `repo.delete`
5. **Module** — Register CacheService in `TipoAmbienteModule.providers`

## Risks

- None. Pattern validated in `redis-cache-catalog`. No new dependencies or config.
