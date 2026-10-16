# Instrucciones para agentes

Estas reglas aplican a todo el repositorio. Antes de implementar, descubre los documentos disponibles (`rg --files --hidden -g '!.git/**'`) y lee el contexto, las especificaciones, los contratos y las instrucciones pertinentes, incluidos los archivos que se agreguen después. Si hay documentos PDF, Word u otros formatos, consúltalos con la herramienta adecuada. Repite la revisión de contexto tras recibir cambios nuevos. El reto dura cinco horas: implementa funcionalidades respaldadas por el contexto y que el equipo pueda explicar en vivo.

## Al comenzar una tarea

1. Ejecuta `git status --short --branch`, identifica la rama y revisa los cambios existentes. No modifiques ni incluyas en tus commits trabajo ajeno.
2. Construye el contexto con la documentación vigente antes de decidir cómo implementar una funcionalidad. Si hay archivos compartidos o una interfaz entre módulos, acuerda el contrato con los otros integrantes antes de editar.
3. Trabaja en la rama persistente de tu integrante: `developer/NombreDelDeveloper`. Conserva exactamente el nombre acordado por el equipo y reutiliza esa misma rama para sus cambios; no crees una rama por funcionalidad.
4. Consulta las instrucciones locales del área que edites, si aparecen en el futuro. No supongas un stack o una arquitectura antes de verlos en el repositorio.

## Cada vez que se haga un pull

1. Revisa `git status --short --branch`; conserva cualquier cambio local sin confirmarlo de forma accidental.
2. Ejecuta `git fetch origin` y consulta `main`, las ramas `origin/developer/*` y los PR disponibles. Para cada rama, identifica los commits y archivos cambiados respecto a `origin/main`; señala también lo nuevo desde la revisión anterior si se conoce ese punto de partida.
3. Actualiza tu rama con `git pull --ff-only`. Si hay divergencia o conflictos, detente y explica la situación antes de resolverla.
4. Entrega al integrante un reporte por cada rama: responsable, funcionalidades implementadas con evidencia de commits/archivos/PR, estado frente a `main`, cambios recién recibidos y posibles conflictos o dependencias. Distingue lo verificado de lo inferido; no describas una funcionalidad como terminada solo por el nombre de un commit.
5. Relee los documentos nuevos o modificados y ajusta el plan de implementación a ese contexto.

## Mientras implementas

- Mantén cada cambio dentro de la tarea asignada. No reformatees archivos ajenos ni hagas refactorizaciones amplias durante una integración.
- Conserva la integridad de los datos oficiales del reto. Separa datos de muestra de datos oficiales, valida registros inconsistentes y evita respuestas de IA o reglas de negocio simuladas para la demostración.
- Nunca guardes credenciales, `.env`, datos personales reales, tokens o claves en Git. Usa `.env.example` sin valores secretos si la aplicación necesita configuración.
- Implementa y prueba las reglas de negocio en el código, no solo en la interfaz. Deja instrucciones de ejecución reproducibles cuando agregues una dependencia o un servicio.
- Antes de editar o resolver conflictos, revisa el diff. No uses `git reset --hard`, `git push --force`, ni sobrescribas cambios de otro integrante. Si un conflicto afecta el contrato entre módulos, coordina la resolución.

## Entrega de la tarea

1. Ejecuta las verificaciones pertinentes y comunica qué se probó y qué quedó pendiente. Nunca afirmes que una prueba pasó si no se ejecutó.
2. Revisa `git diff --check` y `git diff`; prepara solo los archivos de tu tarea con `git add <rutas>`.
3. Escribe commits atómicos con el formato de `CONTRIBUTING.md`: `tipo: :gitmoji: AccionEnIngles`.
4. Publica `developer/NombreDelDeveloper` y abre un PR con `gh pr create`. Incluye alcance, validación, riesgos y la relación con los requisitos del reto. Solicita revisión de otro integrante.
5. Corrige observaciones en la misma rama. Integra a `main` mediante PR cuando la revisión y las comprobaciones estén listas. Después sincroniza esa misma rama con `main` antes del siguiente PR, según `CONTRIBUTING.md`. No hagas push directo a `main`.

Al terminar, informa al integrante responsable el resultado, el enlace del PR si existe, las pruebas ejecutadas y cualquier bloqueo. Un agente no debe crear commits, PR ni merges de trabajo ajeno sin que esa tarea le haya sido asignada.
