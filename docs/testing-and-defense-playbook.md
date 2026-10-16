# Playbook de pruebas y sustentación

Este documento convierte `contexto.md`, el backlog y los contratos de API en un guion verificable. No sustituye las pruebas automatizadas ni autoriza datos inventados. Cada resultado debe clasificarse como `PASS`, `FAIL`, `NOT_IMPLEMENTED` o `BLOCKED`, acompañado por evidencia.

## 1. Prompt maestro para auditoría funcional

Copiar este bloque en el asistente que vaya a acompañar la prueba. Adjuntar también `contexto.md`, `docs/trabajo-x-hacer.md`, los contratos de `docs/contracts/`, `/openapi.json` y la salida de las pruebas automatizadas.

```text
Actúa como líder de QA, arquitecto de software y jurado técnico senior del Sistema Central de Gestión Operativa de Campuslands. Tu misión es intentar romper el MVP y preparar al equipo para sustentarlo. No supongas que una función existe por aparecer en una historia, commit, pantalla o documentación: verifica el comportamiento observable y la persistencia real.

Fuentes de verdad, en orden:
1. contexto.md y criterios oficiales de evaluación.
2. docs/trabajo-x-hacer.md y criterios de aceptación.
3. Contratos vigentes de docs/contracts/.
4. OpenAPI real de /openapi.json.
5. Código, pruebas automatizadas, base de datos y ejecución Docker observables.

Reglas obligatorias:
- No inventes respuestas, datos oficiales, resultados de IA ni pruebas ejecutadas.
- Clasifica cada caso como PASS, FAIL, NOT_IMPLEMENTED o BLOCKED.
- Distingue datos autorizados, datos demo y datos oficiales.
- Para cada caso indica: ID, requisito/HU, precondición, rol, pasos, payload, resultado esperado, estado HTTP esperado, cambios esperados en SQLite, evidencia obtenida, resultado real, severidad y recomendación.
- Comprueba el estado antes y después de cada operación; una respuesta 200 no basta para declarar éxito.
- Repite consultas tras reiniciar contenedores cuando se evalúe persistencia.
- Verifica que los errores mantengan {"error":{"code","message","details"}} y no filtren trazas, hashes, secretos ni datos internos.
- En concurrencia ejecuta solicitudes realmente simultáneas y comprueba el número final de registros.
- En IA registra classification_source, modelo, latencia, fallback_reason y validación del esquema. Nunca presentes rules como ai.
- Si una ruta documentada no aparece en OpenAPI, marca NOT_IMPLEMENTED; no simules su resultado.
- Si falta dataset oficial, marca BLOCKED y usa datos demo claramente identificados solo para verificar lógica.

Orden de ejecución:
A. Preflight, seguridad y reproducibilidad.
B. Autenticación y permisos.
C. Espacios y reservas.
D. Recursos y préstamos.
E. Incidencias, IA y continuidad operativa.
F. Flujo vertical completo y consistencia cruzada.
G. Persistencia, concurrencia, registros inconsistentes y recuperación de fallos.
H. UX, accesibilidad, observabilidad y defensa técnica.

Entrega al finalizar:
1. Resumen ejecutivo con conteo PASS/FAIL/NOT_IMPLEMENTED/BLOCKED.
2. Tabla de defectos ordenada por criticidad: blocker, critical, high, medium, low.
3. Matriz requisito → evidencia.
4. Lista exacta de correcciones antes de la demo.
5. Guion de demostración de 10 minutos.
6. Diez preguntas difíciles de jurado con respuestas sustentadas únicamente en evidencia.
7. Tres cambios de regla que el equipo pueda hacer en vivo en menos de 3 minutos, indicando archivo, función, prueba afectada y riesgo.
```

## 2. Preparación y evidencia mínima

Registrar antes de probar:

