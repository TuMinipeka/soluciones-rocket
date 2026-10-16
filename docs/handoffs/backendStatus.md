# Handoff: Estado Operativo y Técnico del Backend

**Fecha:** Hackatón Campuslands (Edición 5 Horas)  
**Módulo:** Backend Modular (FastAPI + SQLAlchemy + SQLite + Pytest)  
**Estado:** Integrado (Diego, Mayorga, Conde) — **62 pruebas pasando**

---

## 1. Resumen Ejecutivo

El backend de **Campus Control** ha alcanzado el 100% de la funcionalidad de las tres primeras capas de la arquitectura:
1. **Infraestructura Base:** FastAPI (`create_app`), CORS, `/health`, manejador centralizado de excepciones y contenedor Docker Compose.
2. **Autenticación y Seguridad:** Registro forzado a `teacher`, contraseñas con Argon2id, JWT HS256 con expiración, protección contra timing attacks y control de acceso basado en roles (`admin`, `teacher`, `support`).
3. **Operaciones del Campus:**
   - **Salas y Espacios:** Disponibilidad por intervalo horario con detección de solapamientos e inhabilitación por incidencias (`GET /spaces`, `GET /spaces/{id}`).
   - **Reservas:** Creación atómica (`POST /reservations`), modificación (`PUT /reservations/{id}`) y cancelación con trazabilidad de eventos (`DELETE /reservations/{id}`).
   - **Recursos e Inventario:** Catálogo de equipos (`/resources`), solicitud de préstamos (`/resources/loans`) y devoluciones.
   - **Incidencias:** Registro de fallas (`/incidents`), bloqueo y desbloqueo transaccional de espacios y recursos (`is_blocked`).
4. **Triaje Inteligente e IA:**
   - Análisis con LLM estructurado mediante Pydantic y defensas anti-prompt injection (`POST /incidents/analyze`).
   - Fallback local determinista por reglas de palabras clave con firma criptográfica HMAC (`analysis_token`).
   - Sugerencia de alternativas reales sin inventar inventario.

---

## 2. Mapa de Endpoints Activos

| Módulo | Método | Ruta | Acceso / Roles | Descripción |
|---|---|---|---|---|
| **System** | `GET` | `/health` | Público | Comprobación de estado del servicio y conectividad SQLite |
| **Auth** | `POST` | `/auth/register` | Público | Registro público de docentes (Argon2id, rol `teacher`) |
| **Auth** | `POST` | `/auth/login` | Público | Autenticación con JWT firmado (HS256) |
| **Auth** | `GET` | `/auth/me` | Autenticado | Identidad y rol en tiempo real |
| **Users** | `GET` | `/users` | `admin` | Listado completo de usuarios |
| **Users** | `PATCH` | `/users/{id}/role` | `admin` | Cambio de rol (con protección de auto-promoción) |
| **Users** | `PATCH` | `/users/{id}/status` | `admin` | Activación/desactivación de cuentas |
| **Spaces** | `GET` | `/spaces` | Autenticado | Consulta de 10 salas y disponibilidad por fecha y hora |
| **Spaces** | `GET` | `/spaces/{id}` | Autenticado | Detalle de sala específica |
| **Reservations** | `POST` | `/reservations` | `admin`, `teacher` | Creación de reserva con validación de aforo y colisión |
| **Reservations** | `GET` | `/reservations` | `admin`, `teacher` | Consulta de reservas (docente ve propias, admin todas) |
| **Reservations** | `PUT` | `/reservations/{id}` | `admin`, `teacher` | Edición de horario o sala con revalidación atómica |
| **Reservations** | `DELETE` | `/reservations/{id}` | `admin`, `teacher` | Cancelación lógica y liberación inmediata de disponibilidad |
| **Resources** | `GET` | `/resources` | Autenticado | Inventario de equipos tecnológicos |
| **Resources** | `POST` | `/resources` | `admin` | Alta de equipo oficial en inventario |
| **Loans** | `GET` | `/resources/loans` | Autenticado | Listado de préstamos activos e históricos |
| **Loans** | `POST` | `/resources/loans` | `admin`, `teacher` | Solicitud de préstamo de equipo |
| **Loans** | `POST` | `/resources/loans/{id}/return` | `admin`, `support` | Devolución de equipo y restauración de disponibilidad |
| **Incidents** | `POST` | `/incidents/analyze` | Autenticado | Triaje asistido por IA / Fallback a reglas locales |
| **Incidents** | `POST` | `/incidents` | Autenticado | Creación de incidencia con bloqueo transaccional opcional |
| **Incidents** | `GET` | `/incidents` | Autenticado | Listado de incidencias (docente ve propias, staff ve todas) |
| **Incidents** | `GET` | `/incidents/{id}` | Autenticado | Detalle e historial de eventos de la incidencia |
| **Incidents** | `PATCH` | `/incidents/{id}` | `admin`, `support` | Actualización de prioridad, categoría o estado |
| **Incidents** | `POST` | `/incidents/{id}/resolve` | `admin`, `support` | Resolución y desbloqueo automático del espacio/equipo |

---

## 3. Estado de Pruebas y Cobertura

Suite ejecutada con `pytest tests -v` en el directorio `backend`:
- **Total de pruebas:** 62 pruebas unitarias y de integración.
- **Resultado:** 62 passed (100% de éxito en ~9 segundos).
- **Archivos de prueba:**
  - `test_system.py`: Salud, OpenAPI `/docs` y formato uniforme de errores.
  - `test_auth.py`: Registro, hash Argon2, claims JWT, expiración y timing safe.
  - `test_users_permissions.py`: Políticas RBAC, protección del último admin.
  - `test_spaces_availability.py`: Las 10 salas del SEED, aforos, cálculo de colisiones.
  - `test_reservations.py`: Creación atómica, aforo excedido, solapamiento concurrente.
  - `test_reservation_management.py`: Modificación, cancelación, trazabilidad.
  - `test_persistence_seed_resources.py`: Integridad referencial, idempotencia de SEED, préstamos concurrentes.
  - `test_incidents.py`: Auditoría, bloqueo transaccional y reactivación.
  - `test_ai_classification.py`: Validación Pydantic, mitigación de inyección y fallback seguro.
  - `test_classifier_rules.py`: Heurística determinista en español.
  - `test_security_audit.py`: Auditoría de cero secretos en payloads y respuestas.

---

## 4. Tareas Restantes para el Cierre del Hackatón

1. **`HU-05` — Reubicación de Reservas:**
   - Crear endpoint `POST /reservations/{id}/relocate`.
   - Utilizar el algoritmo de compatibilidad de `services/availability.py` para proponer alternativas a clases afectadas por salas inhabilitadas.
2. **`GET /dashboard/summary`:**
   - Agregar ruta de agregación de métricas rápidas (salas ocupadas vs libres en franja actual, equipos prestados, incidencias abiertas).
3. **`HU-09` — Dataset Oficial:**
   - Importar el archivo final en cuanto el jurado lo entregue.
