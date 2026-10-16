# Contrato de espacios, disponibilidad, reservas y reubicación (HU-02 a HU-05)

Todas las rutas requieren `Authorization: Bearer <token>` y conservan el formato de error compartido `{"error":{"code":"...","message":"...","details":...}}`.

## Consultar las salas

`GET /spaces` devuelve las diez salas persistidas en SQLite, ordenadas por identificador. Los parámetros de disponibilidad son opcionales como conjunto:

- `date`: fecha ISO 8601, por ejemplo `2026-10-16`.
- `start_time`: hora local del campus, por ejemplo `08:00`.
- `end_time`: hora local del campus, por ejemplo `10:00`.

Si se proporciona uno de estos parámetros, deben proporcionarse los tres. `start_time` debe ser estrictamente anterior a `end_time`; una franja inválida devuelve `422 VALIDATION_ERROR`.

Respuesta `200 OK`:

```json
[
  {
    "id": "SAL-002",
    "name": "Cosmos",
    "capacity": 25,
    "status": "available",
    "is_blocked": false,
    "has_conflict": false
  }
]
```

`status` toma uno de estos valores:

- `disabled`: la sala está inhabilitada; tiene prioridad sobre cualquier reserva.
- `occupied`: existe una reserva `confirmed` que se solapa con la franja consultada.
- `available`: la sala está operativa y no tiene conflictos en esa franja.

Dos intervalos se solapan únicamente cuando `existing.start_time < requested.end_time` y `existing.end_time > requested.start_time`. Por tanto, una reserva que termina exactamente al iniciar otra no produce conflicto. Las reservas canceladas no bloquean disponibilidad y una reserva en otro día u horario no marca la sala como ocupada permanentemente.

Sin parámetros de fecha y hora, la respuesta conserva las diez salas y solo diferencia las salas inhabilitadas de las operativas; `has_conflict` es `false`.

## Consultar una sala

`GET /spaces/{space_id}` devuelve la sala persistida con el mismo esquema base. Un identificador inexistente devuelve `404 NOT_FOUND`.

## Crear una reserva

`POST /reservations` requiere un usuario autenticado con rol `admin` o `teacher`. El rol `support` recibe `403 FORBIDDEN`.

Solicitud:

```json
{
  "space_id": "SAL-002",
  "date": "2026-10-20",
  "start_time": "08:00",
  "end_time": "10:00",
  "attendees": 20,
  "title": "Clase de programación"
}
```

Una reserva válida se persiste inmediatamente con estado `confirmed` y responde `201 Created`:

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
  "title": "Clase de programación",
  "status": "confirmed"
}
```

Reglas aplicadas dentro de una transacción SQLite:

- La sala debe existir y permanecer habilitada.
- `start_time` debe ser estrictamente anterior a `end_time`.
- `attendees` debe ser mayor que cero y no superar el aforo persistido de la sala.
- No puede existir otra reserva `confirmed` de la misma sala y fecha que se solape con la franja solicitada.
- La comprobación y la escritura adquieren un bloqueo de escritura SQLite para que dos solicitudes concurrentes incompatibles no se confirmen simultáneamente.

Una sala inexistente devuelve `404 NOT_FOUND`; una sala inhabilitada, aforo excedido o solapamiento devuelve `409 CONFLICT`; entradas con formato o intervalo inválido devuelven `422 VALIDATION_ERROR`.

## Consultar y gestionar reservas

Las rutas de gestión aceptan únicamente roles `admin` y `teacher`:

| Ruta | Comportamiento |
| --- | --- |
| `GET /reservations` | Un docente recibe únicamente sus reservas; un administrador puede consultar todas. Acepta filtros `date`, `space_id`, `user_id` y `status`. |
| `PUT /reservations/{id}` | Modifica uno o varios campos editables y vuelve a validar sala, aforo, intervalo y solapamientos. |
| `DELETE /reservations/{id}` | Cancela lógicamente la reserva y devuelve el registro con `status: "cancelled"`; no elimina información. |

Un docente recibe `403 FORBIDDEN` al intentar modificar o cancelar una reserva ajena. Un administrador puede gestionar cualquier reserva. Una reserva cancelada no puede modificarse ni cancelarse de nuevo y devuelve `409 CONFLICT`.

Las modificaciones se ejecutan de forma atómica con la misma serialización SQLite de la creación. Al verificar solapamientos, la reserva que se está modificando se excluye de la consulta. Cambiar de horario o sala vuelve a ejecutar todas las reglas de HU-03.

Cada respuesta de reserva incluye `events`, ordenados cronológicamente, con eventos `created`, `updated` y `cancelled`. La cancelación conserva la reserva y registra quién realizó la acción. Al quedar en estado `cancelled`, deja de bloquear inmediatamente `GET /spaces`.

## Reubicar reservas afectadas

Todas las rutas de reubicación requieren rol `admin`:

| Ruta | Comportamiento |
| --- | --- |
| `GET /reservations/affected` | Lista reservas `confirmed`, con fecha actual o futura, cuya sala está inhabilitada. |
| `GET /reservations/{id}/reallocations` | Calcula alternativas compatibles para una reserva afectada. |
| `POST /reservations/{id}/reallocate` | Confirma una alternativa después de revalidarla dentro de una transacción. |

Confirmación:

```json
{
  "new_space_id": "SAL-005",
  "notes": "Cambio confirmado por mantenimiento"
}
```

Una alternativa se obtiene exclusivamente desde SQLite y debe cumplir simultáneamente:

- Ser diferente de la sala afectada.
- Estar operativa y no inhabilitada.
- Tener capacidad igual o superior al número de asistentes.
- No tener una reserva `confirmed` que se solape en la misma fecha y franja.
- Cumplir los recursos requeridos cuando esos datos existan. El modelo actual no registra recursos por reserva, por lo que la respuesta declara `resources_checked: false` en vez de inventar compatibilidad.

Las alternativas se ordenan de forma determinista por menor capacidad sobrante y luego por identificador. Si no existe ninguna, la API devuelve una lista vacía con una explicación clara.

La confirmación solo se permite mientras la reserva continúe `confirmed` y su sala original siga bloqueada. Antes de cambiar `space_id`, el backend repite todas las validaciones bajo bloqueo de escritura. Una alternativa ocupada entre la recomendación y la confirmación devuelve `409 CONFLICT` y conserva la reserva original. El cambio exitoso registra un evento `relocated` con sala de origen, destino, actor y notas.
