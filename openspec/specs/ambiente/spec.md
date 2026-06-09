# Ambiente Caching Specification

## Purpose

Phase 1 adds Redis-backed TTL caching only for `GET /ambientes` and `GET /ambientes/disponibles`. Cache behavior is local to the Ambiente module, uses the `ambiente:*` namespace, and is invalidated only by Ambiente write operations. No cross-module invalidation is included in this phase.

## Requirements

### Requirement: Cache `GET /ambientes`

The system MUST cache responses for `GET /ambientes` with a module-local cache key under `ambiente:*`. The cache TTL MUST follow the shared cache configuration.

#### Scenario: Repeated list request returns cached data

- GIVEN `GET /ambientes` has already been called successfully
- WHEN the same request is executed again within the TTL window
- THEN the cached response is returned
- AND the database query is not executed again

#### Scenario: Different list parameters are cached separately

- GIVEN `GET /ambientes` is requested with one filter set
- WHEN the same endpoint is requested with a different filter set
- THEN a separate cache entry is used
- AND the two responses do not overwrite each other

### Requirement: Cache `GET /ambientes/disponibles`

The system MUST cache responses for `GET /ambientes/disponibles` with a separate module-local cache key under `ambiente:*`. The cache for this endpoint MUST be independent from `GET /ambientes`.

#### Scenario: Repeated disponibles request returns cached data

- GIVEN `GET /ambientes/disponibles` has already been called successfully
- WHEN the same request is executed again within the TTL window
- THEN the cached response is returned
- AND the database query is not executed again

#### Scenario: Disponibles cache is isolated from list cache

- GIVEN `GET /ambientes` and `GET /ambientes/disponibles` are both cached
- WHEN one endpoint is requested again
- THEN only that endpoint's cache entry is used
- AND the other cache entry remains unchanged

### Requirement: Invalidate Ambiente cache on writes

The system MUST invalidate the `ambiente:*` namespace after successful `POST /ambientes`, `PATCH /ambientes/:id`, `DELETE /ambientes/:id`, and `PUT /ambientes/:id/horarios`. Invalidation MUST remain local to Ambiente and MUST NOT clear unrelated module namespaces.

#### Scenario: Cache is cleared after create, update, delete, or horarios change

- GIVEN one or both Ambiente read endpoints are cached
- WHEN `POST /ambientes`, `PATCH /ambientes/:id`, `DELETE /ambientes/:id`, or `PUT /ambientes/:id/horarios` completes successfully
- THEN the `ambiente:*` namespace is invalidated
- AND the next read rebuilds the cache from fresh data

#### Scenario: Failed write does not invalidate cache

- GIVEN Ambiente read responses are cached
- WHEN one of the write endpoints fails before persistence completes
- THEN no invalidation occurs
- AND existing cache entries remain available

### Requirement: Phase 1 scope is limited

The system MUST limit this change to the two read endpoints and the four Ambiente invalidation paths defined above. It MUST NOT add caching for `GET /ambientes/:id/detalle` or `GET /ambientes/buscar-ambiente-horarios` in phase 1.

#### Scenario: Excluded endpoints remain outside caching scope

- GIVEN a request is made to `GET /ambientes/:id/detalle` or `GET /ambientes/buscar-ambiente-horarios`
- WHEN phase 1 is applied
- THEN no caching requirement applies to that endpoint
- AND the change remains limited to the scoped Ambiente list/disponibles behavior
