# CAMPUS CONTROL — Historias de Usuario y Criterios de Aceptación (HU-01 a HU-24)

**Sistema:** Sistema Central de Gestión Operativa del Campuslands  
**Metodología:** Desarrollo ágil modular de 5 horas con verificación continua  
**Prioridades:** **P0** = Indispensable para el MVP y evaluación en vivo; **P1** = Importante para integración y valor diferenciador; **P2** = Ampliación opcional.

---

## 1. Matriz General de Asignación y Estado

| Historia | Título | Responsable | Prioridad | Estado Verificado |
|---|---|---|---|---|
| **HU-01** | Inicialización de FastAPI y Arquitectura Base | Conde | P0 | **Completado** (Mergeado) |
| **HU-02** | Consultar Disponibilidad de Salas | Conde | P0 | **Completado** (Mergeado) |
| **HU-03** | Crear Reservas Válidas con Control de Solapamiento | Conde | P0 | **Completado** (Mergeado) |
| **HU-04** | Modificar y Cancelar Reservas con Trazabilidad | Conde | P1 | **Completado** (Mergeado) |
| **HU-05** | Proponer y Confirmar Reubicación Inteligente | Conde | P1 | ⏳ *Pendiente en Backend* |
| **HU-06** | Persistencia Relacional con SQLite y SQLAlchemy | Mayorga | P0 | **Completado** (Mergeado) |
| **HU-07** | Generador de SEED Reproducible e Idempotente | Mayorga | P0 | **Completado** (Mergeado) |
| **HU-08** | Administrar Inventario y Préstamos de Equipos | Mayorga | P0 | **Completado** (Mergeado) |
| **HU-09** | Importar Dataset Oficial de la Competencia | Mayorga | P0 | ⏳ *Pendiente de entrega de jurados* |
| **HU-10** | Orquestación Reproducible con Docker Compose | Mayorga | P0 | **Completado** (Mergeado) |
| **HU-11** | Registro Público de Usuarios con Hash Argon2id | Diego | P0 | **Completado** (Probado) |
| **HU-12** | Autenticación Segura con JWT y Timing-Safe Login | Diego | P0 | **Completado** (Probado) |
| **HU-13** | Matriz Centralizada de Permisos y Gestión de Usuarios | Diego | P1 | **Completado** (Probado) |
| **HU-14** | Reporte de Incidencias y Bloqueo de Disponibilidad | Diego | P0 | **Completado** (Probado) |
| **HU-15** | Clasificación Inteligente de Incidencias con IA | Diego | P0 | **Completado** (Probado) |
| **HU-16** | Fallback Heurístico Local y Recomendación de Alternativas | Diego | P1 | **Completado** (Probado) |
| **HU-17** | Interfaz Principal y Navegación Responsive | Mafe | P0 | **Completado** (Verificado) |
| **HU-18** | Mapa Interactivo de Salas Tipo Cine | Mafe | P0 | **Completado** (Verificado) |
| **HU-19** | Dashboard Operativo con Métricas Clave | Mafe | P1 | **Completado** (Verificado) |
| **HU-20** | Visualización de Incidencias y Recomendaciones de IA | Mafe | P1 | **Completado** (Verificado) |
| **HU-21** | Flujo de Registro, Login y Sesión en React | Guerra | P0 | **Completado** (Verificado) |
| **HU-22** | Formulario Integrado de Reserva de Salas | Guerra | P0 | **Completado** (Verificado) |
| **HU-23** | Vista Integrada de Inventario y Solicitud de Préstamos | Guerra | P0 | **Completado** (Verificado) |
| **HU-24** | Flujo Integral de Incidencias y Triaje de IA en Frontend | Guerra | P0 | **Completado** (Verificado) |

---

## 2. Módulo: Arquitectura, Salas y Reservas (Conde)

### HU-01 — Inicialización de FastAPI (P0)
- **Historia:** Como desarrollador, quiero disponer de una API organizada y documentada para integrar los módulos del sistema.
- **Criterios de Aceptación:**
  - La API inicia dentro del contenedor Docker en el puerto 8000.
  - `GET /health` responde 200 con el estado del servicio y conectividad a base de datos.
  - `/docs` expone la documentación interactiva OpenAPI.
  - Estructura uniforme de errores JSON: `{"error": {"code": "...", "message": "...", "details": ...}}`.
