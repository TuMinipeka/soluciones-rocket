"""Enumerations for incidents domain."""

from enum import Enum


class IncidentCategory(str, Enum):
    TECHNOLOGY = "technology"
    NETWORK = "network"
    ELECTRICAL = "electrical"
    INFRASTRUCTURE = "infrastructure"
    FURNITURE = "furniture"
    CLEANING = "cleaning"
    SAFETY = "safety"
    OTHER = "other"


class IncidentPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


class ResponsibleTeam(str, Enum):
    IT_SUPPORT = "it_support"
    MAINTENANCE = "maintenance"
    CLEANING = "cleaning"
    SECURITY = "security"
    ADMINISTRATION = "administration"


class ClassificationSource(str, Enum):
    AI = "ai"
    RULES = "rules"


class FallbackReason(str, Enum):
    NOT_CONFIGURED = "not_configured"
    TIMEOUT = "timeout"
    HTTP_ERROR = "http_error"
    INVALID_RESPONSE = "invalid_response"
