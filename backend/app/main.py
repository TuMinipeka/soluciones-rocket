from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.modules.auth.router import router as auth_router
from app.modules.auth.users_router import router as users_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.incidents.router import router as incidents_router
from app.modules.recommendations.router import router as recommendations_router
from app.modules.reservations.router import router as reservations_router
from app.modules.resources.router import router as resources_router
from app.modules.spaces.router import router as spaces_router
from app.modules.system.router import router as system_router


def create_app() -> FastAPI:
    """Build the API and register its shared infrastructure and modules."""
    application = FastAPI(
        title="Campuslands Operations API",
        description="Sistema Central de Gestión Operativa: Espacios, Recursos, Incidencias y Triaje con IA.",
        version="1.0.0",
    )

    register_exception_handlers(application)

    origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
    application.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(system_router)
    application.include_router(auth_router)
    application.include_router(users_router)
    application.include_router(dashboard_router)
    application.include_router(incidents_router)
    application.include_router(reservations_router)
    application.include_router(recommendations_router)
    application.include_router(resources_router)
    application.include_router(spaces_router)
    return application


app = create_app()

