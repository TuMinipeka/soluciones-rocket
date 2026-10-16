# CAMPUS CONTROL

Backlog de historias de usuario, criterios de aceptación y calidad.

Fuente: `Trabajo x hacer.pdf`. Transcripción a Markdown del contenido del PDF.

**Proyecto:** Sistema Central de Gestión Operativa de Campuslands. **Duración:** 5 horas. **Equipo:** Conde, Mayorga, Mafe, Guerra y Diego. **Metodología:** Desarrollo ágil con historias pequeñas, entregables verificables e integración continua.

## 1. Organización del backlog

Cada historia debe tener un resultado funcional que el jurado pueda comprobar.

| Responsable | Área principal | Historias asignadas |
| --- | --- | --- |
| Conde | Arquitectura, backend y reservas | HU-01 a HU-05 |
| Mayorga | Base de datos, inventario y Docker | HU-06 a HU-10 |
| Diego | JWT, usuarios, incidencias e IA | HU-11 a HU-16 |
| Mafe | Frontend visual y dashboard | HU-17 a HU-20 |
| Guerra | Frontend funcional e integración | HU-21 a HU-24 |

Prioridades: **P0** = indispensable para la demostración; **P1** = importante para el producto integrado; **P2** = mejora que puede simplificarse si se agota el tiempo.

## 2. Historias de Conde — Backend y arquitectura

### HU-01 — Inicialización de FastAPI (P0)

Como desarrollador, quiero disponer de una API organizada y documentada para integrar los módulos del sistema.

**Criterios de aceptación**

- La API inicia dentro del contenedor Docker.
- `GET /health` responde 200 con el estado del servicio.
- `/docs` expone los endpoints mediante OpenAPI.
- Los errores se devuelven en JSON con una estructura consistente.

**Calidad:** modularidad, configuración externa, manejo centralizado de excepciones y ausencia de credenciales en el código.

### HU-02 — Consultar disponibilidad de salas (P0)

Como docente, quiero consultar salas por fecha y horario para conocer cuáles puedo reservar.

**Criterios de aceptación**

- `GET /spaces` permite consultar las 10 salas con su aforo.
- Recibe fecha, hora inicial y hora final.
- Calcula ocupación utilizando reservas confirmadas.
- Identifica salas inhabilitadas y conflictos existentes.
- No muestra una sala ocupada permanentemente por tener reservas en otro horario.

**Calidad:** datos consultados desde SQLite, horarios consistentes, consultas eficientes y sin estados fijados manualmente.

### HU-03 — Crear reservas válidas (P0)

Como docente o administrador, quiero reservar una sala indicando fecha, horario y asistentes para asegurar su disponibilidad.

**Criterios de aceptación**

- `POST /reservations` exige autenticación.
- Solo permite roles administrador y docente.
- Rechaza aforo excedido.
- Rechaza solapamiento horario.
- Rechaza salas inhabilitadas.
- Valida que inicio sea anterior al final.
- Confirma automáticamente una reserva válida y la persiste.
- Dos intentos concurrentes sobre la misma sala y horario no producen reservas duplicadas o incompatibles.

**Calidad:** reglas implementadas en servicios, operación transaccional, errores 400, 403 o 409 según el caso, y pruebas automatizadas.

### HU-04 — Modificar y cancelar reservas (P1)

Como docente, quiero gestionar mis reservas para corregir horarios o cancelar actividades.

**Criterios de aceptación**

- Un docente solo modifica o cancela reservas propias.
- Un administrador puede gestionar todas.
- Al cambiar horario o sala se ejecutan de nuevo las validaciones.
- Una reserva cancelada deja de bloquear disponibilidad.
- Se conserva el registro de la reserva cancelada.

**Calidad:** control de autorización por registro, actualizaciones atómicas y trazabilidad de estados.

### HU-05 — Proponer reubicaciones (P1)

Como administrador, quiero recibir alternativas para reservas afectadas por una sala inhabilitada para mantener las actividades del campus.

**Criterios de aceptación**

- Identifica reservas vigentes afectadas.
- Excluye salas ocupadas o inhabilitadas.
- Respeta aforo, horario y recursos requeridos cuando se conozcan.
- Presenta alternativas justificadas.
- Si no hay alternativa válida, lo informa.
- Solo un administrador puede confirmar la reubicación.
- Antes de confirmar, verifica nuevamente la disponibilidad.

**Calidad:** algoritmo determinista, sin recomendaciones inventadas, operaciones transaccionales y pruebas con casos sin alternativas.

## 3. Historias de Mayorga — Base de datos, inventario y DevOps

### HU-06 — Persistencia de datos (P0)

Como administrador, quiero que la información se conserve para mantener la continuidad operativa.

**Criterios de aceptación**

