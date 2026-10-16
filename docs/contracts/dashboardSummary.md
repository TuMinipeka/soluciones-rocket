# Resumen operativo del dashboard (HU-19)

`GET /dashboard/summary` requiere `Authorization: Bearer <token>` y devuelve conteos calculados desde SQLite. Acepta `date=YYYY-MM-DD`, `start_time=HH:MM` y `end_time=HH:MM` juntos; el intervalo debe tener inicio anterior al fin. La ocupación usa exactamente las reglas de `GET /spaces` para la misma franja. Sin intervalo, todas las salas operativas figuran como disponibles y ninguna como ocupada.

```json
{
  "available_spaces": 8,
  "occupied_spaces": 1,
  "disabled_spaces": 1,
  "active_loans": 1,
  "disabled_resources": 1,
  "open_incidents": 1,
  "in_progress_incidents": 1
}
```

`active_loans` cuenta préstamos sin devolución registrada. `disabled_resources` cuenta equipos bloqueados o con condición distinta de `operational`. Las incidencias se agrupan por sus estados persistidos `open` e `in_progress`. La interfaz debe mostrar errores o ausencia de datos con claridad; no usar métricas de muestra como reemplazo.
