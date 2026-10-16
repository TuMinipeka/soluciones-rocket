"""Inventory and loan endpoints used by the campus operations client."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import get_current_user, require_roles
from app.db.session import get_db
from app.modules.auth.enums import Role
from app.modules.auth.models import User
from app.modules.resources import service
from app.modules.resources.schemas import (
    LoanCreate,
    LoanResponse,
    ResourceConditionUpdate,
    ResourceCreate,
    ResourceResponse,
)


router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("", response_model=list[ResourceResponse])
def list_resources(
    category: str | None = Query(default=None),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ResourceResponse]:
    return service.list_resources(db, category)


@router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
def create_resource(
    data: ResourceCreate,
    _staff: User = Depends(require_roles(Role.ADMIN, Role.SUPPORT)),
    db: Session = Depends(get_db),
) -> ResourceResponse:
    return service.create_resource(data, db)


@router.post("/loans", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
def create_loan(
    data: LoanCreate,
    borrower: User = Depends(require_roles(Role.ADMIN, Role.TEACHER)),
    db: Session = Depends(get_db),
) -> LoanResponse:
    return service.create_loan(data, borrower, db)


@router.get("/loans", response_model=list[LoanResponse])
def list_loans(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[LoanResponse]:
    return service.list_loans(user, db)


@router.post("/loans/{loan_id}/return", response_model=LoanResponse)
def return_loan(
    loan_id: int,
    actor: User = Depends(require_roles(Role.ADMIN, Role.TEACHER)),
    db: Session = Depends(get_db),
) -> LoanResponse:
    return service.return_loan(loan_id, actor, db)


@router.get("/{resource_id}", response_model=ResourceResponse)
def get_resource(
    resource_id: str,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ResourceResponse:
    return service.get_resource(resource_id, db)


@router.patch("/{resource_id}", response_model=ResourceResponse)
def update_resource_condition(
    resource_id: str,
    data: ResourceConditionUpdate,
    _admin: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
) -> ResourceResponse:
    return service.update_condition(resource_id, data.condition, db)
