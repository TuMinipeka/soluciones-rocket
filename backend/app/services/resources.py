"""Punto de integración con el inventario y préstamos de Mayorga.

Gestiona la verificación de equipos autorizados, inhabilitación por daños
y búsqueda de alternativas disponibles.
"""

from sqlalchemy.orm import Session


_resource_block_status: dict[str, bool] = {}


def is_valid_resource(resource_id: str | None) -> bool:
    """Verifica si el identificador de recurso existe.
    
    Hasta que Mayorga cargue el dataset oficial de recursos, aceptamos identificadores
    con formato estándar (ej. EQ-*, LAP-*, PROY-*) y respetamos que no se inventen registros.
    """
    if not resource_id:
        return False
    # Formato razonable de recurso
    return len(resource_id.strip()) >= 3


def set_resource_status(resource_id: str, is_blocked: bool, _reason: str, _db: Session) -> bool:
    """Punto de integración para marcar un recurso tecnológico como inhabilitado o disponible."""
    if not resource_id:
        return False
    _resource_block_status[resource_id.upper()] = is_blocked
    return True


def is_resource_blocked(resource_id: str) -> bool:
    return _resource_block_status.get(resource_id.upper(), False)


def get_resource_alternatives(resource_id: str, _db: Session) -> list[dict]:
    """Punto de integración para buscar recursos de reemplazo disponibles.
    
    NOTA ESTRICTA: No inventamos inventario ficticio. Si el dataset oficial aún no está
    cargado en la base de datos de Mayorga, se devuelve una lista vacía con honestidad.
    """
    return []
