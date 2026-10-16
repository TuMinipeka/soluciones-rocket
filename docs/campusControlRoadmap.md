# CAMPUS CONTROL — Roadmap técnico de 5 horas

**Hackatón Campuslands · Equipo:** Conde, Mayorga, Mafe, Guerra y Diego  
**Objetivo:** MVP integrado de reservas de salas, préstamo de recursos tecnológicos y gestión de incidencias con IA.

## 1. Decisiones aprobadas

| Elemento | Definición |
|---|---|
| Arquitectura | Monolito modular; frontend y backend separados |
| Frontend | React + Vite + Tailwind CSS |
| Backend | Python + FastAPI + Pydantic + SQLAlchemy |
| Base de datos | SQLite persistente |
| Seguridad | JWT; contraseñas con Argon2 |
| IA | Adaptador a proveedor autorizado **pendiente de identificar**; fallback local identificado como reglas |
| Pruebas | Pytest + HTTPX; Vitest |
| Ejecución | Exclusivamente Docker Compose |
| Git | Repositorio compartido creado al inicio; ramas por integrante; Conde integra |
| Roles | Administrador, docente y soporte |
| Registro público | Crea únicamente cuentas `teacher` |
| Reservas | Administrador y docente; confirmación automática tras validar |
| Horario de reserva | Inicio y finalización libres |
| Reubicación | El sistema propone; confirma un administrador |
| Inventario | Lista real **pendiente de recibir**; no inventar inventario oficial |
| Dataset de competencia | Formato aún desconocido; prioridad de importación al recibirlo |

## 2. División de trabajo

| Persona | Rol | Responsabilidades |
|---|---|---|
| **Conde** | Líder técnico / backend | Arquitectura FastAPI, consulta de espacios, reservas, aforo, solapamientos, reubicación, revisión de PR y conflictos Git |
| **Mayorga** | Backend / datos / DevOps | Modelos SQLAlchemy, SQLite, SEED, importación, inventario, préstamos, Docker Compose, `.env.example` |
| **Diego** | Backend / IA / seguridad | Registro y login, JWT, roles, incidencias, integración IA, fallback, pruebas de seguridad |
| **Mafe** | Frontend React | Diseño visual, layout, mapa tipo cine, dashboard, componentes y vistas de los tres módulos |
| **Guerra** | Frontend React / integración | Cliente HTTP, formularios, login, reservas, inventario, incidencias, estados y errores en los tres módulos |

Mafe y Guerra trabajan en todos los módulos, pero acuerdan propietarios por archivo para evitar conflictos.

## 3. Cronograma inamovible (300 minutos)

| Franja | Fase | Entrega esperada |
|---|---|---|
| **00:00–00:30** | Fundación | Git, estructura, contratos de API, Docker inicial y esquema de BD |
| **00:30–01:30** | Módulos básicos | Autenticación, salas, persistencia, interfaz y adaptador IA |
| **01:30–02:30** | Operaciones | Crear reserva, prestar/devolver recurso, registrar incidencia; reglas de dominio |
| **02:30–03:30** | Integración inteligente | UI conectada, IA real autorizada, fallback, alternativas y reubicación |
| **03:30–04:15** | Pruebas | Casos válidos e inválidos, seguridad, fallos de IA, reinicio con persistencia |
| **04:15–05:00** | Entrega | Congelar funciones, README, auditoría de secretos, Docker, commits y pitch |

**Puerta de control a las 02:30:** si reservas, préstamos e incidencias no persisten, suspender adornos de UI para resolver integración.

## 4. Estructura del repositorio

