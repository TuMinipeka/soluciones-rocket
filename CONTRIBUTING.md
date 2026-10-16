# Guía de contribución

Este repositorio corresponde al hackatón descrito en [contexto.md](contexto.md). Somos cinco integrantes y usamos agentes para desarrollar; cada integrante sigue siendo responsable de revisar y poder explicar el código que entrega.

## Flujo de trabajo

1. Lee la documentación disponible antes de implementar y vuelve a revisarla cuando lleguen documentos nuevos. El contexto del repositorio guía las funcionalidades; no se divide el MVP por anticipado en esta guía. Antes de modificar un archivo compartido, avisa al resto del equipo.
2. Cada integrante usa una sola rama persistente `developer/NombreDelDeveloper`, creada desde `main` con `git fetch origin` y `git switch --no-track -c developer/NombreDelDeveloper origin/main`. Publícala una vez con `git push -u origin developer/NombreDelDeveloper` para que los siguientes `git pull --ff-only` sigan esa rama personal. No crees ramas `feat/`, `fix/` o `docs/` por tarea.
3. Integra cambios comprensibles mediante PR desde esa misma rama. Mantén un PR activo por integrante para que la próxima integración no arrastre cambios anteriores.
4. Verifica el cambio localmente. Incluye en el PR los comandos ejecutados y su resultado. Si todavía no hay suite de pruebas, describe la prueba manual del flujo afectado.
5. Crea el PR con `gh pr create --base main --head <rama> --title "<titulo>" --body "<resumen>"`. Pide revisión de al menos otro integrante. Quien revisa confirma que entiende el cambio, que las reglas de negocio siguen funcionando y que no hay secretos ni datos indebidos.
6. Integra únicamente después de resolver observaciones y de que pasen las comprobaciones disponibles. Para conservar limpia la historia de una rama persistente, usa el método de **merge commit** del PR. Tras integrarlo, estando en `developer/NombreDelDeveloper`, ejecuta `git fetch origin`, `git merge --ff-only origin/main` y `git push`; luego empieza el siguiente cambio. Si el avance rápido falla porque ya hay cambios nuevos en la rama, revisa el grafo y coordina la integración antes de continuar.
7. Se recomienda activar en GitHub la protección de `main`: PR obligatorio, una aprobación, comprobaciones obligatorias y bloqueo de pushes directos. Esa configuración se hace en GitHub; este archivo por sí solo no la activa.

Si el repositorio remoto está vacío, publica primero el commit inicial en `main`. A partir de ese punto, aplica el flujo de ramas personales y PR descrito arriba.

## Reporte obligatorio después de cada pull

El agente hace `git fetch origin` antes de actualizar su rama, revisa `git branch -r --list 'origin/developer/*'` y consulta commits y archivos de cada rama con `git log --oneline origin/main..origin/developer/NombreDelDeveloper` y `git diff --stat origin/main...origin/developer/NombreDelDeveloper`. Puede complementar el contexto con `gh pr list --state all` y `gh pr view <numero>`. Luego ejecuta `git pull --ff-only` en su rama. Si Git rechaza el avance rápido, informa la divergencia y coordina cómo resolverla.

El reporte enumera **todas las ramas `developer/*` visibles**, incluso las que no cambiaron: integrante, implementaciones verificadas, commits o PR que las respaldan, archivos relevantes, estado de integración en `main` y novedades desde el pull anterior cuando se pueda comparar. Si no hay commits nuevos o no existe una rama, dilo explícitamente. El reporte se entrega después de cada pull, antes de continuar desarrollando. Los nombres de commits y archivos son pistas; revisa el diff o el PR antes de afirmar que una funcionalidad funciona.

Formato sugerido para cada rama: `developer/Nombre | implementado | evidencia (commit/PR/archivos) | integrado o pendiente | novedades de este pull | bloqueos`. Incluye después un resumen breve de documentos nuevos o modificados que afecten el trabajo.

Tras la actualización, el agente descubre de nuevo los documentos (`rg --files --hidden -g '!.git/**'`) y lee los nuevos o modificados, además de sus referencias pertinentes.

## Commits y títulos de PR

Usa exactamente esta forma en la primera línea, sin scope, punto final ni sufijos:

```text
tipo: :gitmoji: AccionEnIngles
```

`tipo` es uno de `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `build`, `perf` o `style`. La descripción es una acción breve en inglés en **UpperCamelCase** (la variante con inicial mayúscula del estilo camel case mostrado en el ejemplo). El shortcode de Gitmoji se escribe literalmente entre dos puntos. Relación recomendada:

| Tipo | Gitmoji | Ejemplo |
| --- | --- | --- |
| `feat` | `:sparkles:` | `feat: :sparkles: AddSpaceBooking` |
| `fix` | `:bug:` | `fix: :bug: PreventOverlappingBookings` |
| `docs` | `:memo:` | `docs: :memo: ExplainLocalSetup` |
| `refactor` | `:recycle:` | `refactor: :recycle: ExtractAvailabilityRule` |
| `test` | `:white_check_mark:` | `test: :white_check_mark: CoverBrokenEquipment` |
| `chore` | `:wrench:` | `chore: :wrench: ConfigureGitHooks` |
| `ci` | `:green_heart:` | `ci: :green_heart: ValidateCommitTitles` |
| `build` | `:package:` | `build: :package: AddRuntimeDependency` |
| `perf` | `:zap:` | `perf: :zap: CacheSpaceLookup` |
| `style` | `:art:` | `style: :art: FormatIncidentView` |

El tipo explica la naturaleza del cambio; el Gitmoji no la reemplaza. Usa un commit por cambio lógico. Si hace falta contexto adicional o indicar un cambio incompatible, utiliza el cuerpo y el pie del commit, incluido `BREAKING CHANGE:` cuando corresponda. El título del PR sigue la misma forma porque puede convertirse en el mensaje del commit de integración.

La comprobación automática valida la estructura, los tipos y la pareja tipo/Gitmoji; no puede determinar si la descripción en inglés representa bien el cambio. El autor y el revisor deben comprobarlo.

Puedes revisar un título antes de publicarlo con `py scripts/validate_commit_messages.py --title "feat: :sparkles: AddSpaceBooking"` en Windows, o con `python3` en otros sistemas. La CI ejecuta la misma comprobación sobre el título del PR y los commits de su rama.

## Higiene de Git y GitHub CLI

Antes de publicar: `git status --short`, `git diff --check` y revisión del diff preparado con `git diff --cached`. Agrega rutas explícitas para no capturar archivos de otro integrante. Usa `gh pr view` y `gh pr checks` para consultar revisión y CI. No fuerces pushes ni reescribas commits publicados que otro integrante esté usando; coordina si resulta indispensable.

Si detectas una credencial ya confirmada en Git, informa inmediatamente al equipo y rota la credencial. Borrar el archivo en un commit nuevo no elimina el secreto del historial.
