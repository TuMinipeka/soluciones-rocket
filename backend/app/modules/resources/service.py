"""Inventory and loan business rules, backed by SQLite transactions."""

from datetime import datetime, timezone

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.modules.auth.enums import Role
from app.modules.auth.models import User
from app.modules.resources.models import Loan, Resource
from app.modules.resources.schemas import LoanCreate, LoanResponse, ResourceCreate, ResourceResponse


def _utc_naive(value: datetime) -> datetime:
    """Store instants consistently in SQLite; naive API values are UTC."""
    if value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def _lock_writer(db: Session) -> None:
    """Serialize availability checks and writes across SQLite connections."""
    db.connection().exec_driver_sql("BEGIN IMMEDIATE")


def _resource_status(resource: Resource, db: Session) -> str:
    if resource.condition != "operational" or resource.is_blocked:
        return "disabled"
    active_loan = db.scalar(
        select(Loan.id).where(Loan.resource_id == resource.id, Loan.returned_at.is_(None)).limit(1)
    )
    return "loaned" if active_loan is not None else "available"


def resource_response(resource: Resource, db: Session) -> ResourceResponse:
    return ResourceResponse(
        id=resource.id,
        name=resource.name,
        category=resource.category,
        condition=resource.condition,
        status=_resource_status(resource, db),
        is_blocked=resource.is_blocked,
    )


def loan_response(loan: Loan) -> LoanResponse:
    return LoanResponse(
        id=loan.id,
        resource_id=loan.resource_id,
        resource_name=loan.resource.name,
        user_id=loan.borrower_id,
        start_time=loan.start_time,
        expected_return=loan.expected_return,
        returned_at=loan.returned_at,
        status="returned" if loan.returned_at is not None else "active",
        notes=loan.notes,
    )


def create_resource(data: ResourceCreate, db: Session) -> ResourceResponse:
    try:
        _lock_writer(db)
        if db.get(Resource, data.id) is not None:
            raise ConflictError("Ya existe un equipo con ese identificador.")
        resource = Resource(
            id=data.id,
            name=data.name.strip(),
            category=data.category.strip().lower(),
        )
        db.add(resource)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return resource_response(resource, db)


def list_resources(db: Session, category: str | None = None) -> list[ResourceResponse]:
    statement = select(Resource).order_by(Resource.id)
    if category:
        statement = statement.where(Resource.category == category.strip().lower())
    return [resource_response(item, db) for item in db.scalars(statement).all()]


def get_resource(resource_id: str, db: Session) -> ResourceResponse:
    resource = db.get(Resource, resource_id.upper())
    if resource is None:
        raise NotFoundError("Equipo no encontrado en el inventario autorizado.")
    return resource_response(resource, db)


def update_condition(resource_id: str, condition: str, db: Session) -> ResourceResponse:
    try:
        _lock_writer(db)
        resource = db.get(Resource, resource_id.upper())
        if resource is None:
            raise NotFoundError("Equipo no encontrado en el inventario autorizado.")
        resource.condition = condition
        db.commit()
    except Exception:
        db.rollback()
        raise
    return resource_response(resource, db)


def create_loan(data: LoanCreate, borrower: User, db: Session) -> LoanResponse:
    start = _utc_naive(data.start_time)
    end = _utc_naive(data.expected_return)
    if start >= end:
        raise ValidationError("La devolución prevista debe ser posterior al inicio del préstamo.")

    try:
        _lock_writer(db)
        resource = db.get(Resource, data.resource_id)
        if resource is None:
            raise NotFoundError("Equipo no encontrado en el inventario autorizado.")
        if resource.condition != "operational" or resource.is_blocked:
            raise ConflictError("El equipo está dañado o inhabilitado.")

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        overlap = db.scalar(
            select(Loan.id)
            .where(
                Loan.resource_id == resource.id,
                Loan.returned_at.is_(None),
                or_(
                    (Loan.start_time < end) & (Loan.expected_return > start),
                    Loan.start_time <= now,
                ),
            )
            .limit(1)
        )
        if overlap is not None:
            raise ConflictError("El equipo ya está solicitado en ese intervalo.")

        loan = Loan(
            resource_id=resource.id,
            borrower_id=borrower.id,
            start_time=start,
            expected_return=end,
            notes=data.notes,
        )
        db.add(loan)
        db.commit()
        db.refresh(loan)
    except Exception:
        db.rollback()
        raise
    return loan_response(loan)


def list_loans(user: User, db: Session) -> list[LoanResponse]:
    statement = select(Loan).order_by(Loan.id.desc())
    if user.role == Role.TEACHER.value:
        statement = statement.where(Loan.borrower_id == user.id)
    return [loan_response(item) for item in db.scalars(statement).all()]


def return_loan(loan_id: int, actor: User, db: Session) -> LoanResponse:
    try:
        _lock_writer(db)
        loan = db.get(Loan, loan_id)
        if loan is None:
            raise NotFoundError("Préstamo no encontrado.")
        if actor.role != Role.ADMIN.value and loan.borrower_id != actor.id:
            raise ForbiddenError("Solo quien solicitó el préstamo o un administrador puede devolverlo.")
        if loan.returned_at is not None:
            raise ConflictError("Este préstamo ya fue devuelto.")
        loan.returned_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.commit()
        db.refresh(loan)
    except Exception:
        db.rollback()
        raise
    return loan_response(loan)
