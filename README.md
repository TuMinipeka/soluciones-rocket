# Sistema Central de Gestión Operativa de Campuslands

Repositorio de trabajo del hackatón «El campus bajo presión». El enunciado completo y los criterios de evaluación están en [contexto.md](contexto.md).

## Estado

Esta rama integra la autenticación, incidencias y triaje de Diego con persistencia de salas, inventario y préstamos (HU-06 a HU-08). Las reservas y el dataset de equipos siguen pendientes de sus respectivos responsables; el inventario empieza vacío y solo admite altas autorizadas. La IA requiere un proveedor configurado y declara cuando usa reglas locales.

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

`.env.example` no contiene credenciales. `JWT_SECRET_KEY` (mínimo 32 caracteres) es obligatoria para iniciar la API; las seis variables de cuentas demo son necesarias solo para el SEED. Para el SEED, configura `ADMIN_EMAIL`/`ADMIN_PASSWORD`, `TEACHER_EMAIL`/`TEACHER_PASSWORD` y `SUPPORT_EMAIL`/`SUPPORT_PASSWORD`. El SEED añade solo las diez salas oficiales y las cuentas faltantes; no crea reservas, incidencias ni equipos. Si encuentra una sala con nombre o aforo distinto, o una cuenta con otro rol, se detiene sin sobrescribirla. Se puede ejecutar de nuevo sin duplicar registros. El frontend usa un proxy de Vite a `/api`, que apunta al backend dentro de Compose. `backend/.dockerignore` y `frontend/.dockerignore` excluyen secretos y artefactos locales del contexto de construcción.

Para probar HU-08, inicia sesión como administrador y registra un equipo autorizado mediante `POST /resources` en `/docs`; después un administrador o docente puede solicitarlo en la vista de préstamos. Las fechas de la API se interpretan en UTC cuando no incluyen zona horaria. Consulta el [contrato de recursos y préstamos](docs/contracts/resources_loans.md) para rutas, estados y errores.

La [estructura y límites de módulos](docs/architecture.md) indican dónde incorporar cada capacidad y qué contratos debe acordar el equipo. No cargues inventario ni datos de muestra como si fueran oficiales: la importación autorizada sigue pendiente.

Consulta la [matriz de versiones y las comprobaciones de reproducibilidad](docs/versions.md) antes de instalar dependencias o preparar un despliegue. Las versiones directas están fijadas; los lockfiles transitivos y digest de imágenes aún son requisitos pendientes para producción.

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