- SQLAlchemy define entidades y relaciones.
- SQLite conserva reservas, usuarios, préstamos e incidencias.
- Las relaciones cuentan con integridad referencial.
- Reiniciar los contenedores no elimina la información.
- Una operación fallida no deja registros relacionados incompletos.

**Calidad:** claves foráneas activas, sesiones correctamente cerradas, transacciones y esquema reproducible.

### HU-07 — Crear SEED reproducible (P0)

Como evaluador, quiero encontrar datos suficientes para demostrar las operaciones para probar el MVP sin preparar registros manualmente.

**Criterios de aceptación**

- Carga exactamente las 10 salas definidas.
- Mantiene sus nombres y capacidades.
- Crea cuentas de demostración de administrador, docente y soporte.
- Crea reservas e incidencias ficticias identificadas como demostración.
- Utiliza fechas configurables para escenarios futuros.
- Ejecutarlo dos veces no duplica registros.
- No sobrescribe datos oficiales ni operaciones existentes.

**Calidad:** datos deterministas, idempotencia, credenciales de demostración configurables y pruebas de integridad.

### HU-08 — Administrar recursos y préstamos (P0)

Como administrador o docente, quiero consultar y solicitar equipos disponibles para utilizarlos en actividades académicas.

**Criterios de aceptación**

- El inventario se obtiene de SQLite.
- Permite registrar equipos autorizados cuando estén disponibles los datos.
- Un préstamo incluye usuario, equipo, fecha y hora de entrega y devolución prevista.
- Impide préstamos de equipos dañados o inhabilitados.
- Impide intervalos de préstamo incompatibles.
- La devolución actualiza el préstamo y permite reutilizar el equipo cuando corresponda.
- Las operaciones conservan su historial.

**Calidad:** sin inventario oficial inventado, consistencia transaccional, trazabilidad y pruebas de disponibilidad.

### HU-09 — Importar dataset oficial (P0)

Como administrador, quiero incorporar los archivos oficiales del reto para operar sobre los datos entregados por Campuslands.

**Criterios de aceptación**

- Existe un importador con adaptación para los formatos CSV, JSON o Excel según se reciba el archivo.
- Valida columnas, identificadores y relaciones.
- Detecta registros duplicados e inconsistentes.
- Registra qué filas se importaron y cuáles fueron rechazadas.
- No sobrescribe silenciosamente información válida.
- Permite consultar en la aplicación los datos importados.

**Calidad:** importación repetible, reporte de errores, preservación del archivo original y pruebas con registros inválidos.

### HU-10 — Ejecutar con Docker Compose (P0)

Como evaluador, quiero ejecutar el sistema de forma reproducible para comprobar su funcionamiento.

**Criterios de aceptación**

- `docker compose up --build` inicia frontend y backend.
- El frontend puede comunicarse con FastAPI.
- SQLite utiliza un volumen persistente.
- `.env.example` documenta todas las variables necesarias.
- Los archivos `.env` reales están excluidos del repositorio.
- Los logs permiten diagnosticar fallos de arranque.

**Calidad:** configuración reproducible, contenedores sin secretos incorporados y README con instrucciones verificadas.

## 4. Historias de Diego — Autenticación, seguridad e IA

### HU-11 — Registro público de usuarios (P0)

Como visitante, quiero crear una cuenta para acceder a las funcionalidades autorizadas de Campus Control.

**Criterios de aceptación**

- `POST /auth/register` recibe nombre, correo y contraseña.
- Toda cuenta pública recibe automáticamente el rol `teacher`.
- No permite registrar dos usuarios con el mismo correo.
- La contraseña se almacena con Argon2.
- Nunca devuelve el hash de contraseña.
- Ignora o rechaza un rol privilegiado enviado desde el cliente.

**Calidad:** validación con Pydantic, hash seguro, correo único en base de datos y pruebas contra escalamiento de privilegios.

### HU-12 — Login y autenticación JWT (P0)

Como usuario registrado, quiero iniciar sesión para acceder de manera segura al sistema.

**Criterios de aceptación**

- `POST /auth/login` valida credenciales.
- Genera JWT firmado con fecha de expiración.
- `GET /auth/me` devuelve la identidad autenticada.
- Un token alterado o expirado devuelve 401.
- Las cuentas inactivas no pueden acceder.
- La clave JWT se obtiene del entorno.

**Calidad:** firma verificada, expiración obligatoria, hash de contraseñas y pruebas de autenticación.

### HU-13 — Administración de usuarios y permisos (P1)

Como administrador, quiero consultar usuarios y modificar sus roles para controlar quién accede a cada operación.

**Criterios de aceptación**

