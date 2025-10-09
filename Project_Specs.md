# Proyecto

1. Visión general

Nombre: Infraestructura
Descripción: Plataforma para gestionar la infraestructura física de la institución (campus, facultades, bloques, ambientes, tipos y activos). Permite registrar, listar, editar y eliminar entidades, con validaciones y controles de integridad.
Beneficio: Centraliza la información, asegura trazabilidad y reduce errores operativos.

2. Objetivos

O1. Inventariar campus, facultades, bloques, ambientes, tipos y activos con datos consistentes.

O2. Soportar operaciones CRUD con validación robusta.

O3. Facilitar búsquedas y filtros (paginación, ordenamiento, texto libre).

O4. Asegurar seguridad por defecto (Security by Default) y por diseño (Security by Design).

O5. Documentar API con Swagger y mantener contratos claros.

O6. Diseñar base de datos normalizada y con performance (índices, triggers de “updated_at”).

3. Alcance (scope)
   3.1. In scope (versión actual)

Módulo de Infraestructura:

Campus, Facultades, Tipos de Bloques, Bloques, Tipos de Ambientes, Ambientes, Tipos de Activos, Activos.

Operaciones CRUD y listado con paginación/orden/filtro.

Validaciones de negocio (ej.: pares lat/lng, unicidad de codigo, etc.).

Backend con NestJS + TypeORM/SQL crudo + PostgreSQL.

Frontend con Next.js + Tailwind + shadcn/ui, formularios con validación (zod/react-hook-form) y mapas (Leaflet/OSM).

Documentación de API con Swagger (OpenAPI).

3.2. Out of scope

Autenticación/Autorización avanzada y multirrol.

Integraciones externas.

Flujos de aprobación y auditoría avanzada.

Gestión documental (adjuntos, planos).

Móvil nativo.

4. Requisitos funcionales (alto nivel)

RF1. CRUD de Campus (con coordenadas point).

RF2. CRUD de Facultades (referencia a campus).

RF3. CRUD de Tipos de Bloques

RF4. CRUD de Bloques (referencia a facultad).

RF5. CRUD de Tipos de Ambientes

RF6. CRUD Ambientes (referencia a bloque; capacidad y dimensiones en JSONB validadas por triggers).

RF7. CRUD de Tipos de Activos

RF8. CRUD de Activos (referencia a ambiente).

RF9. Listados con paginación, filtro por texto y ordenamiento.

RF10. Validaciones en backend (DTOs, pipes, reglas de negocio).

RF11. Documentación con Swagger.

6. Requisitos no funcionales

RNF1. Seguridad: Helmet, CORS, validación exhaustiva, manejo seguro de errores (sin filtrar detalles internos).

RNF2. Rendimiento: Índices para joins y filtros más comunes; paginación server-side.

RNF3. Confiabilidad: Migraciones versionadas; disparadores de updated_at centrales.

RNF4. Mantenibilidad: Arquitectura Monolito Modular con patrón Hexagonal (puertos/adaptadores).

RNF5. Observabilidad: Logs de errores y auditoría básica (por ahora a nivel de aplicación).

RNF6. UX: Formularios con feedback claro; mapa para capturar lat/lng; componentes consistentes (shadcn/ui).

RNF7. Portabilidad: variables de entorno para configuración.

7. Arquitectura

Estilo: Monolito modular con enfoque Hexagonal (Domain/Application/Infrastructure/Interface).

Backend: NestJS 11, TypeScript, TypeORM/SQL crudo, class-validator, Swagger.

Frontend: Next.js (App Router), Tailwind CSS, shadcn/ui (Radix UI), react-hook-form, zod, Leaflet/OSM.

Base de datos: PostgreSQL (schemas, FKs, índices, triggers de validación y de actualizado_en).

Contratos: REST JSON; documentación OpenAPI (Swagger UI bajo /api/docs).

Configuración: @nestjs/config + Joi para validar .env.

Diagrama lógico (simplificado):

[ Frontend (Next.js) ]
|
HTTP/JSON
|
[ NestJS (Interface/Controllers) ]
|
[ Application (Use Cases) ]
|
[ Domain (Ports/Entities) ]
|
[ Infrastructure (Repos/SQL) ] --- PostgreSQL

8. Modelo de datos (resumen) (Completo en `src/migration`)

Schema: infraestructura

campus

Campos: id PK, codigo UNIQUE, nombre, direccion, coordenadas point, activo, creado_en, actualizado_en

Índices: por joins y búsqueda (nombre, codigo).

Triggers: tg_touch_actualizado_en para actualizado_en.

facultades

Campos: id PK, codigo UNIQUE, nombre, nombre_corto, coordenadas point, activo, creado_en, actualizado_en, campus_id FK -> campus.id

Índices: campus_id, búsqueda por nombre/codigo.

