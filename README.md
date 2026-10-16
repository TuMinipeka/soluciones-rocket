# Sistema Central de Gestión Operativa de Campuslands

Repositorio oficial del hackatón «El campus bajo presión». El sistema unifica la gestión de **espacios**, **recursos tecnológicos** e **incidencias con triaje inteligente asistido por IA** en un monolito modular seguro, probado y de alta disponibilidad.

---

## Estado Actual del Proyecto

El backend se encuentra completamente integrado y probado en sus capas operativas fundamentales (**62 pruebas automáticas pasando**):
- **Infraestructura Base (HU-01, HU-06, HU-07, HU-10):** FastAPI, SQLite persistente en volumen, SEED idempotente de las 10 salas oficiales y Docker Compose.
- **Autenticación y Permisos (HU-11, HU-12, HU-13):** Registro forzado a `teacher`, contraseñas con Argon2id, JWT con vencimiento, timing-safe login y matriz RBAC centralizada.
- **Operaciones de Salas y Reservas (HU-02, HU-03, HU-04):** Consulta de disponibilidad en tiempo real por franja horaria, validación atómica de solapamientos (`new_start < existing_end and existing_start < new_end`), control de aforo y ciclo de vida de reservas.
- **Inventario y Préstamos (HU-08):** Catálogo de recursos y préstamos trazables con estados de devolución.
- **Incidencias y Triaje con IA (HU-14, HU-15, HU-16):** Reporte de fallas con bloqueo transaccional de espacios y equipos, análisis asistido por LLM con defensas anti-prompt injection, y fallback determinista local por reglas con cálculo de alternativas reales.

---

## Ejecutar el Proyecto con Docker Compose

Requisito: Docker Desktop / Docker con Compose. No se requiere instalar Python ni Node en la máquina anfitriona.

```powershell
# 1. Copiar y configurar variables de entorno
Copy-Item .env.example .env

# 2. Levantar la plataforma completa
docker compose up --build -d

# 3. Comprobar servicios y registros
docker compose ps
docker compose logs db-init backend frontend

# 4. Probar endpoints de salud
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:5173/api/health

# 5. Ejecutar el SEED idempotente de demostración
docker compose exec backend python -m app.scripts.seed_demo
```

Compose inicia `db-init` para crear las tablas de forma explícita en el volumen `campus_data`. Luego inicia `backend` (FastAPI en `http://localhost:8000`) y `frontend` (React + Vite en `http://localhost:5173`). La documentación interactiva OpenAPI está disponible en `http://localhost:8000/docs`.

Para detener preservando datos: `docker compose down`. *(No uses `docker compose down -v` para evitar borrar la base de datos persistida).*

---

## Ejecución de Pruebas Unitarias y de Integración

Para ejecutar la suite completa de 62 pruebas dentro del entorno virtual de Python:

```bash
cd backend
python -m pytest tests -v
```

---

## Estructura de Documentación del Repositorio

Toda la documentación técnica y operativa está organizada en la carpeta `docs/` con nomenclatura estandarizada:

### 1. Requisitos, Backlog y Rúbricas
- [Historias de Usuario y Criterios de Aceptación (HU-01 a HU-24)](docs/userStories.md)
- [Roadmap Técnico y Puertas de Control](docs/campusControlRoadmap.md)
- [Rúbricas de Evaluación y Directrices del Hackatón](docs/hackathonRubrics.md)
- [Matriz de Responsabilidades del Equipo](docs/teamResponsibilities.md)

### 2. Arquitectura y Seguridad
- [Estructura y Límites Modulares](docs/architecture.md)
- [Arquitectura de Seguridad, JWT, Incidencias y Triaje con IA](docs/authIa.md)
- [Matriz de Versiones y Dependencias](docs/versions.md)

### 3. Contratos de API
- [Contrato: Autenticación, Usuarios e Incidencias](docs/contracts/authIncidents.md)
- [Contrato: Salas, Disponibilidad y Reservas](docs/contracts/spacesAvailability.md)
- [Contrato: Recursos Tecnológicos y Préstamos](docs/contracts/resourcesLoans.md)

### 4. Guías de Handoff y Escalabilidad
- [Handoff: Estado Operativo y Cobertura del Backend](docs/handoffs/backendStatus.md)
- [Handoff: Guía de Integración para el Frontend (Mafe y Guerra)](docs/handoffs/frontendIntegration.md)
- [Handoff: Estrategia de Arquitectura y Escalabilidad en Producción](docs/handoffs/scalabilityAndArchitecture.md)

---

## Convenciones de Trabajo en Equipo

Los integrantes siguen las [instrucciones para agentes](AGENTS.md) y la [guía de contribución](CONTRIBUTING.md):
- Cada desarrollador mantiene su rama persistente `developer/NombreDelDeveloper`.
- Commits atómicos con formato Conventional Commits (`tipo: :gitmoji: EnglishActionInUpperCamelCase`), validados mediante `scripts/validate_commit_messages.py`.
- Integraciones a `main` exclusivamente mediante Pull Requests revisados.
