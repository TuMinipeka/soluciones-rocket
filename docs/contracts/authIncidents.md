# Contrato de API: Autenticación, Usuarios e Incidencias con IA

**Responsable:** Diego  
**Consumidores principales:** Guerra (cliente HTTP, login, gestión de JWT, incidencias) y Mafe (pantallas de interfaz, formularios y dashboard).  
**Integración de backend:** Conde (disponibilidad y reubicación de salas) y Mayorga (modelos de datos, SEED y recursos).

---

## 1. Estructura Estándar de Respuestas de Error

Todos los errores del backend (400, 401, 403, 404, 409, 422, 500) devuelven un formato JSON uniforme:

```json
{
  "error": {
    "code": "UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | VALIDATION_ERROR | INTERNAL_SERVER_ERROR",
    "message": "Mensaje en español claro para el usuario final",
    "details": null
  }
}
```

En errores de validación (`422 Unprocessable Entity`), `details` contiene la lista de campos fallidos:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no cumplen con el formato o restricciones requeridas.",
    "details": [
      {
        "field": "body -> password",
        "message": "La contraseña debe contener al menos un número.",
        "type": "value_error"
      }
    ]
  }
}
```

---

## 2. Enumeraciones Compartidas

Los valores deben enviarse exactamente en minúsculas:

- **`Role`**: `"admin"`, `"teacher"`, `"support"`
- **`IncidentCategory`**: `"technology"`, `"network"`, `"electrical"`, `"infrastructure"`, `"furniture"`, `"cleaning"`, `"safety"`, `"other"`
- **`IncidentPriority`**: `"low"`, `"medium"`, `"high"`, `"critical"`
- **`IncidentStatus`**: `"open"`, `"in_progress"`, `"resolved"`
- **`ResponsibleTeam`**: `"it_support"`, `"maintenance"`, `"cleaning"`, `"security"`, `"administration"`
- **`ClassificationSource`**: `"ai"`, `"rules"`

---

## 3. Endpoints de Autenticación (`/auth`)

### 3.1. Registro Público
- **Método y Ruta:** `POST /auth/register`
- **Rol Requerido:** Público (sin autenticación previa).
- **Regla de Negocio:** Toda cuenta pública recibe de forma fija e inviolable el rol `"teacher"`. Si el frontend o un atacante envían `"role"`, `"is_admin"` o campos adicionales, son ignorados silenciosamente en el servidor.
- **Cuerpo de Solicitud (Request Body):**
```json
{
  "name": "Docente Carlos Perez",
  "email": "carlos.perez@campuslands.edu",
  "password": "Password123"
}
```
- **Respuesta Exitosa (`201 Created`):**
```json
{
  "id": 1,
  "name": "Docente Carlos Perez",
  "email": "carlos.perez@campuslands.edu",
  "role": "teacher",
  "is_active": true,
  "created_at": "2026-10-16T12:00:00Z",
  "updated_at": "2026-10-16T12:00:00Z"
}
```
- **Códigos de Error:**
  - `409 Conflict`: Correo ya registrado.
  - `422 Unprocessable Entity`: Contraseña débil o nombre inválido.

---

### 3.2. Inicio de Sesión
- **Método y Ruta:** `POST /auth/login`
- **Rol Requerido:** Público.
- **Regla de Negocio:** Verificación con hash Argon2id y tiempo constante (protección contra enumeración de usuarios). Devuelve el token JWT firmado con expiración en segundos.
- **Cuerpo de Solicitud:**
```json
{
  "email": "carlos.perez@campuslands.edu",
  "password": "Password123"
}
```
- **Respuesta Exitosa (`200 OK`):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "name": "Docente Carlos Perez",
    "email": "carlos.perez@campuslands.edu",
    "role": "teacher",
    "is_active": true,
    "created_at": "2026-10-16T12:00:00Z",
    "updated_at": "2026-10-16T12:00:00Z"
  }
}
```
- **Códigos de Error:**
  - `401 Unauthorized`: "Credenciales incorrectas." (Mismo mensaje tanto si el correo no existe como si la contraseña no coincide).
  - `403 Forbidden`: "Cuenta desactivada. Contacta al administrador." (Solo se revela tras validar la contraseña correctamente).

---

### 3.3. Identidad del Usuario Autenticado
- **Método y Ruta:** `GET /auth/me`
- **Cabecera:** `Authorization: Bearer <access_token>`
- **Respuesta Exitosa (`200 OK`):**
```json
{
  "id": 1,
  "name": "Docente Carlos Perez",
  "email": "carlos.perez@campuslands.edu",
  "role": "teacher",
  "is_active": true,
  "created_at": "2026-10-16T12:00:00Z",
  "updated_at": "2026-10-16T12:00:00Z"
}
```
- **Códigos de Error:**
  - `401 Unauthorized`: Token ausente, expirado, inválido o manipulado.

---

## 4. Endpoints de Administración de Usuarios (`/users`)

Todos estos endpoints requieren cabecera `Authorization: Bearer <token>` y rol **`admin`**.

