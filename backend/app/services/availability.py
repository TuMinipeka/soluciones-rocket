"""Punto de integración con el módulo de espacios y reservas de Conde.

Este archivo define la interfaz acordada para verificar salas oficiales, consultar
alternativas de reubicación y actualizar el estado de disponibilidad cuando una
incidencia crítica bloquea o libera un espacio.
"""

import unicodedata
from sqlalchemy.orm import Session


# Catálogo oficial de las 10 salas del campus (Fuente: docs/hackaton-rubricas-informacion.md)
OFFICIAL_SPACES = {
    "SAL-001": {"name": "Auditorio", "capacity": 100},
    "SAL-002": {"name": "Cosmos", "capacity": 25},
    "SAL-003": {"name": "Skilab", "capacity": 20},
    "SAL-004": {"name": "Spooki", "capacity": 38},
    "SAL-005": {"name": "Apolo", "capacity": 34},
    "SAL-006": {"name": "Blanca", "capacity": 12},
    "SAL-007": {"name": "Azul", "capacity": 10},
    "SAL-008": {"name": "Amarillas", "capacity": 6},
    "SAL-009": {"name": "Verdes", "capacity": 6},
    "SAL-010": {"name": "Artemis", "capacity": 32},
}

# Estado de bloqueo en memoria como fallback hasta que Conde monte la tabla de spaces
_space_block_status: dict[str, bool] = {k: False for k in OFFICIAL_SPACES}


def strip_accents(text: str) -> str:
    """Normaliza texto eliminando acentos y diacríticos."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower().strip()


def is_valid_space(space_id: str | None) -> bool:
    """Verifica si el identificador corresponde a una de las salas oficiales."""
    if not space_id:
        return False
    return space_id.upper() in OFFICIAL_SPACES


def get_space_info(space_id: str) -> dict | None:
    return OFFICIAL_SPACES.get(space_id.upper())


def match_space_by_text(text: str) -> str | None:
    """Encuentra determinísticamente si una sala oficial es mencionada por nombre en el texto."""
    norm_text = strip_accents(text)
    for sid, info in OFFICIAL_SPACES.items():
        norm_name = strip_accents(info["name"])
        if norm_name in norm_text.split() or f"sala {norm_name}" in norm_text or norm_name in norm_text:
            return sid
    return None


def set_space_status(space_id: str, is_blocked: bool, _reason: str, _db: Session) -> bool:
    """Punto de integración para marcar una sala como inhabilitada o disponible.
    
    Cuando Conde entregue su modelo Space, esta función actualizará space.is_active
    en la misma transacción.
    """
    sid = space_id.upper()
    if sid in OFFICIAL_SPACES:
        _space_block_status[sid] = is_blocked
        return True
    return False


def is_space_blocked(space_id: str) -> bool:
    return _space_block_status.get(space_id.upper(), False)


def get_space_alternatives(space_id: str, _db: Session) -> list[dict]:
    """Punto de integración que consulta alternativas deterministas para una sala inhabilitada.
    
    Busca salas no bloqueadas con aforo similar (dentro de un rango de capacidad razonable).
    No inventa salas: utiliza exclusivamente las salas oficiales de Campuslands.
    """
    sid = space_id.upper()
    current_space = OFFICIAL_SPACES.get(sid)
    if not current_space:
        return []

    target_capacity = current_space["capacity"]
    alternatives = []

    # Ordenar salas disponibles por cercanía de aforo
    for other_id, other_info in OFFICIAL_SPACES.items():
        if other_id == sid:
            continue
        if is_space_blocked(other_id):
            continue

        cap = other_info["capacity"]
        # Considerar compatible si el aforo es al menos 80% del actual o puede albergar un grupo similar
        if cap >= target_capacity * 0.8:
            alternatives.append({
                "kind": "space",
                "id": other_id,
                "name": other_info["name"],
                "reason": f"Aforo compatible ({cap} personas vs {target_capacity} requeridas) y sala operativa.",
                "capacity_diff": abs(cap - target_capacity),
            })

    # Ordenar por menor diferencia de aforo para mejor aprovechamiento
    alternatives.sort(key=lambda x: x["capacity_diff"])
    for item in alternatives:
        del item["capacity_diff"]

    return alternatives[:3]