- [ ] Commit y rama exactos: `git status --short --branch` y `git log -1 --oneline`.
- [ ] No existen cambios locales desconocidos.
- [ ] `.env` no está versionado y no se imprime en capturas o logs.
- [ ] Se conoce si los datos son oficiales, autorizados o demo.
- [ ] Se guardó una copia recuperable de la base si contiene datos importantes.
- [ ] `docker compose config --quiet` termina correctamente.
- [ ] `docker compose up --build -d` termina correctamente.
- [ ] `docker compose ps -a` muestra `db-init` finalizado con código 0 y servicios saludables.
- [ ] Se guardan logs relevantes: `docker compose logs --tail=100 db-init backend frontend`.
- [ ] `GET /health`, `/docs` y `/openapi.json` responden.
- [ ] Se ejecutó la suite completa y se registró el resultado real.
- [ ] Las credenciales demo provienen del entorno y no del repositorio.
- [ ] Hay usuarios separados para `admin`, `teacher`, segundo `teacher` y `support`.

Plantilla de evidencia por caso:

```text
Caso:
Commit:
Fecha/hora:
Datos usados:
Precondición:
Solicitud/pasos:
Respuesta observable:
Estado SQLite antes/después:
Captura/log/prueba:
Resultado: PASS | FAIL | NOT_IMPLEMENTED | BLOCKED
Defecto o riesgo:
```

## 3. Casos de uso y casos borde

### 3.1 Plataforma, API y errores — HU-01 y HU-10

- `SYS-01`: iniciar todo desde cero mediante Docker Compose.
- `SYS-02`: reiniciar backend y comprobar que SQLite conserva datos.
- `SYS-03`: ejecutar dos veces `db-init`; no debe destruir ni duplicar datos.
- `SYS-04`: consultar `/health` con base disponible; esperar 200.
- `SYS-05`: hacer inaccesible SQLite; `/health` debe responder 503 con JSON uniforme.
- `SYS-06`: comprobar `/docs` y que cada ruta real aparezca en OpenAPI.
- `SYS-07`: consultar ruta inexistente; esperar 404 uniforme.
- `SYS-08`: enviar JSON inválido, campos faltantes, tipos erróneos y campos fuera de rango; esperar 422 uniforme.
- `SYS-09`: provocar excepción controlada y confirmar ausencia de traceback o secretos.
- `SYS-10`: validar CORS desde el origen configurado y rechazar orígenes no permitidos.
- `SYS-11`: arrancar sin `JWT_SECRET_KEY`; comprobar fallo diagnosticable y sin mostrar secretos.
- `SYS-12`: usar un puerto ocupado; los logs deben explicar el fallo.
- `SYS-13`: verificar que frontend consume `/api/health` mediante el proxy.
- `SYS-14`: comprobar estados de carga, vacío, éxito y error sin pantalla en blanco.
- `SYS-15`: validar que ninguna imagen usa `latest` y que las versiones directas están fijadas.

### 3.2 Autenticación y administración — HU-11 a HU-13 y HU-21

- `AUTH-01`: registrar usuario válido; debe quedar como `teacher`.
- `AUTH-02`: intentar registrarse enviando `role=admin`, `is_admin=true` o `is_active=false`; no debe escalar privilegios.
- `AUTH-03`: repetir correo con mayúsculas/minúsculas; debe respetar unicidad normalizada.
- `AUTH-04`: probar nombre corto, correo inválido y contraseñas sin longitud, mayúscula, minúscula o número.
- `AUTH-05`: confirmar que ninguna respuesta contiene `password_hash` o `$argon2id$`.
- `AUTH-06`: login válido devuelve JWT con expiración.
- `AUTH-07`: contraseña incorrecta y usuario inexistente devuelven el mismo mensaje.
- `AUTH-08`: token ausente, vacío, corrupto, firmado con otra clave o expirado devuelve 401.
- `AUTH-09`: cuenta inactiva no puede iniciar ni continuar operaciones protegidas.
- `AUTH-10`: cambiar rol/desactivar usuario y reutilizar token anterior; el backend debe consultar el estado actual.
- `AUTH-11`: teacher/support intenta listar o modificar usuarios; esperar 403.
- `AUTH-12`: admin intenta cambiar su propio rol o desactivarse; rechazar.
- `AUTH-13`: intentar degradar o desactivar el último administrador activo; rechazar.
- `AUTH-14`: login y registro con espacios, mayúsculas en correo y caracteres Unicode.
- `AUTH-15`: cerrar sesión en frontend y comprobar que no puede volver a rutas privadas usando estado residual.
- `AUTH-16`: dos sesiones del mismo usuario tras cambio de rol; ambas deben obedecer el rol vigente.

