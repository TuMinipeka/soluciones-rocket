"""Health and service metadata endpoints."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import engine


router = APIRouter(tags=["system"])


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Verificar estado del servicio",
    description="Comprueba que la API y su conexión configurada a SQLite responden correctamente.",
)
def health() -> dict[str, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        ) from exc

    return {"status": "ok"}
