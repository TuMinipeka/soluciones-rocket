"""Acceptance checks for authorized import and opt-in demo scenarios."""

import json
from datetime import date, time, timedelta

import pytest
from openpyxl import Workbook
from sqlalchemy import func, select

from app.imports.dataset import import_dataset
from app.modules.incidents.models import Incident, IncidentEvent
from app.modules.reservations.models import Reservation
from app.modules.resources.models import Loan, Resource
from app.modules.spaces.models import Space
from app.scripts.seed_scenarios import seed_scenarios


def test_resource_csv_import_reports_invalid_duplicates_and_preserves_existing(tmp_path, db_session):
    source = tmp_path / "inventory.csv"
    source.write_text("id,name,category,condition\n"
                      "EQ-001,Proyector autorizado,projector,operational\n"
                      "EQ-001,Duplicado,projector,operational\n"
                      "EQ-002,Equipo dañado,laptop,damaged\n"
                      "EQ-003,Equipo inválido,laptop,broken\n", encoding="utf-8")
    first = import_dataset(source, "resources", db_session)
    assert first["summary"] == {"imported": 2, "would_import": 0, "skipped": 0, "rejected": 2}
    assert db_session.get(Resource, "EQ-002").condition == "damaged"
    second = import_dataset(source, "resources", db_session)
    assert second["summary"] == {"imported": 0, "would_import": 0, "skipped": 2, "rejected": 2}
    source.write_text("id,name,category\nEQ-001,Otro nombre,projector\n", encoding="utf-8")
    changed = import_dataset(source, "resources", db_session)
    assert changed["summary"]["rejected"] == 1
    assert db_session.get(Resource, "EQ-001").name == "Proyector autorizado"


def test_json_dry_run_and_xlsx_import(tmp_path, db_session):
    source = tmp_path / "inventory.json"
    source.write_text(json.dumps({"records": [{"id": "EQ-010", "name": "Portátil", "category": "laptop"}]}),
                      encoding="utf-8")
    report = import_dataset(source, "resources", db_session, dry_run=True)
    assert report["summary"]["would_import"] == 1
    assert db_session.get(Resource, "EQ-010") is None

    workbook = Workbook()
    sheet = workbook.active
    sheet.append(["id", "name", "capacity"])
    sheet.append(["SAL-002", "Cosmos", 25])
    sheet.append(["SAL-003", "Skylab", 999])
    excel = tmp_path / "rooms.xlsx"
    workbook.save(excel)
    result = import_dataset(excel, "spaces", db_session)
    assert result["summary"]["skipped"] == 1
    assert result["summary"]["rejected"] == 1
    assert db_session.get(Space, "SAL-003").capacity == 20


def test_demo_scenarios_are_opt_in_idempotent_and_require_authorized_inventory(
    db_session, teacher_user, support_user,
):
    demo_date = date.today() + timedelta(days=30)
    db_session.add_all([
        Resource(id="EQ-A", name="Equipo A", category="laptop"),
        Resource(id="EQ-B", name="Equipo B", category="laptop"),
        Resource(id="EQ-C", name="Equipo C", category="laptop"),
    ])
    db_session.commit()
    ids = ("EQ-A", "EQ-B", "EQ-C")
    first = seed_scenarios(db_session, demo_date, teacher_user.email, support_user.email, ids)
    assert first == {"reservations": 5, "incidents": 5, "loans": 2}
    assert db_session.get(Space, "SAL-004").is_blocked is True
    assert db_session.scalar(select(func.count()).select_from(IncidentEvent)) == 5
    second = seed_scenarios(db_session, demo_date, teacher_user.email, support_user.email, ids)
    assert second == {"reservations": 0, "incidents": 0, "loans": 0}
    assert db_session.scalar(select(func.count()).select_from(Reservation)) == 5
    assert db_session.scalar(select(func.count()).select_from(Incident)) == 5
    assert db_session.scalar(select(func.count()).select_from(Loan)) == 2


def test_demo_scenarios_rollback_on_booking_conflict(db_session, teacher_user, support_user):
    demo_date = date.today() + timedelta(days=30)
    db_session.add(Reservation(space_id="SAL-002", user_id=teacher_user.id, date=demo_date,
                               start_time=time(9), end_time=time(11),
                               attendees=10, title="Reserva real"))
    db_session.commit()
    with pytest.raises(ValueError, match="ya tiene una reserva"):
        seed_scenarios(db_session, demo_date, teacher_user.email, support_user.email)
    assert db_session.scalar(select(func.count()).select_from(Reservation)) == 1
    assert db_session.scalar(select(func.count()).select_from(Incident)) == 0