tipo_bloques | bloques

bloques: id PK, nombre, nombre_corto, codigo, pisos, activo, creado_en, actualizado_en, facultad_id FK, tipo_bloque_id FK, institucion_id FK (opcional).

tipo_ambientes | ambientes

ambientes: id PK, nombre, codigo, piso,
capacidad jsonb (validación por trigger),
dimension jsonb (validación por trigger),
coordenadas point, clases boolean, activo, timestamps,
tipo_ambiente_id FK, bloque_id FK.

Índices: tipo_ambiente_id, bloque_id, GIN sobre capacidad.

tipo_activos | activos

activos: id (varchar, NIA) PK, nombre, numero_serie, garantia date, tipo_activo_id FK, ambiente_id FK, activo, timestamps.

Normalización:

1FN: Sin atributos multivaluados; JSONB para capacidad/dimension con validación de estructura.

2FN: Atributos dependen de la PK; no hay dependencias parciales.

3FN: No hay dependencias transitivas (catálogos en tablas propias).

Integridad referencial: FKs explícitas.

9. Endpoints (catálogo de alto nivel)

Prefijo global: /api

Campus

POST /campus → crea.

GET /campus → lista (paginación, search, sort).

PATCH /campus/:id → actualiza.

DELETE /campus/:id → elimina.

Facultades, Bloques, Ambientes, Activos
CRUD análogo.

Convenciones de filtros (GET):

?page=1&limit=10&search=...&sortBy=nombre&sortDir=asc&activo=true&campusId=1

10. Validación y reglas

Backend: DTOs con class-validator/class-transformer, ValidationPipe global (whitelist, transform, mensajes priorizados).

Base de datos: triggers para jsonb y touch de actualizado_en.

Coordenadas: lat [-90, 90], lng [-180, 180]; par lat/lng obligatorio cuando se actualiza posición.

11. Seguridad

HTTP: Helmet, CORS restringido a orígenes locales de dev.

Errores: Respuestas limpias (sin stack ni SQL bruto); códigos correctos (400, 404, 409, 500).

Config: .env validado por Joi; nada de secretos en el repo.

12. Entornos

Desarrollo: PostgreSQL local, pnpm start:dev (backend), pnpm dev (frontend).

13. Build & Deploy (resumen)

Backend: pnpm build, pnpm start:prod, migraciones pnpm migration:run.

Frontend: pnpm build (Next), despliegue en hosting compatible Node/SSR o estático si aplica.

14. Testing (líneas maestras)

Unit tests: servicios, use cases y repositorios.

Frontend: pruebas de componentes y formularios (React Testing Library + Vitest).

15. Registro y monitoreo

Logs: nivel app (errores y eventos clave).

16. Accesibilidad

A11y: componentes shadcn/Radix (foco/ARIA); contraste y uso de teclado básico.

17. Suposiciones y restricciones

Los catálogos (tipos) son administrados internamente por el sistema.

Las coordenadas provienen del mapa (Leaflet) y se guardan como point.

18. Roadmap

v1: CRUD completos Infraestructura + listados con filtros + Swagger.

19. Glosario

Campus: ubicación principal (ej.: Central).

Facultad: unidad académica dentro de un campus.

Bloque: edificio o conjunto de ambientes que pertenecen a una facultad.

Ambiente: aula/laboratorio/espacio físico en un bloque.

Activo: equipamiento asociado a un ambiente.

Tipo: catálogo de clasificación (bloques/ambientes/activos).

# Crear campus - Especificaciones - HU 1

Visión y alcance:

Crear campus para el inventario institucional.

Registrar un campus en menos de 2 minutos, con errores de validación claros.

Security by default y security by design (validación estricta, whitelisting, manejo controlado de errores).

Glosario y modelo conceptual:

Un campus agrupa facultades y bloques.

coordenadas se almacenan como POINT (lng, lat) en PostgreSQL.

codigo es un identificador único del campus.

Reglas de negocio:

codigo es único y obligatorio (máx. 16).

nombre (máx. 128) y direccion (máx. 256) son obligatorios.

lat y lng se envían juntos y deben estar en rangos válidos (lat ∈ [-90, 90], lng ∈ [-180, 180]); se convierten a POINT(lng, lat) al persistir.

activo es opcional, por defecto true.

Esquema:

CREATE TABLE infraestructura.campus (
id integer NOT NULL GENERATED BY DEFAULT AS IDENTITY (INCREMENT BY 1 START WITH 1),
codigo varchar(16) NOT NULL UNIQUE,
nombre varchar(128) NOT NULL,
direccion varchar(256) NOT NULL,
coordenadas point NOT NULL, -- (lng, lat)
activo boolean NOT NULL DEFAULT TRUE,
creado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
actualizado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT pk_campus PRIMARY KEY (id)
);