- Únicamente el administrador puede cambiar roles.
- Un docente puede reservar; soporte no puede.
- Soporte puede atender incidencias según sus permisos.
- Un usuario no puede modificar su propio rol.
- Un usuario desactivado pierde acceso a endpoints protegidos.
- Un intento sin permisos responde 403.

**Calidad:** autorización en el backend, política de roles centralizada, protección por recurso y pruebas de acceso indebido.

### HU-14 — Registro y gestión de incidencias (P0)

Como docente, quiero registrar fallas o problemas del campus para que el personal responsable pueda atenderlos.

**Criterios de aceptación**

- `POST /incidents` registra una incidencia con descripción y contexto.
- Puede vincularse a una sala o recurso existente.
- Permite consultar estado, prioridad y responsable.
- El equipo autorizado puede actualizar o resolver incidencias.
- Se registra un historial de cambios.
- Una incidencia que inhabilite un espacio o recurso modifica su disponibilidad mediante reglas del backend.

**Calidad:** trazabilidad, integridad referencial, control de permisos y operaciones consistentes entre módulos.

### HU-15 — Clasificación inteligente de incidencias (P0)

Como usuario que reporta una incidencia, quiero recibir una clasificación automática para facilitar su atención.

**Criterios de aceptación**

- `POST /incidents/analyze` procesa una descripción real.
- Envía la información a una API o modelo autorizado.
- Obtiene categoría, prioridad, equipo responsable y recomendación.
- Valida la respuesta con Pydantic.
- Si el modelo devuelve campos incorrectos, no persiste datos inválidos.
- No permite que la IA invente salas o recursos existentes.
- Identifica si la clasificación provino de IA o de reglas locales.

**Calidad:** respuestas estructuradas, tiempos de espera controlados, registro seguro de errores y pruebas con respuestas inesperadas.

### HU-16 — Fallback y recomendaciones operativas (P1)

Como administrador, quiero que el sistema siga clasificando incidencias y proponga soluciones cuando la IA falle para no detener la operación.

**Criterios de aceptación**

- Detecta errores, tiempos de espera y respuestas inválidas de IA.
- Activa un clasificador local basado en reglas.
- Identifica claramente `classification_source: "rules"`.
- El fallback no simula haber usado un modelo externo.
- Las recomendaciones de equipos o salas se obtienen de datos reales.
- Si no existe solución compatible, lo indica.
- Ninguna recomendación altera automáticamente una reserva o préstamo.

**Calidad:** funcionamiento degradado seguro, reglas deterministas, separación entre recomendación y ejecución, y pruebas con IA desconectada.

## 5. Historias de Mafe — Frontend visual

### HU-17 — Interfaz principal y navegación (P0)

Como usuario autenticado, quiero navegar entre las funcionalidades del campus para acceder rápidamente a la información que necesito.

**Criterios de aceptación**

- React, Vite y Tailwind funcionan dentro de Docker.
- Existe navegación hacia salas, reservas, recursos e incidencias.
- Los componentes comparten estilos consistentes.
- Las pantallas muestran carga, éxito, vacío y error cuando corresponda.
- La interfaz se adapta a computador y teléfono.

**Calidad:** componentes reutilizables, accesibilidad básica, claridad visual y código organizado.

### HU-18 — Mapa interactivo de salas (P0)

Como docente, quiero observar las salas mediante un mapa visual parecido a la selección de asientos de cine para identificar disponibilidad rápidamente.

**Criterios de aceptación**

- Representa las 10 salas con sus nombres reales.
- Muestra sus capacidades correctas.
- Aplica colores diferenciados para disponible, ocupado, incidencia e inhabilitado.
- Actualiza la información al cambiar fecha y horario.
- Al seleccionar una sala muestra sus detalles.
- Los colores y textos se basan en respuestas de la API.

**Calidad:** sin datos de disponibilidad quemados, leyenda accesible, selección por teclado y estados reconocibles además del color.

### HU-19 — Dashboard operativo (P1)

Como administrador, quiero consultar indicadores generales para comprender la situación del campus.

**Criterios de aceptación**

- Muestra espacios disponibles y ocupados para una franja.
- Muestra préstamos activos y recursos inhabilitados.
- Muestra incidencias abiertas y en proceso.
- Los indicadores provienen de `GET /dashboard/summary`.
- Los valores cambian tras realizar operaciones.
- Si no existen datos, muestra un estado vacío comprensible.

**Calidad:** indicadores consistentes con el backend, diseño legible y manejo correcto de fallos de consulta.

### HU-20 — Visualización de incidencias y recomendaciones (P1)

Como administrador o personal de soporte, quiero visualizar incidencias, prioridades y recomendaciones para tomar decisiones.

**Criterios de aceptación**