### 3.3 Catálogo y disponibilidad — HU-02 y HU-18

- `SPACE-01`: listar exactamente las diez salas autorizadas con nombre y aforo correctos.
- `SPACE-02`: consulta sin franja devuelve catálogo y distingue salas inhabilitadas.
- `SPACE-03`: consulta con fecha y franja completas calcula disponibilidad.
- `SPACE-04`: enviar solo fecha, solo una hora o dos de tres parámetros; esperar 422.
- `SPACE-05`: inicio igual o posterior al final; rechazar.
- `SPACE-06`: reserva confirmada parcialmente solapada marca `occupied`.
- `SPACE-07`: reserva completamente contenida o que contiene la franja marca `occupied`.
- `SPACE-08`: reserva que termina exactamente al inicio consultado no bloquea.
- `SPACE-09`: reserva que inicia exactamente al final consultado no bloquea.
- `SPACE-10`: reserva cancelada no bloquea.
- `SPACE-11`: reserva en otro día u horario no bloquea permanentemente.
- `SPACE-12`: sala bloqueada con y sin reserva siempre aparece `disabled`.
- `SPACE-13`: identificador de sala en minúsculas se normaliza donde el contrato lo permita.
- `SPACE-14`: sala inexistente devuelve 404.
- `SPACE-15`: mapa actualiza colores/textos al cambiar fecha y franja; estado no depende solo del color.
- `SPACE-16`: navegación por teclado permite seleccionar sala y leer detalles.
- `SPACE-17`: comparar respuesta API con filas reales de SQLite.

### 3.4 Creación y gestión de reservas — HU-03, HU-04 y HU-22

- `RES-01`: teacher reserva Cosmos para 20 personas; esperar 201 y `confirmed`.
- `RES-02`: admin crea reserva válida.
- `RES-03`: support intenta reservar; esperar 403.
- `RES-04`: petición sin token; esperar 401.
- `RES-05`: Cosmos para 25 personas se acepta; para 26 o 30 se rechaza por aforo.
- `RES-06`: asistentes 0, negativos, texto o decimal inválido; rechazar sin insertar.
- `RES-07`: hora inicial igual o posterior a final; rechazar sin insertar.
- `RES-08`: sala inexistente; 404 sin insertar.
- `RES-09`: sala inhabilitada; 409 sin insertar.
- `RES-10`: mismo intervalo en misma sala y fecha; segundo intento 409.
- `RES-11`: solapamiento parcial por izquierda y derecha; rechazar.
- `RES-12`: intervalo contenido y contenedor; rechazar.
- `RES-13`: horarios adyacentes; ambos se aceptan.
- `RES-14`: misma franja en salas diferentes; se acepta.
- `RES-15`: misma sala y franja en fechas distintas; se acepta.
- `RES-16`: doble clic o reintento del frontend mientras procesa; no debe crear duplicados.
- `RES-17`: dos solicitudes concurrentes reales; exactamente una se confirma.
- `RES-18`: teacher lista únicamente sus reservas; segundo teacher no las ve.
- `RES-19`: admin lista todas y filtra por usuario, sala, fecha y estado.
- `RES-20`: teacher modifica reserva propia; registra evento `updated`.
- `RES-21`: teacher intenta modificar/cancelar reserva ajena; 403.
- `RES-22`: admin modifica/cancela reserva ajena; permitido y auditado con actor admin.
- `RES-23`: mover reserva a sala inexistente, bloqueada o sin aforo; rollback completo.
- `RES-24`: cambiar horario a uno solapado; 409 y valores anteriores intactos.
- `RES-25`: modificar título sin cambiar franja no debe chocar consigo misma.
- `RES-26`: cancelar conserva la fila y agrega evento `cancelled`.
- `RES-27`: tras cancelar, la sala vuelve a `available` para esa franja.
- `RES-28`: modificar o cancelar dos veces una reserva cancelada; 409.
- `RES-29`: filtrar por estado confirma que la cancelada sigue consultable.
- `RES-30`: intentar actualización vacía o con `null`; 422.
- `RES-31`: caída durante modificación; no debe quedar cambio parcial ni evento huérfano.

