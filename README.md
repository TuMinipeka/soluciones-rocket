# Sistema Central de Gestión Operativa de Campuslands

Repositorio de trabajo del hackatón «El campus bajo presión». El enunciado completo y los criterios de evaluación están en [contexto.md](contexto.md).

## Estado

Esta rama integra autenticación e incidencias de Diego, disponibilidad y creación de reservas de Conde, frontend de Guerra, y persistencia, SEED, recursos, importación y Compose de Mayorga. El inventario inicia vacío hasta cargar un archivo autorizado o registrar equipos como administrador. La IA requiere un proveedor configurado y declara cuando usa reglas locales.

## Ejecutar el proyecto

Requisito: Docker con Compose. No se requiere instalar Python ni Node en el equipo anfitrión.

```powershell
Copy-Item .env.example .env
# Asigna en .env una clave JWT aleatoria de al menos 32 caracteres.
# Completa también las credenciales demo si ejecutarás el SEED.
docker compose up --build -d
docker compose ps
docker compose logs db-init backend frontend
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:5173/api/health
docker compose exec backend python -m app.scripts.seed_demo
```

Compose ejecuta `db-init` antes del backend; ese servicio crea las tablas de forma explícita e idempotente en el volumen `campus_data`. `db-init` debe figurar como `Exited (0)` y backend y frontend como saludables en `docker compose ps`. La consulta a `http://localhost:5173/api/health` recorre el proxy del frontend hasta FastAPI. Abre `http://localhost:5173` para la pantalla inicial y `http://localhost:8000/docs` para los endpoints disponibles. Los cambios del código fuente se montan en los contenedores para desarrollo. Para diagnosticar un arranque fallido, usa `docker compose ps -a` y `docker compose logs --tail=100 db-init backend frontend`; el servicio que falla queda indicado por su estado y registros. Para detener: `docker compose down`; el volumen `campus_data` conserva SQLite. **No uses `docker compose down -v` si necesitas conservar esos datos.**

`.env.example` no contiene credenciales. `JWT_SECRET_KEY` (mínimo 32 caracteres) es obligatoria para iniciar la API; las seis variables de cuentas demo son necesarias solo para el SEED. Configura `ADMIN_EMAIL`/`ADMIN_PASSWORD`, `TEACHER_EMAIL`/`TEACHER_PASSWORD` y `SUPPORT_EMAIL`/`SUPPORT_PASSWORD`. `seed_demo` añade las diez salas oficiales y las tres cuentas faltantes sin sobrescribir registros existentes. Es idempotente y no añade reservas, incidencias ni equipos. El frontend usa un proxy de Vite a `/api`, que apunta al backend dentro de Compose. Los archivos `.dockerignore` excluyen secretos y artefactos locales del contexto de construcción.

## Importar datos autorizados (HU-09)

El importador acepta `.csv`, `.json` y `.xlsx`. Para equipos exige columnas `id,name,category` y admite `condition` (`operational` o `damaged`). Para salas exige `id,name,capacity` y valida que coincidan exactamente con el catálogo oficial. JSON puede ser una lista de objetos o `{ "records": [...] }`. Cada fila queda marcada como `imported`, `skipped` o `rejected`; la opción `--dry-run` usa `would_import` sin escribir. Un identificador existente con otros datos se rechaza. El reporte se escribe en JSON y el archivo fuente no se modifica.

Guarda el archivo recibido en `official-data/` (excluido de Git). Con Compose en ejecución:

```powershell
docker compose cp .\official-data\inventario.csv backend:/tmp/inventario.csv
docker compose exec backend python -m app.scripts.import_dataset /tmp/inventario.csv --kind resources --dry-run --report /app/data/import-dry-run.json
docker compose exec backend python -m app.scripts.import_dataset /tmp/inventario.csv --kind resources --report /app/data/import-report.json
New-Item -ItemType Directory -Force import-reports | Out-Null
docker compose cp backend:/app/data/import-report.json .\import-reports\import-report.json
```

Sustituye el nombre y `--kind spaces` si recibes salas; adapta primero el formato de columnas si el archivo oficial difiere. Los códigos de salida son 0 sin rechazos, 2 con filas rechazadas y 1 por error de archivo o proceso. No presentes como oficial ningún equipo de ejemplo.

Los escenarios ficticios son opcionales y están separados del SEED principal. Tras cargar tres equipos autorizados, puedes ejecutar `docker compose exec backend python -m app.scripts.seed_scenarios --date 2026-11-20 --resource-ids EQ-001,EQ-002,EQ-003` con una fecha futura. Crea cinco reservas, cinco incidencias marcadas `DEMO-SEED`, y dos préstamos para representar recursos en uso y devueltos; el primer equipo queda disponible. Repetir el comando con la misma fecha no duplica registros. Sin `--resource-ids`, crea solo reservas e incidencias. Si encuentra reservas incompatibles o equipos ocupados, revierte la operación. Estas filas son ficticias y nunca se importan como dataset oficial.

Para probar HU-08, inicia sesión como administrador y registra un equipo autorizado mediante `POST /resources` en `/docs`; después un administrador o docente puede solicitarlo en la vista de préstamos. Las fechas de la API se interpretan en UTC cuando no incluyen zona horaria. Consulta el [contrato de recursos y préstamos](docs/contracts/resources_loans.md) para rutas, estados y errores.

La [estructura y límites de módulos](docs/architecture.md) indican dónde incorporar cada capacidad y qué contratos debe acordar el equipo. El [reporte de integración](docs/reporte-integracion-mayorga.md) enumera dependencias de otros integrantes para la demostración.

Consulta la [matriz de versiones y las comprobaciones de reproducibilidad](docs/versions.md) antes de instalar dependencias o preparar un despliegue. Los digest de imágenes y el lock completo de Python aún son requisitos pendientes para producción.

## Documentación del reto

- [Enunciado general](contexto.md).
- [Historias de usuario y criterios de aceptación (ES)](docs/trabajo-x-hacer.md) | [Backlog (EN)](docs/user-stories.md).
- [Información técnica, salas y decisiones pendientes](docs/hackaton-rubricas-informacion.md).
- [Responsabilidades y trabajo en equipo](docs/team-responsibilities.md).
- [Contrato de API: Auth e Incidencias](docs/contracts/auth_incidents.md).
- [Contrato de API: Recursos y Préstamos](docs/contracts/resources_loans.md).
- [Arquitectura de Seguridad, IA y Fallback](docs/AUTH_IA.md).

## Trabajo en equipo

Los cinco integrantes y sus agentes siguen las [reglas para agentes](AGENTS.md) y la [guía de contribución](CONTRIBUTING.md). Cada integrante mantiene una rama `developer/NombreDelDeveloper`; sus cambios se integran mediante pull requests. Después de cada pull, su agente informa qué implementó cada rama. Ejemplo de commit y título de PR: `feat: :sparkles: AddSpaceBooking`.

## Información pendiente para la entrega

- Fuente y procedimiento de carga del inventario oficial cuando el equipo lo reciba.
- Flujo principal, función real de IA y sus límites.
- Tres reglas de negocio implementadas y forma de demostrar casos válidos e inválidos.
- Pruebas ejecutadas y pasos de la demostración en vivo.
