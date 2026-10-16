# Handoff: Guía de Integración Frontend (API Contracts)

**Destinatarios:** Mafe y Guerra (Equipo Frontend React + Vite + Tailwind)  
**URL Base de la API:** `http://localhost:8000` (o `/api` mediante el proxy de Vite en Docker)  
**Formato de Respuesta de Error:** Uniforme en todos los endpoints

```json
{
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | CONFLICT | FORBIDDEN | UNAUTHORIZED",
    "message": "Mensaje legible para el usuario",
    "details": null
  }
}
```

---

## 1. Autenticación y Gestión de Sesión

### Cabecera de Autorización
Todas las rutas protegidas requieren:
```http
Authorization: Bearer <access_token>
```

### Endpoints
- **`POST /auth/register`**:
  - Request: `{"name": "...", "email": "...", "password": "..."}`
  - Response `201`: `{"id": 2, "name": "...", "email": "...", "role": "teacher"}`
  - *Nota:* Siempre crea cuentas con rol `teacher`.
- **`POST /auth/login`**:
  - Request: `{"email": "...", "password": "..."}`
  - Response `200`: `{"access_token": "...", "token_type": "bearer", "expires_in": 3600, "user": {"id": 1, "name": "...", "email": "...", "role": "..."}}`
- **`GET /auth/me`**:
  - Response `200`: `{"id": 1, "name": "...", "email": "...", "role": "admin | teacher | support", "active": true}`

---

## 2. Consulta y Visualización de Salas (Mapa Interactivo HU-18)

### `GET /spaces`
Permite listar las 10 salas del campus. Si se envían los parámetros de fecha y hora, evalúa disponibilidad en tiempo real.

- **Query Params:**
  - `date`: `YYYY-MM-DD` (ej. `2026-10-16`)
  - `start_time`: `HH:MM` (ej. `08:00`)
  - `end_time`: `HH:MM` (ej. `10:00`)
- **Regla:** Si se envía uno de los tres parámetros, deben enviarse los tres. Si no se envían, devuelve las 10 salas con `status: "available"` o `status: "disabled"` si están bloqueadas por una falla.
- **Respuesta `200 OK`:**
```json
[
  {
    "id": "SAL-001",
    "name": "Auditorio",
    "capacity": 100,
    "status": "available",
    "is_blocked": false,
    "has_conflict": false
  },
  {
    "id": "SAL-002",
    "name": "Cosmos",
    "capacity": 25,
    "status": "occupied",
    "is_blocked": false,
    "has_conflict": true
  },
  {
    "id": "SAL-004",
    "name": "Spooki",
    "capacity": 38,
    "status": "disabled",
    "is_blocked": true,
    "has_conflict": false
  }
]
```

### Reglas para Colores en el Mapa:
- `status === "available"`: Verde (Libre para reservar).
- `status === "occupied"`: Amarillo/Naranja (Ocupada por otra reserva en esa franja).
- `status === "disabled"`: Rojo (Inhabilitada por incidencia o mantenimiento; no reservable).

---

## 3. Reservas de Salas (HU-22)

### `POST /reservations`
- **Roles autorizados:** `admin`, `teacher` (rol `support` recibe `403`).
- **Request:**
```json
{
  "space_id": "SAL-002",
  "date": "2026-10-20",
  "start_time": "08:00",
  "end_time": "10:00",
  "attendees": 20,
  "title": "Clase de Programación"
}
```
- **Respuesta `201 Created`:**
```json
{
  "id": 1,
  "space_id": "SAL-002",
  "space_name": "Cosmos",
  "user_id": 2,
  "date": "2026-10-20",
  "start_time": "08:00:00",
  "end_time": "10:00:00",
  "attendees": 20,
  "title": "Clase de Programación",
  "status": "confirmed",
  "events": [
    {
      "event_type": "created",
      "created_at": "2026-10-16T14:30:00Z",
      "actor_id": 2,
      "details": "Reservation created with 20 attendees."
    }
  ]
}
```
- **Manejo de Errores Comunes:**
  - `409 Conflict`: Sala bloqueada, aforo excedido o solapamiento de horario.
  - `422 Validation Error`: `start_time >= end_time` o número de asistentes $\le 0$.

### `GET /reservations`
- Permite filtrar por `date`, `space_id`, `status` (`confirmed` o `cancelled`).
- Un docente ve únicamente sus reservas creadas; un administrador ve todas las del campus.

### `DELETE /reservations/{id}`
- Cancela lógicamente la reserva (`status: "cancelled"`).
- Libera de inmediato la disponibilidad en el mapa de salas.

---

## 4. Recursos Tecnológicos y Préstamos (HU-23)

- **`GET /resources`**: Lista inventario. Devuelve `id`, `name`, `type`, `serial_number`, `status` (`available`, `loaned`, `in_repair`, `retired`), `is_blocked`.
- **`GET /resources/loans`**: Préstamos activos e históricos con `user_name`, `resource_name`, `loan_date`, `expected_return_date`, `status` (`active`, `returned`, `overdue`).
- **`POST /resources/loans`**:
  - Request: `{"resource_id": 1, "expected_return_date": "2026-10-21T18:00:00Z"}`
  - Response `201`: Préstamo registrado.
- **`POST /resources/loans/{id}/return`**: Registra la entrega del equipo (`status: "returned"`).

---

## 5. Incidencias y Flujo de IA (HU-20 y HU-24)

El flujo se divide en dos pasos: **Análisis previo** y **Confirmación**.

### Paso 1: Análisis con IA / Fallback (`POST /incidents/analyze`)
- **Request:**
```json
{
  "description": "El aire acondicionado de Cosmos comenzó a gotear sobre los tomacorrientes y hay olor a quemado.",
  "space_id": "SAL-002",
  "resource_id": null
}
```
- **Respuesta `200 OK`:**
```json
{
  "category": "infrastructure",
  "priority": "critical",
  "assigned_team": "facilities",
  "suggested_action": "Inhabilitar sala Cosmos de inmediato y revisar sistema eléctrico.",
  "requires_blocking": true,
  "confidence_score": 0.95,
  "classification_source": "ai",
  "alternatives": [
    {
      "id": "SAL-005",
      "name": "Apolo",
      "capacity": 34,
      "reason": "Capacidad compatible (34 >= 25) y actualmente operativa."
    }
  ],
  "analysis_token": "eyJhbGciOi..."
}
```
*Si la IA no tiene API key configurada o falla la red, `classification_source` responderá `"rules"` con el mismo esquema y cálculo real de alternativas.*

### Paso 2: Registro en Base de Datos (`POST /incidents`)
- **Request:**
```json
{
  "description": "El aire acondicionado de Cosmos comenzó a gotear sobre los tomacorrientes.",
  "space_id": "SAL-002",
  "resource_id": null,
  "category": "infrastructure",
  "priority": "critical",
  "block_space": true,
  "block_resource": false,
  "analysis_token": "eyJhbGciOi..."
}
```
- Si `block_space: true` y el usuario tiene rol `admin` o `support`, la sala cambia inmediatamente a `is_blocked = true`, inhabilitando nuevas reservas en `GET /spaces` y reflejándose en rojo en el mapa.