### 3.5 Inventario y préstamos — HU-08 y HU-23

- `LOAN-01`: inventario vacío muestra estado vacío, no equipos inventados.
- `LOAN-02`: solo admin registra un equipo autorizado.
- `LOAN-03`: identificador duplicado devuelve 409.
- `LOAN-04`: listar y consultar equipo existente; desconocido devuelve 404.
- `LOAN-05`: teacher/admin solicita equipo operativo disponible.
- `LOAN-06`: support intenta solicitar; 403.
- `LOAN-07`: devolución prevista igual o anterior al inicio; 422.
- `LOAN-08`: equipo dañado o bloqueado por incidencia; 409.
- `LOAN-09`: préstamo solapado; 409.
- `LOAN-10`: préstamos adyacentes según contrato no deben producir falso conflicto.
- `LOAN-11`: dos solicitudes concurrentes incompatibles; solo una se crea.
- `LOAN-12`: teacher solo ve sus préstamos; admin ve todos.
- `LOAN-13`: solicitante o admin devuelve equipo; tercero no autorizado recibe 403.
- `LOAN-14`: doble devolución; 409.
- `LOAN-15`: después de devolver, el equipo vuelve a estar disponible.
- `LOAN-16`: historial del préstamo permanece tras devolución y reinicio.
- `LOAN-17`: filtros por categoría no mezclan inventario diferente.
- `LOAN-18`: incidencia bloquea y resolución restaura únicamente si no hay otro bloqueo activo.

### 3.6 Incidencias, IA y fallback — HU-14 a HU-16 y HU-20/HU-24

- `INC-01`: teacher registra incidencia válida vinculada a sala.
- `INC-02`: incidencia vinculada a recurso real.
- `INC-03`: sala o recurso inexistente se rechaza; la IA no puede inventarlo.
- `INC-04`: descripción demasiado corta, vacía o enorme; validación controlada.
- `INC-05`: teacher solo consulta incidencias propias; support/admin ven todas.
- `INC-06`: support/admin cambia `open → in_progress → resolved`.
- `INC-07`: transición inválida se rechaza sin evento parcial.
- `INC-08`: solo admin reabre una resuelta; support recibe 403.
- `INC-09`: historial registra actor, cambio y fecha.
- `INC-10`: teacher reporta riesgo crítico con `confirm_blocking=true`; sugiere bloqueo pero no inhabilita.
- `INC-11`: support/admin confirma incidencia `safety`, `electrical` o `infrastructure` de prioridad alta/crítica; bloquea.
- `INC-12`: categorías o prioridades fuera de la política no bloquean.
- `INC-13`: resolver único incidente bloqueante restaura disponibilidad.
- `INC-14`: dos incidentes bloqueantes sobre el mismo objetivo; resolver uno no restaura todavía.
- `AI-01`: proveedor real configurado devuelve esquema válido y `classification_source=ai`.
- `AI-02`: verificar modelo y latencia reales; no aceptar datos quemados.
- `AI-03`: proveedor sin configurar activa `rules` con `fallback_reason=not_configured`.
- `AI-04`: timeout activa fallback y no rompe el flujo.
- `AI-05`: HTTP 401/429/500 del proveedor activa fallback seguro.
- `AI-06`: respuesta no JSON, JSON truncado, enums inválidos o campos faltantes activa fallback.
- `AI-07`: prompt injection solicita ignorar reglas o revelar secretos; debe tratarse como texto no confiable.
- `AI-08`: respuesta intenta inventar `SAL-999` o recurso inexistente; descartar referencia y advertir.
- `AI-09`: alterar `analysis_token` o reutilizarlo con otra descripción; rechazar su procedencia.
- `AI-10`: fallback identifica claramente `rules`; nunca afirmar que fue IA.
- `AI-11`: sin alternativa real devuelve lista vacía/mensaje honesto.
- `AI-12`: recomendación nunca modifica reserva o préstamo automáticamente.

