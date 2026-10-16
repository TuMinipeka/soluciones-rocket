# Pruebas del backend

Suite de pruebas automatizadas con Pytest y base de datos SQLite aislada en memoria por prueba.

## Ejecución local

```powershell
# Desde el directorio backend/
py -m pytest tests -v
```

## Cobertura de HU-11 a HU-16

- `test_auth.py`:
  - HU-11: Registro de docente, unicidad de correo (409), prevención de escalamiento de privilegios (`role="admin"` ignorado), contraseñas robustas y verificación de hash Argon2id en BD.
  - HU-12: Login con hash dummy en tiempo constante (protección contra enumeración), emisión de JWT con claims requeridos (`sub`, `role`, `iat`, `exp`, `jti`, `iss`), rechazo de tokens manipulados, expirados o con `alg: none`, `GET /auth/me`, y revocación inmediata en cambios de rol o estado en BD.
- `test_users_permissions.py`:
  - HU-13: Matriz centralizada `ROLE_PERMISSIONS`, verificación de que `support` no puede reservar (403), administración de usuarios solo por `admin`, prohibición de auto-modificación de rol/estado y protección contra degradación o desactivación del último admin activo.
- `test_incidents.py`:
  - HU-14: Creación de incidencias con validación de salas oficiales (`SAL-001` a `SAL-010`) y recursos, trazabilidad con historial de eventos (`IncidentEvent`), visibilidad segregada por rol (docente solo ve las propias; soporte y admin ven todas), transiciones de estado estrictas y reapertura solo por admin, e inhabilitación y restauración transaccional de disponibilidad.
- `test_ai_classification.py`:
  - HU-15: Clasificación con IA usando transporte simulado, validación Pydantic estricta, fallback local en caso de JSON inválido, enums no reconocidos, error HTTP 500 o timeout, descarte de salas inventadas con advertencia, y verificación de firma de `analysis_token`.
- `test_classifier_rules.py`:
  - HU-16: Clasificador determinista en español por reglas y palabras clave, explicabilidad y funcionamiento 100% aislado sin conexión a red.
- `test_security_audit.py`:
  - Auditoría contra fugas de secretos: verificación de que respuestas y errores no filtran contraseñas, hashes, claves JWT ni API keys de IA.
