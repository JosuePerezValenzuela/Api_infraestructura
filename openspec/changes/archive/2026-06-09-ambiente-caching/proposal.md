# Proposal: Ambiente Caching

## Intent

Reduce repeated database work on Ambiente catalog reads by adding Redis cache to the two high-traffic list endpoints. Phase 1 intentionally keeps scope local to the Ambiente module and accepts module-level consistency.

## Scope

### In Scope
- Cache `GET /ambientes`
- Cache `GET /ambientes/disponibles`
- Invalidate Ambiente cache on `POST /ambientes`, `PATCH /ambientes/:id`, `DELETE /ambientes/:id`, and `PUT /ambientes/:id/horarios`

### Out of Scope
- `GET /ambientes/:id/detalle`
- `GET /ambientes/buscar-ambiente-horarios`
- Cross-module invalidation for campus/facultad/bloque/tipo-ambiente changes
- New horarios module (horarios remain embedded in Ambiente)

## Capabilities

### New Capabilities
- `ambiente-caching`: Redis-backed TTL caching for ambiente list/disponibles with write-through namespace invalidation.

### Modified Capabilities
- None.

## Approach

Reuse the existing `CacheService`/`CacheKeyBuilder` pattern already used by other catalog modules. Cache keys SHOULD be scoped to `ambiente:*` and separate list vs disponibles queries. Invalidations SHOULD happen only inside Ambiente write use cases after successful persistence. No cross-module cache coordination in phase 1.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/modules/ambiente/application/use-cases/list-ambiente.use-case.ts` | Modified | Cache `GET /ambientes` results |
| `src/modules/ambiente/application/use-cases/list-ambientes-disponibles.use-case.ts` | Modified | Cache `GET /ambientes/disponibles` results |
| `src/modules/ambiente/application/use-cases/create-ambiente.use-case.ts` | Modified | Invalidate `ambiente:*` after create |
| `src/modules/ambiente/application/use-cases/update-ambiente.use-case.ts` | Modified | Invalidate `ambiente:*` after update |
| `src/modules/ambiente/application/use-cases/delete-ambiente.use-case.ts` | Modified | Invalidate `ambiente:*` after delete |
| `src/modules/ambiente/application/use-cases/update-ambiente-horarios.use-case.ts` | Modified | Invalidate `ambiente:*` after horarios update |
| `openspec/specs/ambiente-caching/spec.md` | New | Spec for cache behavior |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Stale reads from joined data (bloque/campus/facultad/tipo_ambiente) | Med | Accept local consistency in phase 1; invalidate on Ambiente writes |
| Horarios changes affecting disponibles | Med | Invalidate on `PUT /ambientes/:id/horarios` |
| Redis outage impacts requests | Low | Follow existing graceful-degradation cache pattern |

## Rollback Plan

Remove cache wrappers from Ambiente list/disponibles use cases, remove namespace invalidation from write use cases, and delete the new spec if needed. This is a transparent optimization rollback; no API contract change.

## Dependencies

- Existing Redis cache infrastructure (`CacheService`, `CacheKeyBuilder`, `CACHE_TTL`)
- Existing Ambiente module use cases and write paths

## Success Criteria

- [ ] `GET /ambientes` and `GET /ambientes/disponibles` return cached results on repeated reads
- [ ] Write operations invalidate `ambiente:*` and refresh subsequent reads
- [ ] Redis failures do not break Ambiente requests
- [ ] New unit/integration tests cover cache hit, miss, and invalidation paths
