# Versiones y reproducibilidad

Esta es la **línea base acordada en el repositorio**, no una afirmación de que la aplicación ya pasó pruebas de producción. El proyecto se ejecuta con Docker Compose; las versiones instaladas en el anfitrión no determinan las versiones de Python y Node de los contenedores.

| Componente | Versión fijada | Fuente de verdad |
| --- | --- | --- |
| Python + Debian Bookworm slim | `3.11.16-slim-bookworm` | `backend/Dockerfile` |
| FastAPI | `0.143.2` | `backend/requirements.txt` |
| Uvicorn | `0.53.0` | `backend/requirements.txt` |
| SQLAlchemy | `2.1.3` | `backend/requirements.txt` |
| argon2-cffi | `25.1.0` | `backend/requirements.txt` |
| PyJWT | `2.15.1` | `backend/requirements.txt` |
| httpx | `0.28.1` | `backend/requirements.txt` |
| email-validator | `2.3.0` | `backend/requirements.txt` |
| pydantic-settings | `2.15.0` | `backend/requirements.txt` |
| pytest | `9.1.1` | `backend/requirements.txt` |
| Node.js + Alpine | `22.23.2-alpine3.24` | `frontend/Dockerfile` |
| React y React DOM | `19.3.0` | `frontend/package.json` |
| Vite | `8.3.4` | `frontend/package.json` |
| Plugin React de Vite | `6.1.2` | `frontend/package.json` |
| Tailwind CSS y plugin de Vite | `4.3.3` | `frontend/package.json` |
| SQLite | Versión incluida en la imagen de Python; verificar en el contenedor | `python -c "import sqlite3; print(sqlite3.sqlite_version)"` |
| npm y pip | Versiones incluidas en las imágenes; verificar dentro de los contenedores | `npm --version`; `python -m pip --version` |
| Docker Engine / Compose | No van dentro del repositorio; cada equipo necesita una versión que interprete `compose.yaml` | `docker --version`; `docker compose version`; `docker compose config --quiet` |

No agregar un campo `version:` a `compose.yaml`: la especificación actual de Compose lo considera obsoleto. La instalación observada en el equipo donde se preparó esta base fue Docker CLI `29.8.0` y Compose `v5.5.1`; **no se verificó el Engine**, porque el daemon no estaba iniciado. Git `2.55.0.windows.5` y GitHub CLI `2.98.0` se observaron localmente para el flujo de colaboración; no son dependencias de ejecución. Las versiones locales de Node `24.20.0`, npm `11.19.0` y Python `3.11.9` no sustituyen las de los contenedores.

El proveedor/modelo de IA y las librerías concretas de JWT y Argon2 **no están seleccionados ni implementados**. Sus versiones se añadirán cuando el equipo cierre esos contratos; no deben inferirse de las variables de `.env.example`.

## Comprobación en cada equipo

```powershell
docker --version
docker compose version
docker compose config --quiet
docker compose build
docker compose run --rm --no-deps backend python --version
docker compose run --rm --no-deps backend python -c "import fastapi, sqlalchemy, sqlite3, uvicorn; print(fastapi.__version__, sqlalchemy.__version__, sqlite3.sqlite_version, uvicorn.__version__)"
docker compose run --rm --no-deps frontend node --version
docker compose run --rm --no-deps frontend npm --version
```

Si `docker compose config --quiet` falla, revisar primero el archivo y la versión instalada de Compose. Si el daemon no responde, iniciar Docker antes de construir. Registrar en el PR el resultado de los comandos realmente ejecutados.

## Regla para cambios y producción

1. Cambiar una versión en el manifiesto correspondiente y en esta tabla, en el mismo PR. No usar `latest`, `^`, `~` ni rangos para dependencias directas nuevas.
2. La fijación de versiones directas **no congela las dependencias transitivas**. Antes de un despliegue reproducible, generar `frontend/package-lock.json` con acceso al registro npm, revisarlo y confirmarlo en Git; después cambiar `frontend/Dockerfile` de `npm install` a `npm ci` y validar `npm run build`. No crear un lockfile manual o incompleto.
3. Para Python, `requirements.txt` fija las dependencias directas, pero no las transitivas. Antes de producción, generar y revisar un lock completo con hashes a partir de estas versiones y hacer que el Dockerfile lo instale; probar el build resultante. No confundir esta base con ese lock.
4. Una etiqueta de imagen con versión de parche puede volver a publicarse. Para un despliegue inmutable, fijar el digest `sha256` de cada imagen base después de verificar su arquitectura, y registrar el digest en el PR de despliegue.
5. Ejecutar `docker compose build`, la suite de pruebas pertinente y `docker compose up` antes de promover una actualización. No actualizar versiones en una rama distinta de la rama persistente del integrante responsable ni mezclar la actualización con cambios funcionales ajenos.

Fuentes de referencia: [imágenes oficiales de Python](https://hub.docker.com/_/python), [imágenes oficiales de Node](https://hub.docker.com/_/node), [npm lockfile](https://docs.npmjs.com/cli/configuring-npm/package-lock-json/) y [`npm ci`](https://docs.npmjs.com/cli/commands/npm-ci/).