### 4.1. Listar Usuarios
- **Método y Ruta:** `GET /users?limit=50&offset=0&role=teacher&is_active=true`
- **Respuesta Exitosa (`200 OK`):** Array de objetos de usuario público.

### 4.2. Cambiar Rol
- **Método y Ruta:** `PATCH /users/{id}/role`
- **Cuerpo:**
```json
{
  "role": "support"
}
```
- **Reglas:** Un usuario no puede cambiar su propio rol. No se puede degradar al último administrador activo del campus.

### 4.3. Cambiar Estado
- **Método y Ruta:** `PATCH /users/{id}/status`
- **Cuerpo:**
```json
{
  "is_active": false
}
```
- **Reglas:** Un usuario no puede desactivarse a sí mismo. No se puede desactivar al último administrador activo.

---

## 5. Endpoints de Incidencias e IA (`/incidents`)

### 5.1. Triaje Inteligente con IA y Fallback
- **Método y Ruta:** `POST /incidents/analyze`
- **Rol Requerido:** Autenticado (`admin`, `teacher`, `support`).
- **Descripción:** Analiza el texto reportado usando la API del LLM configurado o el clasificador local de reglas por palabras clave si la IA está desconectada/falla. Retorna procedencia honesta (`ai` o `rules`), sugiere si amerita bloqueo de espacio/recurso, consulta alternativas reales y genera un `analysis_token` firmado criptográficamente.
- **Pertinencia:** `is_reportable=false` indica que el texto no describe una falla operativa verificable. En ese caso no hay `analysis_token` ni alternativas, y el formulario no permite confirmarlo. El fallback local solicita aclaración cuando no reconoce ninguna señal de falla.
- **Registro directo:** Si `POST /incidents` llega sin un token válido y las reglas no encuentran ninguna señal de falla, devuelve `422` y solicita análisis o aclaración. Una clasificación por IA válida conserva su procedencia mediante el token firmado.
- **Cuerpo de Solicitud:**
```json
{
  "description": "El proyector de la sala Cosmos parpadea y huele a quemado.",
  "context": "Clase magistral de programación en curso.",
  "space_id": "SAL-002",
  "resource_id": null
}
```
- **Respuesta Exitosa (`200 OK`):**
```json
{
  "classification_source": "ai",
  "category": "electrical",
  "priority": "critical",
  "responsible_team": "maintenance",
  "recommendation": "Desconectar interruptor principal y evacuar sala temporalmente.",
  "explanation": "Olor a quemado y chispas indican riesgo eléctrico crítico.",
  "suggests_blocking": true,
  "space_id": "SAL-002",
  "resource_id": null,
  "alternatives": [
    {
      "kind": "space",
      "id": "SAL-003",
      "name": "Skilab",
      "reason": "Aforo compatible (20 personas) y disponible sin conflictos."
    }
  ],
  "warnings": [],
  "ai_model": "gpt-4o-mini",
  "fallback_reason": null,
  "latency_ms": 280,
  "analysis_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 5.2. Crear Incidencia
- **Método y Ruta:** `POST /incidents`
- **Rol Requerido:** Autenticado (`admin`, `teacher`, `support`).
- **Cuerpo de Solicitud:**
```json
{
  "description": "El proyector de la sala Cosmos parpadea y huele a quemado.",
  "context": "Clase magistral en curso.",
  "space_id": "SAL-002",
  "resource_id": null,
  "category": "electrical",
  "priority": "critical",
  "analysis_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "confirm_blocking": true
}
```
- **Regla de Bloqueo:** Solo si el usuario que reporta tiene rol `support` o `admin` y envía `confirm_blocking: true`, se inhabilita la disponibilidad de la sala o recurso en la misma transacción. Si reporta un `teacher`, `suggests_blocking` queda registrado como sugerencia pero no bloquea la sala.

---

### 5.3. Listar Incidencias
- **Método y Ruta:** `GET /incidents?status=open&priority=critical&space_id=SAL-002`
- **Visibilidad:**
  - `teacher`: Solo recibe las incidencias donde `reporter_id` coincide con su usuario.
  - `support` y `admin`: Reciben todas las incidencias del campus con filtros.

---

### 5.4. Actualizar Incidencia
- **Método y Ruta:** `PATCH /incidents/{id}`
- **Rol Requerido:** `support` o `admin`.
- **Cuerpo:**
```json
{
  "status": "in_progress",
  "priority": "high",
  "category": "electrical",
  "assigned_team": "maintenance",
  "is_blocking": false
}
```
- **Transiciones válidas:**
  - `open` → `in_progress` o `resolved`
  - `in_progress` → `resolved`
  - `resolved` → `open` (ÚNICAMENTE permitido para `admin`; intento por `support` genera `403 Forbidden`).

---

### 5.5. Resolver Incidencia
- **Método y Ruta:** `POST /incidents/{id}/resolve`
- **Rol Requerido:** `support` o `admin`.
- **Regla:** Marca `status: "resolved"`, asigna `resolved_at` con timestamp UTC y restaura la disponibilidad de la sala/recurso solo si no existen otras incidencias abiertas bloqueándolos.
