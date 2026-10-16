import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.exceptions import register_exception_handlers
from app.db.session import engine
from app.modules.auth.router import router as auth_router
from app.modules.auth.users_router import router as users_router
from app.modules.incidents.router import router as incidents_router


app = FastAPI(
    title="Campuslands Operations API",
    description="Sistema Central de Gestión Operativa: Espacios, Recursos, Incidencias y Triaje con IA.",
    version="1.0.0",
)

# Registrar manejadores globales con formato de error uniforme {"error": {"code": ..., "message": ..., "details": ...}}
register_exception_handlers(app)

origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail="Database unavailable") from exc
    return {"status": "ok"}


# Registro modular de routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(incidents_router)