```text
campus-control/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/       # user, space, reservation, resource, loan, incident
│   │   ├── schemas/      # modelos de entrada/salida
│   │   ├── routers/      # auth, users, spaces, reservations, resources, loans, incidents, dashboard
│   │   ├── services/     # reservas, préstamos, incidencias, recomendaciones, IA
│   │   ├── core/         # JWT, permisos, excepciones
│   │   └── seed/         # datos y generador idempotente
│   ├── scripts/          # importación de información oficial
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── App.jsx
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── data/
│   ├── demo/
│   └── official/
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 5. Salas y capacidades del SEED

Los nombres y aforos corresponden a los datos proporcionados por el equipo. Los IDs son convenciones internas propuestas.

| ID | Sala | Capacidad |
|---|---|---:|
| SAL-001 | Auditorio | 100 |
| SAL-002 | Cosmos | 25 |
| SAL-003 | Skilab | 20 |
| SAL-004 | Spooki | 38 |
| SAL-005 | Apolo | 34 |
| SAL-006 | Blanca | 12 |
| SAL-007 | Azul | 10 |
| SAL-008 | Amarillas | 6 |
| SAL-009 | Verdes | 6 |
| SAL-010 | Artemis | 32 |

**Total:** 10 salas; capacidad nominal conjunta de **283 personas** (no equivale a disponibilidad simultánea).

### SEED mínimo y control de datos

- **3 usuarios iniciales**: administrador, docente y soporte, con contraseñas configuradas sin exponer secretos.
- **5 escenarios de reserva**: caso válido, colisión horaria, aforo excedido, sala inhabilitada y reubicación.
- **5 incidencias ficticias**: clasificación, priorización, fallo de recurso, bloqueo de sala y propuesta de continuidad.
- **3 escenarios de préstamos** cuando existan recursos autorizados: disponible, prestado y devuelto.
- **Equipos**: usar el inventario real cuando se comparta. En pruebas locales se pueden crear fixtures de equipos ficticios, siempre etiquetados y separados de información oficial.
- Ejecución **idempotente**: dos cargas no duplican nada ni pisan movimientos creados por usuarios.
- Fechas base configurables para que los ejemplos sigan siendo útiles el día del evento.
- Importador adaptable al formato oficial que se reciba (CSV, JSON o Excel), con validación, reporte de rechazados, duplicados y preservación de originales.

## 6. Modelo de datos mínimo

| Tabla | Campos relevantes |
|---|---|
| `users` | id, name, email (unique), password_hash, role, active |
| `spaces` | id, name, capacity, status |
| `reservations` | id, space_id, user_id, start_at, end_at, attendees, status |
| `resources` | id, name, type, serial_number, status, space_id |
| `loans` | id, resource_id, user_id, start_at, due_at, returned_at, status |
| `incidents` | id, reporter_id, space_id?, resource_id?, description, category, priority, status, assigned_team |
| `incident_events` | id, incident_id, event_type, created_at, details |

Mantener FK activas en SQLite; operaciones que afectan varios registros deben efectuarse en una transacción.

## 7. Contratos API iniciales

| Método | Ruta | Responsable |
|---|---|---|
| GET | `/health` | Conde |
| POST | `/auth/register` | Diego |
| POST | `/auth/login` | Diego |
| GET | `/auth/me` | Diego |
| GET | `/users` | Diego |
| PATCH | `/users/{id}/role` | Diego |
| PATCH | `/users/{id}/status` | Diego |
| GET | `/spaces` | Conde |
| GET | `/spaces/{id}` | Conde |
| PATCH | `/spaces/{id}` | Conde |
| GET | `/spaces/{id}/alternatives` | Conde |
| GET | `/reservations` | Conde |
| POST | `/reservations` | Conde |
| PATCH | `/reservations/{id}` | Conde |
| POST | `/reservations/{id}/cancel` | Conde |
| POST | `/reservations/{id}/relocate` | Conde |
| GET | `/resources` | Mayorga |
| GET | `/resources/{id}` | Mayorga |
| PATCH | `/resources/{id}` | Mayorga |
| GET | `/loans` | Mayorga |
| POST | `/loans` | Mayorga |
| POST | `/loans/{id}/return` | Mayorga |
| GET | `/incidents` | Diego |
| POST | `/incidents/analyze` | Diego |
| POST | `/incidents` | Diego |
| PATCH | `/incidents/{id}` | Diego |
| POST | `/incidents/{id}/resolve` | Diego |
| GET | `/dashboard/summary` | Conde (contrato), Mafe (visualización) |

Acordar DTO y códigos: `401` token ausente/inválido, `403` rol no autorizado, `404` registro inexistente, `409` conflictos, `422` datos de entrada inválidos. Nunca usar una respuesta fija para simular persistencia o IA.

## 8. Reglas del dominio

1. **No solapamientos**: `new_start < existing_end and existing_start < new_end` para reservas confirmadas de una misma sala.
2. **Aforo**: asistentes entre 1 y capacidad configurada.
3. **Estado**: sala inhabilitada o en mantenimiento no reservable.
4. **Equipo**: no prestar equipos fuera de servicio ni con préstamo incompatible.
5. **Fechas**: inicio estrictamente anterior a fin; validar horarios del préstamo.
6. **Incidencias**: enlazar espacio o recurso real; solo bloquear cuando la condición lo amerite.
7. **Reubicación**: validar aforo, estado, equipamiento conocido y horario; volver a validar en una transacción al confirmar.
8. **Permisos**: solo `admin` y `teacher` reservan; `support` gestiona incidencias conforme a su rol; únicamente `admin` administra roles y confirma reubicaciones.

## 9. JWT, registro y permisos

- Registro público asigna **`teacher`** sin permitir selección de rol; correo único y contraseña con Argon2.
- El primer administrador se crea por inicialización segura, con credenciales tomadas del entorno.
- JWT firmado y con vencimiento; FastAPI valida autenticación y permisos por endpoint, no solo el frontend.
- Docente modifica únicamente sus propias reservas; administrador todas; soporte no puede reservar.
- Usuario deshabilitado no accede a recursos protegidos.
- Mantener la clave de firma y las claves de IA solo en el backend.

## 10. Docker y variables de entorno

Servicios `frontend` (5173) y `backend` (8000), con volumen nombrado para `/app/data`. Documentar la inicialización de esquema y datos. Para el navegador, `VITE_API_URL=http://localhost:8000`.

