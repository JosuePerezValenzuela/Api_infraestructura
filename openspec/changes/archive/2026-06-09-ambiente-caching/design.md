# Design: Ambiente Caching

## Technical Approach

Phase 1 caches only the two read-only list endpoints already exposed by `src/modules/ambiente/interface/ambiente.controller.ts`: `GET /ambientes` and `GET /ambientes/disponibles`. The implementation follows the repo’s existing module-local pattern from `bloque`, `campus`, `facultad`, and `tipo-bloque`: list use cases call `CacheService.getOrSet(...)` with a deterministic key from `CacheKeyBuilder`, while write use cases invalidate the whole `ambiente:*` namespace after a successful mutation.

`/:id/detalle` and `buscar-ambiente-horarios` stay out of phase 1 by scope.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Cache at use-case level | Add caching in `ListAmbientesUseCase` and `ListAmbientesDisponiblesUseCase` | Controller interceptor, repository cache | Keeps cache scoped to the feature, reuses existing normalization/validation, and matches current module patterns. |
| Shared namespace invalidation | Invalidate `ambiente:*` in `CreateAmbienteUseCase`, `UpdateAmbienteUseCase`, `DeleteAmbienteUseCase`, and `ReplaceHorariosUseCase` | Targeted key deletion per query | List queries have many combinations; namespace invalidation is simpler and guarantees both cached list variants are refreshed. |
| Distinct key families per endpoint | Use separate cache keys for list vs disponibles responses | One key family for both endpoints | The response shapes differ, so keys must not collide even if filters overlap. |

## Data Flow

`GET /ambientes` and `GET /ambientes/disponibles`

`Controller -> UseCase -> CacheService.getOrSet(key, ttl, factory) -> Repository -> Cache write -> Response`

Example keys:
- `ambiente:list:<sorted-query>`
- `ambiente:disponibles:list:<sorted-query>`

Writes (`POST /ambientes`, `PATCH /ambientes/:id`, `DELETE /ambientes/:id`, `PUT /ambientes/:id/horarios`)

`Controller -> UseCase -> Repository/SQL mutation -> CacheService.invalidateNamespace('ambiente:*') -> Response`

## File Changes

| File | Action | Description |
|---|---|---|
| `src/modules/ambiente/ambiente.module.ts` | Modify | Register `CacheService` in the module provider list. |
| `src/modules/ambiente/application/list-ambientes.usecase.ts` | Modify | Inject `CacheService` and `ConfigService`; cache paginated list results. |
| `src/modules/ambiente/application/list-ambientes-disponibles.usecase.ts` | Modify | Inject `CacheService` and `ConfigService`; cache available-rooms queries. |
| `src/modules/ambiente/application/create-ambiente.usecase.ts` | Modify | Invalidate `ambiente:*` after successful create. |
| `src/modules/ambiente/application/update-ambiente.usecase.ts` | Modify | Invalidate `ambiente:*` after successful update. |
| `src/modules/ambiente/application/delete-ambiente.usecase.ts` | Modify | Invalidate `ambiente:*` after successful delete. |
| `src/modules/ambiente/application/replace-horarios.usecase.ts` | Modify | Invalidate `ambiente:*` after successful horario replacement. |
| `src/modules/ambiente/**/*.spec.ts` | Modify | Add cache-hit, cache-miss, key-building, and namespace-invalidation assertions. |

## Interfaces / Contracts

No public API contract changes. Internal cache contracts:

```ts
CacheKeyBuilder.list('ambiente', filters)
CacheKeyBuilder.list('ambiente:disponibles', filters)
cacheService.invalidateNamespace('ambiente:*')
```

TTL remains driven by `CACHE_TTL` with the existing default of `300` seconds.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Key shape, hit/miss behavior, and validation stays unchanged | Jest specs for both list use cases and `CacheKeyBuilder`. |
| Integration | Module wiring and write-path invalidation | `@nestjs/testing` specs for `AmbienteModule` and write use cases with mocked `CacheService`. |
| E2E | Cached reads still match fresh reads | Repeated calls to `GET /ambientes` and `GET /ambientes/disponibles`, then mutate through write endpoints and verify refreshed output. |

## Migration / Rollout

No migration required. Roll out normally with Redis available; if Redis is unavailable, `CacheService` already logs and falls back to the database path.

## Open Questions

- None.