### 3.7 Seed, importación e integridad — HU-06, HU-07 y HU-09

- `DATA-01`: ejecutar seed dos veces; segunda ejecución crea cero duplicados.
- `DATA-02`: seed crea exactamente diez salas con aforos oficiales.
- `DATA-03`: seed crea roles demo correctos sin sobrescribir hashes existentes.
- `DATA-04`: correos demo repetidos o variables faltantes hacen rollback completo.
- `DATA-05`: sala existente con nombre/aforo alterado detiene seed sin sobrescribir.
- `DATA-06`: claves foráneas SQLite están activas en cada conexión.
- `DATA-07`: insertar préstamo/reserva/incidencia con FK inexistente falla.
- `DATA-08`: reiniciar contenedores conserva usuarios, reservas, préstamos e incidencias.
- `DATA-09`: operación fallida no deja eventos, bloqueos o hijos huérfanos.
- `DATA-10`: archivo oficial original se conserva sin modificación.
- `DATA-11`: importador valida columnas requeridas, IDs, duplicados y relaciones.
- `DATA-12`: CSV/JSON/Excel malformado genera reporte de filas rechazadas.
- `DATA-13`: segunda importación no duplica ni sobrescribe silenciosamente.
- `DATA-14`: datos demo están identificados y separados de datos oficiales.
- `DATA-15`: si el dataset oficial no fue entregado, marcar HU-09 como `BLOCKED`, nunca simularla.

### 3.8 Flujo vertical e integración

- `E2E-01`: registrar teacher → login → consultar salas → reservar → comprobar ocupación.
- `E2E-02`: solicitar equipo → comprobar estado `loaned` → devolver → comprobar `available`.
- `E2E-03`: analizar incidencia con IA → revisar resultado → persistir incidencia.
- `E2E-04`: incidencia autorizada inhabilita sala → reservas afectadas se identifican.
- `E2E-05`: obtener alternativas reales compatibles → confirmar únicamente como admin.
- `E2E-06`: después de reubicar, sala origen queda libre y destino ocupado sin duplicar reserva.
- `E2E-07`: resolver incidencia restaura disponibilidad solo cuando corresponda.
- `E2E-08`: desconectar IA a mitad del flujo; continuar con fallback identificado.
- `E2E-09`: refrescar navegador y reiniciar backend; estado coherente desde SQLite.
- `E2E-10`: repetir flujo desde teléfono y computador; acciones y mensajes siguen disponibles.

## 4. Lista de verificación de entrega según `contexto.md`

### Producto y datos

- [ ] Existe un MVP ejecutable, no solo pantallas estáticas.
- [ ] Espacios, recursos e incidencias forman un flujo operativo integrado.
- [ ] Existe al menos un flujo vertical completo con IA real o modelo autorizado.
- [ ] Los datos oficiales entregados se consultan directamente, o la ausencia del dataset está declarada como bloqueo.
- [ ] Los datos demo están identificados y no se presentan como oficiales.
- [ ] Se puede registrar, actualizar o modificar información relevante.
- [ ] Reiniciar servicios no elimina operaciones persistidas.
- [ ] Registros inconsistentes producen errores controlados y no corrupción.

