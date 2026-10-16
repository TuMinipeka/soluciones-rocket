# Arquitectura y Estrategia de Escalabilidad del Sistema

**Documento:** Escalabilidad, Resiliencia y Roadmap Post-Hackatón  
**Sistema:** Campus Control — Sistema Central de Gestión Operativa

---

## 1. Visión General de la Arquitectura

Campus Control fue concebido como un **Monolito Modular** estructurado en capas desacopladas con inversión de dependencias:
- **Capa de Transporte (FastAPI):** Enrutamiento, validación con Pydantic y serialización HTTP.
- **Capa de Dominio y Negocio (Services):** Servicios de disponibilidad, validación de solapamiento horario atómico, clasificación heurística y adaptadores de IA.
- **Capa de Persistencia (SQLAlchemy ORM):** Mapeo de entidades relacionales con claves foráneas e integridad referencial activa.

```text
               ┌────────────────────────────────────────────────────────┐
               │              React / Vite Frontend SPA                 │
               └──────────────────────────┬─────────────────────────────┘
                                          │ HTTP / JSON (JWT Bearer)
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │                     FastAPI Gateway                    │
               │  [Auth]  [Users]  [Spaces]  [Reservations]  [Loans]    │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                   ┌──────────────────────┼──────────────────────┐
                   ▼                      ▼                      ▼
           ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
           │ Domain Logic │       │  AI / Rules  │       │ Availability │
           │ & Policies   │       │   Adapter    │       │   Engine     │
           └───────┬──────┘       └───────┬──────┘       └───────┬──────┘
                   │                      │                      │
                   └──────────────────────┼──────────────────────┘
                                          │
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │               SQLAlchemy ORM Session                   │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │         Database (SQLite Dev -> PostgreSQL Prod)       │
               └────────────────────────────────────────────────────────┘
```

---

## 2. Hoja de Ruta para Escalabilidad en Producción

### 2.1 Migración de Persistencia: De SQLite a PostgreSQL Multi-AZ
Para el evento de 5 horas, SQLite persistente en un volumen montado es ideal por su portabilidad y nula latencia de red. Para escalar a miles de usuarios concurrentes en múltiples campus:
- **Motor de Base de Datos:** PostgreSQL 16 con réplicas de lectura (Read Replicas).
- **Concurrencia de Reservas:** Reemplazar el `BEGIN IMMEDIATE` de SQLite por `SELECT ... FOR UPDATE` de PostgreSQL para aislar transacciones en solapamiento de horarios bajo concurrencia extrema.
- **Connection Pooling:** Integrar `pgbouncer` o el pool asíncrono `asyncpg` con SQLAlchemy AsyncEngine para soportar hasta 10,000 conexiones concurrentes sin saturar memoria.

### 2.2 Desacoplamiento de Cargas Pesadas mediante Workers Asíncronos
Actualmente, las llamadas a la API del LLM para el análisis de incidencias (`POST /incidents/analyze`) y la búsqueda de salas alternativas se ejecutan síncronamente con un timeout de 15 segundos.
- **Cola de Mensajería:** Implementar **Redis + ARQ / Celery** para encolar análisis complejos de texto o reubicaciones masivas.
- **Webhook / Push Notifications:** Cuando el LLM finalice la clasificación en segundo plano, notificar al frontend mediante WebSockets o Server-Sent Events (SSE).

### 2.3 Sincronización en Tiempo Real (Live Map HU-18)
El mapa de salas tipo cine se beneficia enormemente de actualizaciones instantáneas sin recargar la página:
- **Canal Pub/Sub (Redis):** Cada vez que se confirma una reserva (`reservation_created`), se cancela una (`reservation_cancelled`) o se reporta una incidencia crítica (`incident_blocked_space`), publicar un evento en un tópico `campus:events`.
- **FastAPI WebSockets / SSE:** Difundir el cambio de estado a todos los clientes conectados en menos de 50 milisegundos.

### 2.4 Estrategia de Caché de Disponibilidad
Las consultas a `GET /spaces` son de lectura intensiva:
- **Caché en Redis:** Guardar en caché la disponibilidad calculada por día (`spaces:availability:2026-10-16`) con TTL de 5 minutos.
- **Invalidación Basada en Eventos:** Invalidar selectivamente la llave del día en Redis inmediatamente después de un `commit` exitoso en reservas o incidencias.

---

## 3. Resiliencia y Mitigación de Riesgos en la IA

El sistema implementa el patrón **Graceful Degradation** (degradación elegante):
1. **Circuit Breaker:** Si el proveedor de IA experimenta caídas consecutivas o latencias mayores a 5 segundos, el adaptador conmuta automáticamente al motor de reglas locales sin esperar timeouts.
2. **Deterministic Rules Engine:** La heurística basada en palabras clave del dominio garantiza que el sistema continúe clasificando fallas eléctricas, de plomería, mobiliario o redes sin depender de conexión a internet.
3. **Signed Analysis Token (HMAC-SHA256):** Toda respuesta de triaje (sea por IA o por reglas) va firmada con un secreto del backend. Esto previene que un usuario malintencionado altere la severidad o las salas recomendadas en el payload de confirmación.
