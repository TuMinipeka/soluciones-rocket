# Hackatón Campuslands | 5 horas | 5 desarrolladores

Fuente: `Hackaton Rubricas & Informacion.pdf`. Transcripción a Markdown; las decisiones y pendientes se conservan como aparecen en el PDF.

El proyecto tendrá una arquitectura de monolito modular, con React en el frontend, FastAPI en el backend, SQLite como base de datos y un motor de inteligencia artificial para clasificar incidencias y recomendar soluciones.

La prioridad será desarrollar un sistema real, donde las reservas, los préstamos de equipos y las incidencias estén relacionados entre sí.

La innovación central será la continuidad operativa inteligente: cuando una sala quede inhabilitada, el sistema identificará reservas afectadas y propondrá alternativas compatibles, sin modificar nada hasta que un usuario autorizado confirme.

Mafe y Guerra trabajarán en los tres módulos, como decidieron. Para evitar conflictos de Git, compartirán componentes y contratos, pero se repartirán archivos distintos y coordinarán quién modifica cada uno.

La política sobre qué roles pueden reservar salas queda pendiente. No la vamos a suponer. El backend tendrá esa regla centralizada para configurarla sin modificar todos los endpoints.

> Punto de control obligatorio: a las 2 horas y 30 minutos deberán tener persistencia, reservas, préstamos y registro de incidencias. Si algo de esto no funciona, se suspende cualquier mejora visual adicional para corregirlo.

![Responsabilidades de Conde, Mayorga, Diego, Mafe y Guerra](resources/teamResponsibilities.png)

## Capacidad

Nota de coordinación: los nombres de SAL-003, SAL-004 y SAL-006 se corrigieron a Skylab, Sputnik y Sala Nueva tras la transcripción inicial; sus identificadores y aforos no cambiaron.

| ID | Nombre | Aforo |
| --- | --- | ---: |
| SAL-001 | Auditorio | 100 |
| SAL-002 | Cosmos | 25 |
| SAL-003 | Skylab | 20 |
| SAL-004 | Sputnik | 38 |
| SAL-005 | Apolo | 34 |
| SAL-006 | Sala Nueva | 12 |
| SAL-007 | Azul | 10 |
| SAL-008 | Amarillas | 6 |
| SAL-009 | Verdes | 6 |
| SAL-010 | Artemis | 32 |

## Diseño del SEED mínimo

- Salas: 10 definidas.
- Usuarios: 3 cuentas iniciales, administrador, docente y soporte.
- Equipos: inventario real autorizado.
- Reservas: 5 escenarios que prueben disponibilidad, aforo y solapamiento.
- Préstamos: 3 escenarios, disponible, en uso y devuelto.
- Incidencias: 5 escenarios para probar clasificación, prioridad y reubicación.

## Login, JWT y administración de cuentas

Se implementarán tres roles: administrador, docente y soporte.

La autorización para reservar salas permanece pendiente de decisión. Se implementará una política centralizada `can_reserve(role)` que permita activar los roles autorizados sin modificar los servicios.

Flujo:

1. El usuario crea una cuenta con nombre, correo y contraseña.
2. La contraseña se guarda utilizando Argon2.
3. Las nuevas cuentas reciben un rol no privilegiado definido por la política de registro. Para este MVP puede usarse docente únicamente si el equipo aprueba que sea el rol público.
4. El usuario inicia sesión y recibe un JWT firmado con expiración.
5. FastAPI valida el token y el rol para cada operación protegida.
6. Solo el administrador puede modificar roles o desactivar cuentas.

El primer administrador se creará mediante un comando de inicialización con credenciales suministradas por variables de entorno, nunca mediante registro público con selección libre de roles.

## Estrategia Docker y `.env`

Responsable: Mayorga.

Se ejecutará todo exclusivamente mediante Docker Compose, tal como decidieron.

Servicios:

- `frontend`: React y Vite, puerto 5173.
- `backend`: FastAPI, puerto 8000.
- `campus_data`: volumen persistente para SQLite.

Comandos de operación:

```sh
docker compose up --build -d
docker compose ps
docker compose logs -f backend
docker compose down
```

El archivo `.env.example` tendrá esta estructura:

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

La clave JWT debe ser aleatoria y segura, y la contraseña inicial del administrador debe proporcionarse al inicializar el entorno. Ninguna de las dos se debe subir a GitHub.

La clave de la IA permanecerá exclusivamente en el backend. Docker debe montar un volumen real en `/app/data` y contar con una verificación de salud del backend para que el frontend no intente consumir una API que todavía no ha iniciado.

## Fallback cuando la IA no funcione

El sistema tendrá un clasificador local basado en reglas explícitas. Por ejemplo, expresiones como «proyector», «computador» o «pantalla» podrán sugerir la categoría tecnología.

Debe identificarse claramente qué método produjo la clasificación: `ai` o `rules`.

Este fallback no se presentará como una respuesta de IA. Durante la sustentación, demostrarán que la clasificación del modelo es real y que el sistema puede continuar operando cuando el servicio falla.

## Reubicación inteligente

Cuando una sala esté inhabilitada:

1. Consultar las reservas futuras afectadas.
2. Buscar salas disponibles en las mismas franjas.
3. Excluir salas con aforo insuficiente o estado incompatible.
4. Verificar recursos requeridos cuando esa información exista.
5. Ordenar alternativas por compatibilidad y aprovechamiento de capacidad.
6. Presentar las alternativas y permitir su confirmación.

El algoritmo de disponibilidad será determinista. La IA podrá explicar o ayudar a priorizar las opciones, pero no inventará espacios ni decidirá unilateralmente los cambios.

| Responsable | Debe entregar temprano | Quién depende de ello |
| --- | --- | --- |
| Mayorga | Modelos y sesiones de base de datos | Conde y Diego |
| Conde | Contratos de reservas y espacios | Mafe y Guerra |
| Diego | Contratos de login e incidencias | Guerra y Conde |
| Mafe | Componentes compartidos y navegación | Guerra |
| Guerra | Cliente HTTP y manejo de JWT | Mafe |
