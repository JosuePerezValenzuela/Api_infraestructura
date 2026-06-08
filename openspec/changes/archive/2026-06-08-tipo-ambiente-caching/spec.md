# Redis Cache — Tipo-Ambiente: Specification

## Purpose

Extend the Redis caching pattern (pilot-validated on tipo-bloque) to the tipo-ambiente module. Reduce DB load on list reads and invalidate cache on writes.

## Requirements

### R1: Cache reads — ListTipoAmbientesUseCase

`ListTipoAmbientesUseCase.execute()` wraps `repo.list(options)` in `CacheService.getOrSet` with a key built by `CacheKeyBuilder.list('tipo_ambiente', params)`.

- **R1.1** On cache hit: returns cached value, `repo.list` is NOT called, factory NOT invoked.
- **R1.2** On cache miss: calls `repo.list`, stores result in Redis via `setex` with configured TTL.
- **R1.3** On Redis error (get or set): falls back to factory, logs error via Logger.
- **R1.4** On factory error: propagates the error, cache NOT modified.

### R2: Invalidate on create — CreateTipoAmbienteUseCase

`CreateTipoAmbienteUseCase.execute()` calls `CacheService.invalidateNamespace('tipo_ambiente:*')` after a successful `repo.create()`.

- **R2.1** Invalidation is called after successful creation.
- **R2.2** Invalidation is NOT called when a validation error is thrown.
- **R2.3** Invalidation is NOT called when `repo.create()` throws.

### R3: Invalidate on update — UpdateTipoAmbienteUseCase

Same as R2 but after `repo.update()`.

- **R3.1** Invalidation called after successful update.
- **R3.2** Invalidation NOT called on validation error.
- **R3.3** Invalidation NOT called on `repo.update()` error.

### R4: Invalidate on delete — DeleteTipoAmbienteUseCase

Same as R2 but after `repo.delete()`.

- **R4.1** Invalidation called after successful delete.
- **R4.2** Invalidation NOT called on validation error (invalid id).
- **R4.3** Invalidation NOT called on `repo.delete()` error.

### R5: Provider registration

`TipoAmbienteModule` registers `CacheService` in its providers array for injection into use cases.

## Config

No new config. Reuses existing `CACHE_TTL`, `REDIS_HOST`, `REDIS_PORT` from shared config.

## Test Scenarios

| Scenario | Assertion |
|----------|-----------|
| Cache hit returns cached, factory not called | `repo.list` not invoked |
| Cache miss calls factory and stores | `setex` called with JSON result |
| Redis get throws | Factory called, result returned, error logged |
| Redis setex throws | Factory result returned, error logged |
| Invalidación post-create | `invalidateNamespace` called with `'tipo_ambiente:*'` |
| No invalidation on create validation error | `invalidateNamespace` NOT called |
| No invalidation on create repo error | `invalidateNamespace` NOT called |
| Invalidación post-update | same as create |
| Invalidación post-delete | same as create |
