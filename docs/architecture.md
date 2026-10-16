# Estructura del proyecto

Esta estructura organiza el **mismo MVP integrado** descrito en [las historias de usuario](userStories.md) y [las decisiones técnicas y rúbricas](hackathonRubrics.md). Las carpetas de dominio son límites de trabajo, no funcionalidades implementadas ni entregas separadas. Las decisiones de producto pendientes siguen pendientes.

```text
.
├── backend/
│   ├── app/
│   │   ├── main.py              # aplicación FastAPI, CORS y salud
│   │   ├── db/                  # base SQLAlchemy y sesiones SQLite
│   │   ├── imports/             # futura importación de datos oficiales
│   │   └── modules/             # auth, spaces, reservations, resources,
│   │                            # incidents, recommendations, dashboard
│   ├── tests/                   # pruebas por reglas y módulos
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── features/            # pantallas por dominio
│   │   └── shared/              # cliente API y componentes compartidos
│   ├── Dockerfile
│   └── package.json
├── docs/                       # reto, decisiones y contratos acordados
├── .env.example                 # variables sin credenciales
└── compose.yaml                 # frontend, backend, volumen campus_data
```

## Límites de implementación

| Área | Ubicación | Responsabilidad según las historias |
| --- | --- | --- |
| Persistencia e importación | `backend/app/db/`, `backend/app/imports/` | Mayorga: esquema, inventario y carga de datos autorizados. |
| Espacios y reservas | `backend/app/modules/spaces/`, `reservations/` | Conde: disponibilidad, aforo, solapamiento y reservas. |
| Recursos | `backend/app/modules/resources/` | Mayorga: inventario, préstamos y estados. |
| Autenticación e incidencias | `backend/app/modules/auth/`, `incidents/` | Diego: cuentas, permisos e incidencias. |
| IA y continuidad operativa | `backend/app/modules/recommendations/` | Diego coordina la integración; cualquier cambio de reserva requiere confirmación autorizada. |
| Frontend | `frontend/src/features/` | Mafe y Guerra comparten los tres módulos funcionales; coordinan archivos distintos antes de editar. |
| Contratos compartidos | `backend/app/main.py`, `frontend/src/shared/`, `docs/` | Acordar rutas, esquemas, códigos de error y propietarios antes de cambiar interfaces. |

Los nombres concretos de archivos internos (`router.py`, `service.py`, `schemas.py`, `models.py`) se crean cuando exista un contrato acordado y una implementación real. Cada módulo debe mantener reglas en servicios/backend, no solo en formularios. Los modelos comparten `backend/app/db/base.py`, pero las migraciones o inicialización de tablas deben definirse en conjunto antes de introducir datos. No ejecutar `create_all` silenciosamente en cada arranque.

## Contratos y decisiones por cerrar

- Documentar en `docs/` las rutas, payloads, códigos de error y reglas compartidas antes de conectar módulos. La única ruta implementada en esta base es `GET /health`; FastAPI ofrece `/docs` para la API disponible.
- Definir con el equipo qué roles pueden reservar; [la decisión técnica](hackathonRubrics.md) la deja pendiente. No inferir permisos de un ejemplo o de una historia aislada.
- Confirmar el dataset oficial y su permiso de uso antes de importarlo. Mantener datos de prueba separados y no inventar resultados de IA ni información oficial.
- Los componentes compartidos de frontend y los contratos entre frontend/backend tienen propietario acordado por cambio; Mafe y Guerra no editan simultáneamente el mismo archivo.

## Flujo de equipo

Cada integrante conserva su rama `developer/NombreDelDeveloper` y sigue [CONTRIBUTING.md](../CONTRIBUTING.md) y [AGENTS.md](../AGENTS.md). Después de cada pull se revisan documentos nuevos y se informa el estado de todas las ramas. La estructura puede crecer cuando los documentos futuros concreten los contratos; no anticipar reglas o entidades sin respaldo.
