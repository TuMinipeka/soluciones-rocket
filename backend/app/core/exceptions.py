"""Custom application exceptions and centralized FastAPI handlers."""

from typing import Any
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Excepción base para errores de negocio de la aplicación."""

    def __init__(
        self,
        message: str,
        code: str = "APP_ERROR",
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Any = None,
        headers: dict[str, str] | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details
        self.headers = headers or {}


class NotFoundError(AppError):
    def __init__(self, message: str = "Recurso no encontrado", details: Any = None):
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
        )


class ConflictError(AppError):
    def __init__(self, message: str = "Conflicto con el estado actual del recurso", details: Any = None):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=status.HTTP_409_CONFLICT,
            details=details,
        )


class ForbiddenError(AppError):
    def __init__(self, message: str = "No tienes permisos para realizar esta acción", details: Any = None):
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=status.HTTP_403_FORBIDDEN,
            details=details,
        )


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Credenciales inválidas o token no autorizado", details: Any = None):
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details,
            headers={"WWW-Authenticate": "Bearer"},
        )


class ValidationError(AppError):
    def __init__(self, message: str = "Datos de entrada inválidos", details: Any = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=422,
            details=details,
        )


class TooManyRequestsError(AppError):
    def __init__(self, message: str = "Demasiados intentos. Por favor espera antes de reintentar.", details: Any = None):
        super().__init__(
            message=message,
            code="TOO_MANY_REQUESTS",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details=details,
        )


def register_exception_handlers(app: FastAPI) -> None:
    """Registra manejadores globales de excepciones con estructura JSON uniforme."""

    @app.exception_handler(AppError)
    async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
        content = {
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        }
        return JSONResponse(
            status_code=exc.status_code,
            content=content,
            headers=exc.headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
        formatted_details = []
        for err in exc.errors():
            loc = " -> ".join(str(item) for item in err.get("loc", []))
            formatted_details.append({
                "field": loc,
                "message": err.get("msg", "Valor no válido"),
                "type": err.get("type", "value_error"),
            })
        content = {
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Los datos enviados no cumplen con el formato o restricciones requeridas.",
                "details": formatted_details,
            }
        }
        return JSONResponse(
            status_code=422,
            content=content,
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
        # Mapeo de códigos HTTP comunes a códigos legibles
        code_map = {
            400: "BAD_REQUEST",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            409: "CONFLICT",
            422: "VALIDATION_ERROR",
            429: "TOO_MANY_REQUESTS",
            500: "INTERNAL_SERVER_ERROR",
            501: "NOT_IMPLEMENTED",
            503: "SERVICE_UNAVAILABLE",
        }
        code = code_map.get(exc.status_code, "HTTP_ERROR")
        message = str(exc.detail) if exc.detail else "Error en la petición"
        content = {
            "error": {
                "code": code,
                "message": message,
                "details": None,
            }
        }
        return JSONResponse(
            status_code=exc.status_code,
            content=content,
            headers=exc.headers,
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_request: Request, _exc: Exception) -> JSONResponse:
        # Nunca exponer trazas ni detalles internos al cliente en producción
        content = {
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Ha ocurrido un error interno inesperado en el servidor.",
                "details": None,
            }
        }
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=content,
        )
