from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base shared by SQLAlchemy models from all domain modules."""