**Backend `.env.example`**:

```dotenv
APP_ENV=development
DATABASE_URL=sqlite:////app/data/campus.db
JWT_SECRET_KEY=
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
ADMIN_EMAIL=
ADMIN_PASSWORD=
AI_PROVIDER=
AI_MODEL=
AI_API_KEY=
AI_BASE_URL=
AI_TIMEOUT_SECONDS=15
CORS_ORIGINS=http://localhost:5173
```

**Frontend `.env.example`**:

```dotenv
VITE_API_URL=http://localhost:8000
```

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f backend
docker compose down
```

Nunca versionar `.env`, bases SQLite con operaciones reales ni datos privados recibidos para el reto.

## 11. IA con controles y fallback

`POST /incidents/analyze` recibe una descripción y contexto válidos, llama a un modelo autorizado y valida categoría, prioridad, equipo asignado y acción sugerida con Pydantic. La API devuleve el origen de clasificación: `ai` o `rules`. Si el modelo falla, reglas locales ofrecen clasificación explícitamente no-IA; no se inventan respuestas del modelo. Un algoritmo basado en datos persistidos filtra y ordena salas o equipos compatibles; solo un usuario autorizado confirma cambios.

## 12. Git, pruebas y demostración

**Ramas:** `conde`, `mayorga`, `mafe`, `guerra`, `diego`; integrar cambios pequeños durante la jornada, no al final. Commits convencionales: `feat:`, `fix:`, `test:`, `chore:`, `docs:`.

**Pruebas esenciales:** reserva válida; aforo excedido (Cosmos para 30); colisión de Cosmos; sala inhabilitada; reserva con rol soporte (403); registro público con rol admin inyectado; equipo prestado por segunda vez; devolución; IA con resultado correcto e inválido; fallback en timeout; SEED repetido; importación con fila incorrecta; reinicio Docker preservando operaciones.

**Demostración:** login docente → reserva Cosmos para 20 personas → rechazo de colisión → incidencia que afecta Cosmos → análisis IA → bloqueo justificado → alternativas reales → administrador confirma reubicación → dashboard y registros actualizados.

**Defensa:** cada integrante explica su módulo y modifica una regla de su área en menos de tres minutos.

## 13. Prioridad ante recortes de tiempo

1. Datos oficiales + persistencia + reglas de dominio + préstamos e incidencias + integración real de IA y un flujo vertical completo.
2. Registro/JWT, administración de roles esencial, reubicación y tablero operativo.
3. Animaciones, estadísticas avanzadas y simulador de impacto.

**Nota de estado:** las capacidades de salas y la política de roles están confirmadas por el equipo; el inventario, formato oficial y proveedor de IA siguen pendientes y se integrarán únicamente cuando se reciban.