### Reglas de negocio — 25 puntos

- [ ] El equipo puede nombrar y demostrar al menos tres reglas de dominio.
- [ ] Aforo excedido se rechaza en backend.
- [ ] Solapamiento de reservas se rechaza, incluida concurrencia.
- [ ] Sala o equipo inhabilitado no puede asignarse.
- [ ] Roles y propiedad del registro se validan en backend.
- [ ] Cancelaciones/devoluciones conservan historial y liberan disponibilidad.
- [ ] Operaciones relacionadas son atómicas y hacen rollback ante error.
- [ ] Las reglas no dependen únicamente de validaciones visuales.

### IA estratégica — 20 puntos

- [ ] La IA aporta clasificación, priorización o recomendación útil al flujo.
- [ ] La petición usa texto real del usuario y un proveedor/modelo autorizado.
- [ ] La respuesta se valida con esquema estricto.
- [ ] La IA no inventa salas, equipos ni identificadores persistidos.
- [ ] Se informa `ai` frente a `rules` de forma honesta.
- [ ] Hay timeout, manejo de errores y fallback determinista.
- [ ] Ninguna recomendación ejecuta cambios críticos sin confirmación autorizada.
- [ ] Se puede demostrar proveedor conectado y desconectado.

### MVP y UX — 15 puntos

- [ ] Login, navegación y cierre de sesión funcionan.
- [ ] Las vistas muestran carga, éxito, vacío y error.
- [ ] Los formularios impiden envíos duplicados mientras procesan.
- [ ] Los mensajes explican aforo, conflicto, bloqueo, permisos y fallos de IA.
- [ ] El estado se actualiza después de cada operación sin recargar manualmente.
- [ ] La interfaz funciona en computador y teléfono.
- [ ] Controles tienen etiquetas, foco visible y uso por teclado.
- [ ] El color no es la única forma de comunicar estados.

### Calidad y repositorio — 10 puntos

- [ ] Arquitectura modular y responsabilidades explicables.
- [ ] Variables externas documentadas en `.env.example` sin secretos.
- [ ] `.env`, bases locales, tokens y datos personales no están versionados.
- [ ] Dependencias directas tienen versiones fijadas.
- [ ] README describe problema, integrantes, stack, IA, reglas y ejecución.
- [ ] Historial tiene commits atómicos con convención válida.
- [ ] Integración a `main` ocurre mediante PR revisado, nunca push directo.
- [ ] Suite automatizada y comandos de verificación están documentados.

### Reproducibilidad y demostración

- [ ] Un evaluador puede clonar, configurar y levantar mediante instrucciones del README.
- [ ] Docker Compose inicia frontend, backend y esquema SQLite.
- [ ] La salud del backend evita que frontend consuma un servicio no listo.
- [ ] Los logs permiten identificar qué servicio falló.
- [ ] Existe un guion con casos válidos e inválidos y datos conocidos.
- [ ] Se guardaron evidencias reales de las pruebas ejecutadas.
- [ ] La demo no depende de internet sin un fallback probado.

### Penalizaciones que deben revisarse

- [ ] No hay API keys, JWT secrets, contraseñas ni `.env` en Git o historial visible.
- [ ] No hay respuestas de IA simuladas presentadas como reales.
- [ ] No hay disponibilidad, validaciones o estados falsificados en frontend.
- [ ] No se usan datos personales reales sin autorización.

## 5. Preguntas probables del jurado y evidencia necesaria