- **Estado:** ✅ Completado y verificado.

### HU-02 — Consultar Disponibilidad de Salas (P0)
- **Historia:** Como docente o administrador, quiero consultar las salas por fecha y horario para conocer cuáles puedo reservar.
- **Criterios de Aceptación:**
  - `GET /spaces` lista las 10 salas oficiales (`SAL-001` a `SAL-010`) con sus capacidades.
  - Acepta parámetros opcionales de franja: `date`, `start_time` y `end_time`.
  - Calcula la ocupación a partir de reservas confirmadas que se solapan en la franja.
  - Identifica salas inhabilitadas por incidencias (`is_blocked == true`) con estado `disabled`.
  - Estados devueltos: `available`, `occupied` y `disabled`.
- **Estado:** ✅ Completado y verificado.

### HU-03 — Crear Reservas Válidas (P0)
- **Historia:** Como docente o administrador, quiero reservar una sala indicando fecha, horario y asistentes para asegurar disponibilidad.
- **Criterios de Aceptación:**
  - `POST /reservations` exige autenticación con JWT (`admin` o `teacher`).
  - Rol `support` es rechazado con `403 Forbidden`.
  - Rechaza reservas si el aforo solicitado excede la capacidad de la sala (`409 Conflict`).
  - Rechaza solapamientos: `new_start < existing_end and existing_start < new_end` (`409 Conflict`).
  - Rechaza intervalos inválidos donde `start_time >= end_time` (`422 Validation Error`).
  - La confirmación y comprobación se realizan de forma atómica en SQLite.
- **Estado:** ✅ Completado y verificado.

### HU-04 — Modificar y Cancelar Reservas (P1)
- **Historia:** Como docente, quiero gestionar mis reservas para corregir horarios o cancelar actividades.
- **Criterios de Aceptación:**
  - Docente solo puede modificar (`PUT /reservations/{id}`) o cancelar (`DELETE /reservations/{id}`) reservas propias.
  - Administrador puede gestionar cualquier reserva.
  - Toda modificación revalida aforo, sala y solapamientos.
  - La cancelación es lógica (`status: "cancelled"`), liberando inmediatamente la disponibilidad y preservando historial de eventos (`created`, `updated`, `cancelled`).
- **Estado:** ✅ Completado y verificado.

### HU-05 — Proponer y Confirmar Reubicaciones (P1)
- **Historia:** Como administrador, quiero recibir alternativas para reservas afectadas por salas inhabilitadas para mantener actividades del campus.
- **Criterios de Aceptación:**
  - Identifica reservas futuras afectadas por una sala con incidencia crítica.
  - Filtra salas alternativas que tengan capacidad suficiente y no estén ocupadas ni bloqueadas.
  - `POST /reservations/{id}/relocate` reubica la reserva de forma transaccional, reservado exclusivamente al administrador.
- **Estado:** ⏳ Pendiente en backend.

---

## 3. Módulo: Datos, Inventario y DevOps (Mayorga)

### HU-06 — Persistencia de Datos (P0)
- **Criterios de Aceptación:** Modelos SQLAlchemy declarados, claves foráneas activas en SQLite (`PRAGMA foreign_keys = ON`), transacciones atómicas y volumen persistente en Compose (`campus_data`).
- **Estado:** ✅ Completado y verificado.

### HU-07 — Generador de SEED Idempotente (P0)
- **Criterios de Aceptación:** Carga inicial determinista de las 10 salas oficiales (`SAL-001` a `SAL-010`), 3 usuarios demo (`admin`, `teacher`, `support`) y equipos de muestra. Ejecutable múltiples veces sin duplicar ni corromper datos.
- **Estado:** ✅ Completado y verificado.

### HU-08 — Administrar Recursos y Préstamos (P0)
- **Criterios de Aceptación:** Endpoints `/resources` y `/resources/loans`. Permite solicitar préstamos con fecha de devolución prevista, impide prestar equipos bloqueados o ya prestados, y registra devoluciones de forma trazable.
- **Estado:** ✅ Completado y verificado.

### HU-09 — Importar Dataset Oficial (P0)
- **Criterios de Aceptación:** Importador CLI preparado para recibir el archivo oficial (CSV/JSON/Excel) de equipos o salas de la competencia, validando tipos y generando reporte de filas importadas/rechazadas.
- **Estado:** ⏳ Pendiente de entrega del dataset por parte de los organizadores.

