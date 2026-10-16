"""Local deterministic rules-based incident classifier and keyword dictionary."""

import unicodedata
import re
from app.modules.incidents.enums import (
    IncidentCategory,
    IncidentPriority,
    ResponsibleTeam,
)


def strip_accents(text: str) -> str:
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()


def _contains_keyword(text: str, keyword: str) -> bool:
    """Evita coincidencias parciales como 'red' dentro de 'pared'."""
    return re.search(rf"(?<!\w){re.escape(keyword)}(?!\w)", text) is not None


# Diccionario único de reglas y palabras clave. Modificable en caliente en < 1 minuto.
KEYWORD_RULES = {
    IncidentCategory.SAFETY: {
        "keywords": [
            "humo", "fuego", "incendio", "fuga", "escape", "gas", "descarga",
            "electrocucion", "pelado", "cable pelado", "olor a quemado", "peligro", "emergencia", "chispa", "chispas", "quemado"
        ],
        "priority": IncidentPriority.CRITICAL,
        "team": ResponsibleTeam.SECURITY,
        "suggests_blocking": True,
        "recommendation": "Evacuar o aislar el área inmediatamente y notificar al equipo de seguridad física y emergencias.",
    },
    IncidentCategory.ELECTRICAL: {
        "keywords": [
            "corto", "cortocircuito", "apagon", "enchufe", "toma", "tomacorriente",
            "voltaje", "breaker", "fusible", "energia", "luz", "luces"
        ],
        "priority": IncidentPriority.HIGH,
        "team": ResponsibleTeam.MAINTENANCE,
        "suggests_blocking": True,
        "recommendation": "Revisar el cuadro de interruptores eléctricos y desconectar equipos en la zona afectada.",
    },
    IncidentCategory.INFRASTRUCTURE: {
        "keywords": [
            "gotera", "goteras", "techo", "puerta", "cerradura", "chapa", "ventana",
            "vidrio", "humedad", "pared", "aire", "aire acondicionado", "inundacion",
            "bano", "banos", "tuberia"
        ],
        "priority": IncidentPriority.HIGH,
        "team": ResponsibleTeam.MAINTENANCE,
        "suggests_blocking": False,
        "recommendation": "Enviar personal de mantenimiento para inspección estructural y reparación preventiva.",
    },
    IncidentCategory.NETWORK: {
        "keywords": [
            "wifi", "internet", "red", "conexion", "router", "switch", "ethernet",
            "ip", "senal", "dns", "lan"
        ],
        "priority": IncidentPriority.HIGH,
        "team": ResponsibleTeam.IT_SUPPORT,
        "suggests_blocking": False,
        "recommendation": "Reiniciar puntos de acceso de red y verificar el estado del switch de zona.",
    },
    IncidentCategory.TECHNOLOGY: {
        "keywords": [
            "proyector", "computador", "pantalla", "portatil", "mouse", "teclado",
            "hdmi", "microfono", "audio", "sonido", "cable", "tv", "televisor",
            "camara", "parlante", "no prende", "no proyecta", "video beam"
        ],
        "priority": IncidentPriority.MEDIUM,
        "team": ResponsibleTeam.IT_SUPPORT,
        "suggests_blocking": False,
        "recommendation": "Solicitar revisión de equipo a soporte técnico de TI o verificar cables de conexión.",
    },
    IncidentCategory.FURNITURE: {
        "keywords": [
            "silla", "sillas", "mesa", "mesas", "escritorio", "tablero", "marcador",
            "estante", "cortina", "podio", "asiento"
        ],
        "priority": IncidentPriority.LOW,
        "team": ResponsibleTeam.MAINTENANCE,
        "suggests_blocking": False,
        "recommendation": "Reubicar o sustituir el mobiliario afectado en la próxima ventana operativa.",
    },
    IncidentCategory.CLEANING: {
        "keywords": [
            "basura", "sucio", "suciedad", "derrame", "polvo", "desaseo", "desorden",
            "reguero", "caneca", "mancha", "manchado"
        ],
        "priority": IncidentPriority.LOW,
        "team": ResponsibleTeam.CLEANING,
        "suggests_blocking": False,
        "recommendation": "Programar turno de aseo y desinfección para el espacio indicado.",
    },
}

CRITICAL_OVERRIDE_KEYWORDS = {
    "humo", "fuego", "incendio", "descarga", "chispa", "chispas", "corto",
    "cortocircuito", "gas", "peligro", "quemado", "emergencia"
}

HIGH_OVERRIDE_KEYWORDS = {
    "apagon", "inundacion", "roto", "sin internet", "sin luz", "no enciende"
}


def classify_by_rules(text: str) -> dict:
    """Clasifica un incidente mediante reglas heurísticas de coincidencia de palabras clave.
    
    Retorna siempre un resultado determinista, explicable y compatible con los contratos.
    """
    normalized_text = strip_accents(text)
    # Tokenizar en palabras

    best_category: IncidentCategory | None = None
    best_matches: list[str] = []
    max_score = 0

    for category, rule in KEYWORD_RULES.items():
        matches = [kw for kw in rule["keywords"] if _contains_keyword(normalized_text, kw)]
        score = len(matches)
        if score > max_score:
            max_score = score
            best_category = category
            best_matches = matches

    # Si no hubo coincidencias de palabras clave, asignar categoría por defecto
    if best_category is None:
        return {
            "category": IncidentCategory.OTHER,
            "priority": IncidentPriority.LOW,
            "responsible_team": ResponsibleTeam.ADMINISTRATION,
            "suggests_blocking": False,
            "recommendation": "Describe una falla concreta y verificable del campus antes de registrar el reporte.",
            "explanation": "No se detectó una falla operativa reconocible; se requiere aclaración.",
            "matched_keywords": [],
        }

    rule_info = KEYWORD_RULES[best_category]
    priority = rule_info["priority"]
    suggests_blocking = rule_info["suggests_blocking"]

    # Evaluar si contiene palabras críticas que elevan la prioridad
    has_critical = any(_contains_keyword(normalized_text, kw) for kw in CRITICAL_OVERRIDE_KEYWORDS)
    has_high = any(_contains_keyword(normalized_text, kw) for kw in HIGH_OVERRIDE_KEYWORDS)

    if has_critical:
        priority = IncidentPriority.CRITICAL
        suggests_blocking = True
    elif has_high and priority in (IncidentPriority.LOW, IncidentPriority.MEDIUM):
        priority = IncidentPriority.HIGH

    explanation = (
        f"Regla activada por palabras clave coincidentes: {', '.join(best_matches[:4])}."
    )

    return {
        "category": best_category,
        "priority": priority,
        "responsible_team": rule_info["team"],
        "suggests_blocking": suggests_blocking,
        "recommendation": rule_info["recommendation"],
        "explanation": explanation,
        "matched_keywords": best_matches,
    }
