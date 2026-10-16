# Sistema Central de Gestión Operativa de Campuslands

Repositorio de trabajo del hackatón «El campus bajo presión». El enunciado completo y los criterios de evaluación están en [contexto.md](contexto.md).

## Estado

Existe una **base de desarrollo**, no el MVP funcional: Docker Compose define frontend React/Vite/Tailwind y backend FastAPI/SQLAlchemy/SQLite. `GET /health` consulta la base de datos y la pantalla inicial refleja esa conexión. Todavía no se implementaron autenticación, reservas, préstamos, incidencias ni IA.

## Ejecutar el proyecto

Requisito: Docker con Compose. No se requiere instalar Python ni Node en el equipo anfitrión.

```powershell
Copy-Item .env.example .env
docker compose up --build -d
docker compose ps
```

Abre `http://localhost:5173` para la pantalla inicial, `http://localhost:8000/health` para el estado de API y SQLite y `http://localhost:8000/docs` para la documentación de los endpoints disponibles. Los cambios del código fuente se montan en los contenedores para desarrollo. Para ver registros: `docker compose logs -f backend` o `docker compose logs -f frontend`. Para detener: `docker compose down`; el volumen `campus_data` conserva SQLite. **No uses `docker compose down -v` si necesitas conservar esos datos.**

`.env.example` no contiene credenciales. Antes de implementar o probar autenticación y servicios de IA, asigna valores locales a las variables requeridas en `.env` sin confirmarlo en Git. Las configuraciones de IA y JWT están preparadas como variables, pero esos servicios aún no están implementados. El frontend usa un proxy de Vite a `/api`, que apunta al backend dentro de Compose.

La [estructura y límites de módulos](docs/architecture.md) indican dónde incorporar cada capacidad y qué contratos debe acordar el equipo. No cargues inventario ni datos de muestra como si fueran oficiales: la importación autorizada sigue pendiente.

Consulta la [matriz de versiones y las comprobaciones de reproducibilidad](docs/versions.md) antes de instalar dependencias o preparar un despliegue. Las versiones directas están fijadas; los lockfiles transitivos y digest de imágenes aún son requisitos pendientes para producción.

## Documentación del reto

- [Enunciado general](contexto.md).
- [Historias de usuario y criterios de aceptación (ES)](docs/trabajo-x-hacer.md) | [Backlog (EN)](docs/user-stories.md).
- [Información técnica, salas y decisiones pendientes](docs/hackaton-rubricas-informacion.md).
- [Responsabilidades y trabajo en equipo](docs/team-responsibilities.md).
- [Contrato de API: Auth e Incidencias](docs/contracts/auth_incidents.md).
- [Arquitectura de Seguridad, IA y Fallback](docs/AUTH_IA.md).

## Trabajo en equipo

Los cinco integrantes y sus agentes siguen las [reglas para agentes](AGENTS.md) y la [guía de contribución](CONTRIBUTING.md). Cada integrante mantiene una rama `developer/NombreDelDeveloper`; sus cambios se integran mediante pull requests. Después de cada pull, su agente informa qué implementó cada rama. Ejemplo de commit y título de PR: `feat: :sparkles: AddSpaceBooking`.

## Información pendiente para la entrega

- Fuente y procedimiento de carga de los datos oficiales autorizados.
- Flujo principal, función real de IA y sus límites.
- Tres reglas de negocio implementadas y forma de demostrar casos válidos e inválidos.
- Pruebas ejecutadas y pasos de la demostración en vivo.
