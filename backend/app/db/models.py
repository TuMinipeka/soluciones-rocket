"""Import every mapped class before explicit schema initialization."""

from app.modules.auth.models import User
from app.modules.incidents.models import Incident, IncidentEvent
from app.modules.resources.models import Loan, Resource
from app.modules.spaces.models import Space

__all__ = ["User", "Incident", "IncidentEvent", "Loan", "Resource", "Space"]