{
"codigo": "CC-001",
"nombre": "Campus Central",
"direccion": "Av. Sucre entre Belzu y Oquendo",
"lat": -17.3939,
"lng": -66.1570
}

Contratos de API
POST /api/campus -> 201 { "id": number }
400 VALIDATION_ERROR con details: [{ field, message }]
409 Ya existe un campus con el mismo codigo

# Listar campus - Especificaciones - HU 2

Visión y alcance:

Listar campus en una tabla para consulta y gestión.

Permitir búsqueda y ordenamiento básicos.

Paginación para manejar grandes volúmenes.

Security by default/design: validación estricta de parámetros y respuestas consistentes.

Glosario y modelo conceptual:

Un campus agrupa facultades y bloques.

Las coordenadas se almacenan como POINT (lng, lat) en PostgreSQL.

codigo identifica únicamente a cada campus (no se repite).

Reglas de negocio:

El listado debe soportar paginación (page, limit).

Debe permitir búsqueda por codigo, nombre o direccion.

Debe permitir ordenar por una columna permitida y dirección (asc|desc).

Los valores de lat y lng que se devuelven provienen de descomponer coordenadas (POINT).

Esquema (ya implementado):

CREATE TABLE infraestructura.campus (
id integer NOT NULL GENERATED BY DEFAULT AS IDENTITY,
codigo varchar(16) NOT NULL UNIQUE,
nombre varchar(128) NOT NULL,
direccion varchar(256) NOT NULL,
coordenadas point NOT NULL, -- (lng, lat)
activo boolean NOT NULL DEFAULT TRUE,
creado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
actualizado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT pk_campus PRIMARY KEY (id)
);

Contrato de API (GET):

Endpoint: GET /api/campus

Query params:

page (opcional, número, defecto 1)

limit (opcional, número, defecto 8)

search (opcional, string; filtra por codigo, nombre, direccion)

orderBy (opcional, codigo|nombre|creado_en; defecto nombre)

orderDir (opcional, asc|desc; defecto asc)

200 OK – Respuesta ejemplo

{
"items": [
{
"id": 1,
"codigo": "CC-001",
"nombre": "Campus Central",
"direccion": "Av. Sucre entre Belzu y Oquendo",
"lat": -17.3939,
"lng": -66.1570,
"activo": true,
"creado_en": "2025-09-24T15:20:30.767Z",
"actualizado_en": "2025-09-24T15:20:30.767Z"
}
],
"meta": {
"total": 50,
"page": 1,
"take": 10,
"pages": 5,
"hasNextPage": true,
"hasPreviousPage": false
}
}

400 BAD_REQUEST (parámetros inválidos)

{
"error": "VALIDATION_ERROR",
"message": "Los datos enviados no son válidos",
"details": [
{ "field": "page", "message": "Debe ser un número entero >= 1" }
]
}

# Editar un campus - Especificaciones - HU 3

Visión y alcance:

Editar campus existentes para mantener información actualizada.

Edición en menos de 2 minutos, con mensajes de validación claros.

Security by default/design: validación estricta, errores tipificados y control de colisiones (conflictos por duplicados).

Glosario y modelo conceptual:

Un campus es la unidad física principal (contiene facultades y bloques).

coordenadas se almacenan como POINT (lng, lat) en PostgreSQL.

codigo identifica únicamente a cada campus (no se repite).

Reglas de negocio:

La edición es parcial (solo campos enviados se actualizan).

codigo (si se envía) debe ser único entre todos los campus.

lat y lng: si se actualiza uno, se debe actualizar el otro (pareja obligatoria) y ambos deben estar en rango válido (lat ∈ [-90, 90], lng ∈ [-180, 180]).

Longitudes máximas: codigo ≤ 16, nombre ≤ 128, direccion ≤ 256.

activo es booleano.

No se permite actualizar id, creado_en, actualizado_en desde la API.

Esquema:

CREATE TABLE infraestructura.campus (
id integer NOT NULL GENERATED BY DEFAULT AS IDENTITY,
codigo varchar(16) NOT NULL UNIQUE,
nombre varchar(128) NOT NULL,
direccion varchar(256) NOT NULL,
coordenadas point NOT NULL, -- (lng, lat)
activo boolean NOT NULL DEFAULT TRUE,
creado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
actualizado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT pk_campus PRIMARY KEY (id)
);

Contrato de API (PATCH):

Endpoint: PATCH /api/campus/{id}

Path param:

id (requerido, entero ≥ 1)

Body (JSON) – todos los campos son opcionales (parcial):

{
"codigo": "CC-002",
"nombre": "Campus Central - Actualizado",
"direccion": "Av. Sucre entre Belzu y Oquendo",
"lat": -17.3939,
"lng": -66.1570,
"activo": true
}

