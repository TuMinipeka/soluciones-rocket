# Contrato de recursos y préstamos (HU-08)

El inventario inicia vacío. Solo un administrador registra equipos reales o autorizados para la demostración. Todas las rutas requieren `Authorization: Bearer <token>` y usan el formato de error compartido `{"error":{"code":"...","message":"...","details":...}}`.

| Ruta | Acceso | Cuerpo / respuesta |
| --- | --- | --- |
| `POST /resources` | admin | `{ "id": "EQ-001", "name": "Proyector", "category": "projector" }` → 201, recurso |
| `GET /resources` | autenticado | Lista de recursos; filtro opcional `category` |
| `GET /resources/{id}` | autenticado | Recurso |
| `PATCH /resources/{id}` | admin | `{ "condition": "operational" \| "damaged" }` → recurso |
| `POST /resources/loans` | admin, teacher | `{ "resource_id": "EQ-001", "start_time": "2026-10-16T14:00:00Z", "expected_return": "2026-10-16T16:00:00Z", "notes": "Clase" }` → 201, préstamo |
| `GET /resources/loans` | autenticado | Lista; docente solo ve sus préstamos |
| `POST /resources/loans/{id}/return` | admin o solicitante | Préstamo con `returned_at` del servidor y `status: "returned"` |

Un recurso expone `id`, `name`, `category`, `condition`, `is_blocked` y `status`. `status` es `available`, `loaned` o `disabled`; `loaned` significa que hay un préstamo sin devolución registrada. Un préstamo expone `id`, `resource_id`, `resource_name`, `user_id`, `start_time`, `expected_return`, `returned_at`, `status` (`active` o `returned`) y `notes`.

La API acepta fechas ISO 8601; las fechas sin zona se interpretan como UTC. La devolución prevista debe ser posterior al inicio. Un equipo dañado, bloqueado por una incidencia o con un préstamo incompatible devuelve `409 CONFLICT`. Un identificador inexistente devuelve `404 NOT_FOUND`; intervalos inválidos devuelven `422 VALIDATION_ERROR`; un rol no autorizado devuelve `403 FORBIDDEN`. La disponibilidad se decide en SQLite en la misma transacción que crea el préstamo. Una incidencia de Diego puede bloquear el equipo en esa transacción y restaurarlo al resolverse si no hay otros bloqueos activos.
