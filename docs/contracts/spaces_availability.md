# Contrato de espacios y disponibilidad (HU-02)

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