### HU-10 — Ejecución con Docker Compose (P0)
- **Criterios de Aceptación:** `docker compose up --build` inicia backend (8000), frontend (5173) y servicio `db-init`. Variables de entorno documentadas en `.env.example` sin exponer credenciales.
- **Estado:** ✅ Completado y verificado.

---

## 4. Módulo: Seguridad, Incidencias y Triaje con IA (Diego)

### HU-11 — Registro Público de Usuarios (P0)
- **Criterios de Aceptación:** `POST /auth/register` crea cuentas forzadas al rol `teacher`. Protege contraseñas mediante hash Argon2id (memory-hard, salt criptográfico). Rechaza duplicados y cualquier intento de auto-asignación de roles privilegiados.
- **Estado:** ✅ Completado y verificado.

### HU-12 — Autenticación y JWT (P0)
- **Criterios de Aceptación:** `POST /auth/login` devuelve JWT firmado (HS256) con expiración. Mitiga ataques de temporización comparando contra dummy hash. `GET /auth/me` consulta identidad en base de datos.
- **Estado:** ✅ Completado y verificado.

### HU-13 — Administración de Usuarios y Permisos (P1)
- **Criterios de Aceptación:** Matriz de permisos centralizada (`ROLE_PERMISSIONS`). Endpoints `/users`, `PATCH /users/{id}/role` y `PATCH /users/{id}/status`. Protege contra auto-promoción y contra deshabilitar al último administrador activo.
- **Estado:** ✅ Completado y verificado.

### HU-14 — Registro y Gestión de Incidencias (P0)
- **Criterios de Aceptación:** `POST /incidents` valida sala/recurso oficial. Permite a soporte/admin bloquear transaccionalmente el espacio o recurso afectado (`is_blocked = true`). Registra eventos de auditoría y desbloquea el recurso al resolver la incidencia.
- **Estado:** ✅ Completado y verificado.

### HU-15 — Clasificación de Incidencias con IA (P0)
- **Criterios de Aceptación:** `POST /incidents/analyze` procesa la descripción del problema con proveedor de IA. Valida respuestas estructuradas con Pydantic, defensas contra inyección de prompts, y genera un token firmado (`analysis_token`) que previene falsificaciones.
- **Estado:** ✅ Completado y verificado.

### HU-16 — Fallback Heurístico Local y Alternativas (P1)
- **Criterios de Aceptación:** Ante timeout, fallos de red o respuesta inválida del LLM, degrada de forma transparente a un clasificador local de reglas por palabras clave con `classification_source="rules"`. Calcula alternativas reales de salas o equipos disponibles en la base de datos.
- **Estado:** ✅ Completado y verificado.

---

## 5. Módulo: Frontend y Experiencia de Usuario (Mafe y Guerra)

### HU-17 — Interfaz Principal y Navegación Responsive (P0)
- **Historia:** Como usuario del campus, quiero una barra de navegación fija y adaptativa con acceso a todas las áreas del sistema para operar con fluidez en cualquier dispositivo.
- **Criterios de Aceptación:**
  - Barra de navegación (`Navbar.jsx`) con glassmorphism oscuro, logo del astronauta y tipografía de marca.
  - Enlaces activos (`NavLink`) a Salas, Reservas, Préstamos, Incidencias, Historial y Dashboard.
  - Indicador de estado y sesión del usuario con badge de rol dinámico (`Admin`, `Docente`, `Soporte`).
  - Botón de cierre de sesión seguro que purga el token de almacenamiento local y redirige a `/login`.
- **Estado:** ✅ Completado y verificado.

### HU-18 — Mapa Interactivo de Salas y Disponibilidad en Tiempo Real (P0)
- **Historia:** Como docente o administrador, quiero consultar la matriz de salas táctica con indicadores visuales de estado y seleccionar cualquier espacio para gestionar su uso.
- **Criterios de Aceptación:**
  - Componente `CampusMap` con minimalismo táctico (*Swiss Design / Apple Pro Dark*), matriz de las 10 salas oficiales del SEED (`SAL-001` a `SAL-010`).
  - Telemetría táctica superior con filtros rápidos: *Todas*, *Disponibles*, *Ocupadas*, *Incidencias*.
  - Microindicadores circulares de estado con doble canal accesible (color y etiqueta de estado).
  - Consulta reactiva conectada a `GET /spaces` con parámetros de fecha, hora de inicio y hora de fin.
  - Panel inferior flotante (*Action Drawer*) con aforo, ubicación, sesión actual y enlace directo a reservar o reportar falla.