- Las incidencias muestran categoría, prioridad y estado.
- Se diferencia visualmente una recomendación de IA de una acción confirmada.
- Se muestran las salas o equipos afectados.
- Las recomendaciones aparecen con su explicación.
- Un usuario autorizado puede acceder a la acción de confirmación.
- Si no hay alternativas, la interfaz informa la situación.

**Calidad:** manejo de datos faltantes, mensajes comprensibles y ausencia de acciones engañosas o controles sin funcionamiento.

## 6. Historias de Guerra — Frontend funcional e integración

### HU-21 — Login, registro y sesión (P0)

Como usuario, quiero registrarme, iniciar sesión y cerrar sesión para utilizar Campus Control de manera segura.

**Criterios de aceptación**

- Existen formularios de login y registro.
- El registro público no ofrece elección de rol.
- El cliente HTTP envía el token JWT en endpoints protegidos.
- Las rutas privadas requieren autenticación.
- Un error 401 elimina el acceso a operaciones protegidas.
- El usuario puede cerrar sesión.
- La interfaz presenta mensajes adecuados para credenciales inválidas.

**Calidad:** no exponer secretos en el frontend, formularios accesibles, estado de sesión coherente y mensajes claros.

### HU-22 — Formulario de reservas integrado (P0)

Como docente, quiero reservar salas desde la interfaz para programar actividades sin utilizar directamente la API.

**Criterios de aceptación**

- Permite seleccionar sala, fecha, hora inicial, hora final y asistentes.
- Consulta disponibilidad antes de presentar la confirmación.
- Envía los datos a `POST /reservations`.
- Muestra el número o identificador de reserva confirmada.
- Presenta mensajes de aforo excedido, solapamiento o sala inhabilitada.
- Actualiza automáticamente el mapa tras confirmar.
- Impide envíos duplicados mientras se procesa la solicitud.

**Calidad:** validaciones visuales complementarias a las del backend, estados de carga y pruebas del recorrido completo.

### HU-23 — Gestión visual de equipos y préstamos (P0)

Como docente o administrador autorizado, quiero consultar equipos y registrar solicitudes de préstamo para administrar recursos tecnológicos.

**Criterios de aceptación**

- La vista lista recursos procedentes de la API.
- Permite consultar el estado de cada equipo.
- El formulario solicita fechas y horas correspondientes.
- Registra préstamos de recursos disponibles.
- Muestra errores por conflicto de disponibilidad.
- Permite registrar devoluciones a los usuarios autorizados.
- Actualiza el estado después de cada operación.

**Calidad:** tratamiento correcto de inventario vacío, interfaz sin datos ficticios ocultos y sincronización con el backend.

### HU-24 — Incidencias y flujo inteligente completo (P0)

Como docente, quiero reportar una incidencia desde la interfaz y consultar su análisis para iniciar su atención.

**Criterios de aceptación**

- Permite seleccionar sala o recurso y describir el problema.
- Envía el texto a `/incidents/analyze`.
- Presenta clasificación, prioridad y recomendación obtenidas.
- Permite revisar y registrar el incidente.
- Muestra si la clasificación fue por IA o por reglas locales.
- Presenta alternativas de reubicación cuando existan.
- Solo habilita la confirmación de reubicación para administradores.
- Actualiza incidencias, reservas y disponibilidad después de la operación.

**Calidad:** integración real extremo a extremo, estados intermedios, gestión de errores y comprobación de consistencia.

## Pruebas de aceptación para los jurados

| Prueba demostrable | Historia | Resultado obligatorio |
| --- | --- | --- |
| Reservar Cosmos para 20 personas | HU-03 | Reserva confirmada |
| Reservar Cosmos para 30 personas | HU-03 | Rechazo por aforo |
| Reservar Cosmos dos veces en horario coincidente | HU-03 | Rechazo por conflicto |
| Inhabilitar Cosmos y consultar alternativas | HU-05 | Alternativas válidas o ausencia justificada |
| Registrar una cuenta pública intentando enviar rol admin | HU-11 | Cuenta creada únicamente como docente o solicitud rechazada |
| Intentar reservar usando cuenta de soporte | HU-13 | Acceso denegado |
| Prestar un equipo no disponible | HU-08 | Préstamo rechazado |
| Reportar incidencia de una sala | HU-14 y HU-15 | Incidencia persistida y clasificación válida |
| Desconectar el proveedor IA | HU-16 | Clasificación por reglas, identificada como tal |
| Reiniciar Docker | HU-06 y HU-10 | Datos persistidos |

## Criterio de éxito final

El MVP estará listo para la evaluación cuando un usuario pueda:

Iniciar sesión → reservar una sala → solicitar un equipo → reportar una incidencia → obtener una clasificación con IA → recibir una alternativa válida → confirmar una solución autorizada.