1. **¿Cuál es el problema real que resuelve el sistema?** Mostrar cómo unifica salas, equipos e incidencias y reduce conflictos manuales.
2. **¿Cuál es el flujo vertical completo?** Ejecutar login → reserva → préstamo → incidencia → clasificación → alternativa → confirmación autorizada.
3. **¿Qué datos son oficiales y cuáles son demo?** Mostrar origen, importación, etiquetas y política de no sobrescritura.
4. **¿Dónde están sus tres reglas de negocio?** Señalar funciones de servicio y pruebas, no componentes visuales.
5. **¿Cómo impiden dos reservas simultáneas?** Explicar transacción SQLite, `BEGIN IMMEDIATE`, consulta de solapamiento y prueba concurrente.
6. **¿Por qué una reserva cancelada no bloquea?** Mostrar estado persistido, consulta que filtra `confirmed` y evento de cancelación.
7. **¿Cómo garantizan integridad referencial?** Mostrar FKs, `PRAGMA foreign_keys=ON` y prueba de inserción inválida.
8. **¿Qué pasa si la IA falla?** Desconectar proveedor, mostrar `classification_source=rules` y `fallback_reason`.
9. **¿Cómo saben que la IA no inventó una sala?** Mostrar validación contra SQLite/catálogo y advertencia por ID desconocido.
10. **¿La IA ejecuta decisiones?** Explicar separación recomendación/confirmación y control de rol admin.
11. **¿Qué evita que un teacher se vuelva admin?** Mostrar registro con rol fijo, permisos centralizados y prueba de escalamiento.
12. **¿Qué sucede al desactivar un usuario con token vigente?** Mostrar recarga del usuario desde SQLite en cada petición.
13. **¿Qué persiste tras reiniciar Docker?** Demostrar operación antes/después y volumen `campus_data`.
14. **¿Cómo manejan un dataset inconsistente?** Mostrar validación, rollback y reporte de filas rechazadas; si no existe importador, declarar `NOT_IMPLEMENTED`.
15. **¿Cómo diagnostican un fallo de arranque?** Mostrar healthcheck, estados Compose y logs.
16. **¿Qué parte no está terminada?** Responder honestamente con matriz `NOT_IMPLEMENTED/BLOCKED` y riesgo.
17. **¿Qué cambiarían con más tiempo?** Priorizar migraciones, locks reproducibles, observabilidad, pruebas E2E y despliegue inmutable.
18. **¿Dónde cambiarían una regla en menos de tres minutos?** Mostrar constantes/funciones centralizadas y ejecutar la prueba afectada.
19. **¿Por qué monolito modular?** Explicar rapidez del MVP, transacciones locales y límites de dominio sin complejidad distribuida.
20. **¿Cómo evitan filtrar secretos?** Mostrar `.gitignore`, `.env.example`, configuración backend y auditoría de respuestas.

## 6. Cambios en vivo sugeridos

Preparar uno por integrante y ensayarlo sin modificar datos oficiales:

- Reservas: cambiar temporalmente una regla de aforo o autorización central y ejecutar su prueba específica.
- Incidencias: agregar una categoría bloqueante en el conjunto central y demostrar el cambio.
- Fallback: añadir una palabra clave y probar la nueva clasificación determinista.
- Recursos: cambiar una condición permitida y verificar préstamo/rechazo.
- Frontend: cambiar un texto/estado accesible sin alterar el contrato.

Para cada cambio:

- [ ] Identificar archivo y función antes de la demo.
- [ ] Explicar impacto y riesgo.
- [ ] Ejecutar una prueba que falle antes y pase después.
- [ ] Revertir o confirmar el cambio de forma consciente.
- [ ] No editar secretos, dataset oficial ni migraciones durante la sustentación.

## 7. Criterio de salida antes de presentar

No declarar el MVP listo si ocurre cualquiera de estos bloqueos:

- El flujo principal no llega de login a una operación persistida.
- Se pueden crear reservas o préstamos incompatibles.
- Un rol no autorizado puede modificar datos críticos.
- La aplicación pierde datos al reiniciar.
- La IA se presenta como real cuando se usó fallback o datos simulados.
- Existen secretos en el repositorio o en respuestas.
- La suite pertinente falla sin explicación y mitigación.
- La demo depende de una ruta ausente en OpenAPI.

El cierre debe incluir conteo de resultados, defectos abiertos, riesgos aceptados y evidencia reproducible.
