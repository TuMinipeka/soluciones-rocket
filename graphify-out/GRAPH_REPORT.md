# Graph Report - soluciones-rocket  (2026-10-16)

## Corpus Check
- Large corpus: 172 files · ~2,814,540 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 756 nodes · 2055 edges · 47 communities (42 shown, 5 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 148 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Frontend API Client & Auth
- SQLAlchemy Base & ORM Models
- Application Exceptions Hierarchy
- User Session & JWT Verification
- Resources & Equipment Loans API
- Argon2 Security & Password Hashing
- Dashboard Summary & Metrics
- Frontend Dependencies & React Runtime
- AI Provider & ChatCompletions Client
- Role Permissions & Access Control
- Auth & Registration Test Suite
- Reallocations & Reservations API
- Role & User Enums
- Incident Classifier Rules & Keywords
- Incident Management Permissions
- Incident Analysis Schemas
- Space Availability & Blocking
- Database Seeding & Official Spaces
- Incident Domain Enums
- Incident Core Service & Resolution
- Incident HTTP Router
- Relocation Test Suite
- Space Availability Tests
- FastAPI Engine & Global Handlers
- App Settings & Configuration
- AI Classification Models & Logic
- System Acceptance Tests
- Analysis Tokens & Cryptographic Proof
- Resource Alternatives & Blocking
- Security Audit Test Suite
- Campus Floorplan & Interactive Maps
- Campus Real Floorplan Component
- Commit Validation Tooling
- Dataset Initialization
- Domain Modules Manifest
- System Endpoints Manifest

## God Nodes (most connected - your core abstractions)
1. `User` - 88 edges
2. `Role` - 68 edges
3. `Base` - 25 edges
4. `ConflictError` - 23 edges
5. `AuthService` - 23 edges
6. `Space` - 23 edges
7. `NotFoundError` - 22 edges
8. `ForbiddenError` - 21 edges
9. `Reservation` - 21 edges
10. `Incident` - 18 edges

## Surprising Connections (you probably didn't know these)
- `AuthService` --uses--> `NotFoundError`  [INFERRED]
  backend/app/modules/auth/service.py → backend/app/core/exceptions.py
- `IncidentService` --uses--> `NotFoundError`  [INFERRED]
  backend/app/modules/incidents/service.py → backend/app/core/exceptions.py
- `AuthService` --uses--> `ConflictError`  [INFERRED]
  backend/app/modules/auth/service.py → backend/app/core/exceptions.py
- `IncidentService` --uses--> `ConflictError`  [INFERRED]
  backend/app/modules/incidents/service.py → backend/app/core/exceptions.py
- `test_concurrent_overlapping_requests_create_only_one_reservation()` --uses--> `ConflictError`  [INFERRED]
  backend/tests/test_reservations.py → backend/app/core/exceptions.py

## Import Cycles
- None detected.

## Communities (47 total, 5 thin omitted)

### Community 0 - "Frontend API Client & Auth"
Cohesion: 0.05
Nodes (64): getMeApi(), loginApi(), logoutApi(), registerApi(), api, apiClient(), clearStoredToken(), getStoredToken() (+56 more)

### Community 1 - "SQLAlchemy Base & ORM Models"
Cohesion: 0.07
Nodes (57): Base, Base shared by SQLAlchemy models from all domain modules., Import every mapped class before explicit schema initialization., _clean(), import_dataset(), Any, Session, Validated, repeatable import of authorized room and equipment datasets. (+49 more)

### Community 2 - "Application Exceptions Hierarchy"
Cohesion: 0.09
Nodes (37): AppError, ConflictError, ForbiddenError, NotFoundError, Any, Custom application exceptions and centralized FastAPI handlers., Excepción base para errores de negocio de la aplicación., TooManyRequestsError (+29 more)

### Community 3 - "User Session & JWT Verification"
Cohesion: 0.08
Nodes (41): UnauthorizedError, get_current_user(), Session, Dependencia FastAPI que obtiene y valida el usuario activo a partir del JWT.…, decode_access_token(), needs_rehash(), Any, Verifica si la contraseña en texto claro coincide con el hash almacenado.… (+33 more)

### Community 4 - "Resources & Equipment Loans API"
Cohesion: 0.13
Nodes (36): create_loan(), create_resource(), get_resource(), list_loans(), list_resources(), get, patch, post (+28 more)

### Community 5 - "Argon2 Security & Password Hashing"
Cohesion: 0.12
Nodes (30): create_access_token(), hash_password(), Security utilities: Argon2 password hashing, JWT creation/verification, and…, Genera el hash de una contraseña usando Argon2id., Genera un JWT firmado con PyJWT para autenticación de usuario. Retorna la tupla…, admin_token(), admin_user(), client() (+22 more)

### Community 6 - "Dashboard Summary & Metrics"
Cohesion: 0.11
Nodes (26): DashboardSummary, get_summary(), BaseModel, date, get, Session, time, Count current records; room occupancy uses the same interval rules as GET… (+18 more)

### Community 7 - "Frontend Dependencies & React Runtime"
Cohesion: 0.08
Nodes (24): dependencies, react, react-dom, react-router-dom, devDependencies, tailwindcss, @tailwindcss/vite, vite (+16 more)

### Community 8 - "AI Provider & ChatCompletions Client"
Cohesion: 0.15
Nodes (19): AsyncBaseTransport, asyncio, AIProvider, ChatCompletionsAIProvider, Implementación de proveedor de IA compatible con la API de Chat Completions…, Service for incident analysis with AI provider, local fallback, and real…, RecommendationService, Tests for HU-15 (AI Incident Classification, Schema Validation, Prompt… (+11 more)

### Community 9 - "Role Permissions & Access Control"
Cohesion: 0.12
Nodes (19): can_confirm_relocation(), can_manage_users(), can_reserve(), Verifica si el rol puede reservar espacios (Admin y Docente: Sí; Soporte: No)., Solo el administrador puede listar usuarios y cambiar roles o estados., Solo el administrador puede confirmar reubicaciones operativas., Tests for HU-13 (Permissions Policy and User Administration)., HU-13: Solo el administrador puede listar usuarios (Docente y Soporte reciben… (+11 more)

### Community 10 - "Auth & Registration Test Suite"
Cohesion: 0.10
Nodes (19): Tests for HU-11 (Public Registration) and HU-12 (Login and JWT Authentication)., HU-12: Mismo mensaje de error 401 si el correo no existe o si la contraseña es…, HU-12: Cuenta inactiva con contraseña correcta devuelve 403 Cuenta desactivada., HU-12: Token alterado o expirado devuelve 401 con cabecera WWW-Authenticate., HU-11: El registro público siempre asigna el rol 'teacher' e ignora roles…, HU-12: GET /auth/me devuelve la identidad autenticada., HU-12: Si una cuenta es desactivada en BD, un token ya emitido queda revocado…, HU-11: No permite registrar dos usuarios con el mismo correo electrónico (409… (+11 more)

### Community 11 - "Reallocations & Reservations API"
Cohesion: 0.27
Nodes (18): User, confirm_reallocation(), get_affected_reservations(), get_reallocations(), get_reservations(), modify_reservation(), date, get (+10 more)

### Community 12 - "Role & User Enums"
Cohesion: 0.20
Nodes (14): Enum, str, Role enumerations for user permissions., Role, SQLAlchemy model for User., create_initial_admin(), ensure_user(), Session (+6 more)

### Community 13 - "Incident Classifier Rules & Keywords"
Cohesion: 0.17
Nodes (15): classify_by_rules(), Local deterministic rules-based incident classifier and keyword dictionary., Clasifica un incidente mediante reglas heurísticas de coincidencia de palabras…, strip_accents(), Tests for HU-16 (Local Deterministic Rules Classifier and Explainability)., HU-16: Palabras como proyector o pantalla activan categoría technology y…, HU-16: Palabras como wifi o internet activan categoría network., HU-16: Fuego, humo o chispa elevan automáticamente la prioridad a CRITICAL y… (+7 more)

### Community 14 - "Incident Management Permissions"
Cohesion: 0.13
Nodes (14): can_manage_incidents(), can_reopen_incident(), can_report_incident(), can_view_all_incidents(), Centralized role-based access control and FastAPI permission dependencies., Fábrica de dependencias que restringe el acceso a los roles especificados.…, Fábrica de dependencias basada en función evaluadora de permisos. Ejemplo de…, Cualquier usuario autenticado y activo puede registrar incidencias. (+6 more)

### Community 15 - "Incident Analysis Schemas"
Cohesion: 0.21
Nodes (11): AlternativeItem, IncidentAnalysisRequest, IncidentAnalysisResponse, IncidentCreateRequest, IncidentEventResponse, BaseModel, field_validator, Pydantic v2 schemas for incidents and incident analysis. (+3 more)

### Community 16 - "Space Availability & Blocking"
Cohesion: 0.14
Nodes (15): get_space_alternatives(), is_space_blocked(), Session, Punto de integración que consulta alternativas deterministas para una sala…, Tests for HU-14 (Incident Management, State Transitions, and Availability…, HU-14: Soporte reporta falla crítica con confirm_blocking -> inhabilita sala;…, HU-14: Rechaza identificadores inexistentes de salas o recursos (422…, HU-14: Docente solo ve sus propias incidencias; Admin ve todas. (+7 more)

### Community 17 - "Database Seeding & Official Spaces"
Cohesion: 0.19
Nodes (14): enable_sqlite_foreign_keys(), Session, Insert only missing official rooms and accounts in one transaction., seed_demo(), auth(), Acceptance checks for Mayorga's persistence, seed, and loan flow., test_concurrent_overlapping_loans_only_create_one(), test_incident_rejects_unknown_equipment() (+6 more)

### Community 18 - "Incident Domain Enums"
Cohesion: 0.34
Nodes (11): ClassificationSource, FallbackReason, IncidentCategory, IncidentPriority, IncidentStatus, Enum, str, Enumerations for incidents domain. (+3 more)

### Community 19 - "Incident Core Service & Resolution"
Cohesion: 0.22
Nodes (11): IncidentService, Session, Actualiza estado o prioridad de una incidencia, gestionando transiciones y…, Restaura la disponibilidad de la sala o equipo si no hay otras incidencias…, Crea una nueva incidencia con validación de salas/recursos, procedencia…, is_valid_space(), Verifica si el identificador corresponde a una de las salas oficiales., Stage a room block in the caller's transaction. (+3 more)

### Community 20 - "Incident HTTP Router"
Cohesion: 0.31
Nodes (13): analyze_incident(), create_incident(), get_incident(), list_incidents(), get, patch, post, Session (+5 more)

### Community 21 - "Relocation Test Suite"
Cohesion: 0.42
Nodes (12): auth(), block_space(), create(), future_date(), payload(), Affected-reservation, recommendation, and confirmation tests for HU-05., test_confirmation_rechecks_destination_after_recommendation(), test_non_affected_or_cancelled_reservation_cannot_be_relocated() (+4 more)

### Community 22 - "Space Availability Tests"
Cohesion: 0.32
Nodes (10): add_reservation(), auth(), date, time, Acceptance and business-rule tests for HU-02 room availability., test_adjacent_reservation_does_not_create_conflict(), test_availability_uses_only_overlapping_confirmed_reservations(), test_get_space_returns_persisted_room_or_not_found() (+2 more)

### Community 23 - "FastAPI Engine & Global Handlers"
Cohesion: 0.22
Nodes (9): FastAPI, Registra manejadores globales de excepciones con estructura JSON uniforme., register_exception_handlers(), create_app(), FastAPI, Build the API and register its shared infrastructure and modules., health(), get (+1 more)

### Community 24 - "App Settings & Configuration"
Cohesion: 0.33
Nodes (4): field_validator, Application configuration loaded from environment variables., Settings, BaseSettings

### Community 25 - "AI Classification Models & Logic"
Cohesion: 0.33
Nodes (4): AIClassificationResult, BaseModel, Limpia fences de markdown, parsea JSON y valida estrictamente con Pydantic., Clasifica la incidencia. Retorna: (resultado, modelo_usado, latencia_ms,…

### Community 27 - "Analysis Tokens & Cryptographic Proof"
Cohesion: 0.33
Nodes (6): create_analysis_token(), hash_description(), Calcula un hash SHA-256 de la descripción normalizada para vincularla al token…, Crea un token firmado de procedencia verificable para el análisis de…, Verifica el token de análisis contra la descripción enviada. Devuelve los datos…, verify_analysis_token()

### Community 28 - "Resource Alternatives & Blocking"
Cohesion: 0.33
Nodes (6): get_resource_alternatives(), is_resource_blocked(), is_valid_resource(), Session, Suggest only registered, operational, unblocked equipment in the same category., test_resource_alternatives_use_only_registered_available_inventory()

### Community 29 - "Security Audit Test Suite"
Cohesion: 0.33
Nodes (5): Security audit tests verifying zero secret leaks in responses or exceptions., Auditoría de seguridad: Errores no exponen stack traces ni credenciales…, Auditoría de seguridad: Asegurar que password_hash nunca figure en las…, test_zero_secrets_in_error_responses(), test_zero_secrets_in_login_responses()

### Community 31 - "Campus Real Floorplan Component"
Cohesion: 0.40
Nodes (3): CAMPUS_FLOORPLAN_SPACES, ROOM_LOCAL_IMAGES, STATUS_STYLES

### Community 32 - "Commit Validation Tooling"
Cohesion: 0.67
Nodes (3): main(), Validate the repository's commit and pull request title convention., validate()

## Knowledge Gaps
- **23 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `Reallocations & Reservations API` to `SQLAlchemy Base & ORM Models`, `Application Exceptions Hierarchy`, `User Session & JWT Verification`, `Resources & Equipment Loans API`, `Argon2 Security & Password Hashing`, `Dashboard Summary & Metrics`, `Auth & Registration Test Suite`, `Role & User Enums`, `Incident Management Permissions`, `Database Seeding & Official Spaces`, `Incident Domain Enums`, `Incident Core Service & Resolution`, `Incident HTTP Router`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `Role` connect `Role & User Enums` to `SQLAlchemy Base & ORM Models`, `Application Exceptions Hierarchy`, `User Session & JWT Verification`, `Resources & Equipment Loans API`, `Argon2 Security & Password Hashing`, `Role Permissions & Access Control`, `Auth & Registration Test Suite`, `Reallocations & Reservations API`, `Incident Management Permissions`, `Database Seeding & Official Spaces`, `Incident Domain Enums`, `Incident Core Service & Resolution`, `Incident HTTP Router`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `classify_by_rules()` connect `Incident Classifier Rules & Keywords` to `AI Provider & ChatCompletions Client`, `Incident Domain Enums`, `Incident Core Service & Resolution`, `Incident Analysis Schemas`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 54 inferred relationships involving `User` (e.g. with `get_current_user()` and `require_permission()`) actually correct?**
  _`User` has 54 INFERRED edges - model-reasoned connections that need verification._
- **Are the 44 inferred relationships involving `Role` (e.g. with `require_roles()` and `User`) actually correct?**
  _`Role` has 44 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `datetime` (e.g. with `test_summary_counts_live_records_and_room_interval()` and `test_sqlite_reopen_preserves_rows_and_enforces_foreign_keys()`) actually correct?**
  _`datetime` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `Base` (e.g. with `init_db()` and `setup_test_db()`) actually correct?**
  _`Base` has 5 INFERRED edges - model-reasoned connections that need verification._