Validaciones:

codigo: string (1..16), único si se envía.

nombre: string (1..128) si se envía.

direccion: string (1..256) si se envía.

lat/lng: números; si llega uno debe llegar el otro; rangos válidos.

activo: booleano si se envía.

Cualquier campo no reconocido.

Respuestas:

200 OK – actualizado correctamente

{ "id": 1 }

400 BAD_REQUEST – validación (ejemplos)

{
"error": "VALIDATION_ERROR",
"message": "Los datos enviados no son válidos",
"details": [
{ "field": "lat", "message": "Si se envía lat también se debe enviar lng y viceversa" },
{ "field": "lat", "message": "La latitud no puede ser mayor a 90" }
]
}

404 NOT_FOUND – no existe el recurso

{ "error": "NOT_FOUND", "message": "No se encontró el campus" }

409 CONFLICT – duplicidad de código

{ "error": "CONFLICT", "message": "Ya existe un campus con el mismo código" }

# Crear Facultad - Especificaciones - HU 5

Vision y alcance:

1. Crear facultades para inventario.
2. Crear facultades en menos de 2 minutos, errores de validacion comprensibles.
3. Security by default y security by desing.

Glosario y modelo conceptual:

1. Una facultad le pertenece a un campus
2. codigo es un Identificador unico

Reglas de negocio:

1. codigo es unico
2. nombre y direccion son obligatorios
3. lat y lng se envian juntos para convertir a POINT y dentro de rangos validos
4. nombre_corto es opcional.
5. campus_id indica a que campus pertenece.

Esquema:
CREATE TABLE infraestructura.facultades (
id integer NOT NULL GENERATED BY DEFAULT AS IDENTITY ( INCREMENT BY 1 START WITH 1 ) ,
codigo varchar(16) NOT NULL UNIQUE,
nombre varchar(128) NOT NULL ,
nombre_corto varchar(16) ,
coordenadas point NOT NULL ,
activo boolean DEFAULT TRUE NOT NULL ,
creado_en timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL ,
actualizado_en timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL ,
campus_id integer NOT NULL ,
CONSTRAINT pk_facultades PRIMARY KEY ( id ),
CONSTRAINT fk_facultades_campus FOREIGN KEY ( campus_id ) REFERENCES infraestructura.campus( id )  
 );
{
"codigo": "12345",
"nombre": "Facultad de cieencias y tecnologia",
"nombre_corto": "FCyT",
"lat": -17.3939,
"lng": -66.15,
"campus_id": 1
}

Contratos de API
POST /api/facultades -> 201 { id }
400 VALIDATION_ERROR con details []
409 Ya existe una facultad con el mismo codigo

# Listar una facultad - Especificaciones - HU 6

Vision y alcance:

1. Listar facultades en una tabla.
2. Poder filtrar facultades por distintos filtros.
3. Poder ocultar columnas.
4. Poder ordenar columnas mediante la tabla.
5. Boton a la derecha encima de la tabla que me permitira registrar una facultad
6. Se debe contar con paginacion
7. Security by default y security by desing.

Glosario y modelo conceptual:

1. Una facultad le pertenece a un campus
2. codigo es un Identificador unico

Reglas de negocio:

1. codigo es unico
2. Se debe listar por defecto 8 facultades por pagina.
3. No se debe mostrar las coordenadas, actualizado_en ni el id de la facultad en la tabla
4. No se debe mostrar campus_id, en su lugar el nombre del campus.

Esquema:
CREATE TABLE infraestructura.facultades (
id integer NOT NULL GENERATED BY DEFAULT AS IDENTITY ( INCREMENT BY 1 START WITH 1 ) ,
codigo varchar(16) NOT NULL UNIQUE,
nombre varchar(128) NOT NULL ,
nombre_corto varchar(16) ,
coordenadas point NOT NULL ,
activo boolean DEFAULT TRUE NOT NULL ,
creado_en timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL ,
actualizado_en timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL ,
campus_id integer NOT NULL ,
CONSTRAINT pk_facultades PRIMARY KEY ( id ),
CONSTRAINT fk_facultades_campus FOREIGN KEY ( campus_id ) REFERENCES infraestructura.campus( id )  
 );
{
"items": [
{
"codigo": "12345",
"nombre": "Facultad de cieencias y tecnologia",
"nombre_corto": "FCyT",
"lat": -17.3939,
"lng": -66.15,
"campus_id": 1,
"activo": true,
"creando_en": "2025-09-24T15:20:30.767Z",
"actualizado_en": "2025-09-24T15:20:30.767Z"
}
],
"meta": {
"total": 50,
"page": 1,
"take": 1,
"hasNextPage": true,
"hasPreviousPage": false
}
}

Contratos de API
POST /api/facultades -> 200
