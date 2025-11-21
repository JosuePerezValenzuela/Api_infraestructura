# Seed Batch Order

Los seeders ahora viven dentro de `1758545008735-InitInfraestructura.ts`. Al ejecutar `pnpm typeorm migration:run`:

1. Se crea el esquema `infraestructura`, tablas, índices, triggers y comentarios.
2. Se insertan los catálogos y datos base (tipo_bloques, tipo_ambientes, campus, facultades, bloques, ambientes, activos) en el mismo archivo.

Para revertir todo el proceso basta con ejecutar una sola vez `pnpm typeorm migration:revert`, lo que ejecutará el `down` de esa migración (dropping del schema completo).