- **Estado:** ✅ Completado y verificado.

### HU-19 — Dashboard Operativo con Métricas Clave (P1)
- **Historia:** Como administrador o soporte, quiero visualizar un panel de control con métricas agregadas del campus para tomar decisiones operativas rápidas.
- **Criterios de Aceptación:**
  - Vista `/dashboard` con KPIs de ocupación de salas, préstamos activos y total de incidencias abiertas.
  - Desglose por categoría y estado con interfaz oscura de alta fidelidad.
- **Estado:** ✅ Completado y verificado.

### HU-20 — Visualización de Incidencias y Recomendaciones de IA (P1)
- **Historia:** Como equipo de soporte o administrador, quiero listar las incidencias reportadas en el campus con los diagnósticos emitidos por IA para coordinar su resolución.
- **Criterios de Aceptación:**
  - Vista `/incidents-list` conectada a `GET /incidents` con filtros por estado, prioridad y sala afectada.
  - Visualización del dictamen técnico, categoría, prioridad y token de firma criptográfica emitido por el modelo.
- **Estado:** ✅ Completado y verificado.

### HU-21 — Flujo de Registro, Login y Gestión de Sesión en React (P0)
- **Historia:** Como usuario del campus, quiero registrarme eligiendo mi rol institucional o iniciar sesión de forma segura para acceder a los servicios telemáticos.
- **Criterios de Aceptación:**
  - Formulario unificado en `LoginPage.jsx` con alternancia física suave entre *Iniciar Sesión* y *Registrarse*.
  - Selector interactivo de rol institucional (*Docente* vs *Soporte Técnico*) conectado con el backend (`POST /auth/register`).
  - Limpieza automática de credenciales y mensajes residuales al alternar pestañas o cambiar de ruta.
  - Validación de correos institucionales y legítimos, contraseñas robustas (mínimo 8 caracteres, números y letras).
  - Almacenamiento seguro del JWT emitido por `POST /auth/login`, renovación de identidad con `GET /auth/me` y protección de rutas con `ProtectedRoute`.
- **Estado:** ✅ Completado y verificado.

### HU-22 — Formulario Integrado de Reserva de Salas (P0)
- **Historia:** Como docente o administrador, quiero agendar el uso de una sala completando fecha, horario y asistentes para garantizar el espacio para mis actividades.
- **Criterios de Aceptación:**
  - Formulario en `ReservationPage.jsx` precargable desde la selección en el mapa de salas.
  - Validación en cliente y servidor de aforo máximo y control estricto de solapamiento horario (`POST /reservations`).
  - Historial de reservas propias con opción de cancelación lógica inmediata.
- **Estado:** ✅ Completado y verificado.

### HU-23 — Catálogo de Recursos y Solicitud de Préstamos (P0)
- **Historia:** Como docente o administrador, quiero consultar los equipos tecnológicos disponibles y solicitar su préstamo temporal con fecha prevista de devolución.
- **Criterios de Aceptación:**
  - Catálogo de equipos en `LoansPage.jsx` conectado a `GET /resources` con filtro por categoría.
  - Modal de solicitud de préstamo conectado a `POST /resources/loans` con validación de horarios y no solapamiento.
  - Registro trazable de devoluciones físicas conectado a `POST /resources/loans/{id}/return`.
- **Estado:** ✅ Completado y verificado.

### HU-24 — Flujo Integral de Incidencias y Triaje con IA en Frontend (P0)
- **Historia:** Como docente o soporte, quiero describir una falla técnica, recibir un análisis automatizado con alternativas de reemplazo y registrar la incidencia formalmente.
- **Criterios de Aceptación:**
  - Formulario en `IncidentPage.jsx` con asistente inteligente conectado a `POST /incidents/analyze`.
  - Presentación del diagnóstico con clasificación, prioridad, sugerencias operativas y alternativas reales de salas/equipos.
  - Confirmación explícita para registrar la incidencia en base de datos (`POST /incidents`) y aplicar el bloqueo inmediato del recurso afectado.
- **Estado:** ✅ Completado y verificado.
