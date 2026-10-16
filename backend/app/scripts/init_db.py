"""Explicit, idempotent schema initialization for the hackathon SQLite database."""

from app.db.base import Base
from app.db.models import Incident, IncidentEvent, Loan, Resource, Space, User  # noqa: F401
from app.db.session import engine


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Esquema SQLite inicializado.")
