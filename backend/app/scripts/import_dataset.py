"""CLI for importing an authorized dataset without changing its source file."""

import argparse
import json
import sys
from pathlib import Path

from app.db.session import SessionLocal
from app.imports.dataset import import_dataset
from app.scripts.init_db import init_db


def main() -> int:
    parser = argparse.ArgumentParser(description="Importar datos autorizados de Campuslands.")
    parser.add_argument("file", type=Path, help="Archivo CSV, JSON o XLSX")
    parser.add_argument("--kind", choices=("resources", "spaces"), required=True)
    parser.add_argument("--dry-run", action="store_true", help="Validar sin escribir en SQLite")
    parser.add_argument("--report", type=Path, help="Ruta JSON para el reporte de filas")
    args = parser.parse_args()
    try:
        init_db()
        with SessionLocal() as db:
            report = import_dataset(args.file, args.kind, db, dry_run=args.dry_run)
        output = json.dumps(report, ensure_ascii=False, indent=2)
        if args.report:
            args.report.parent.mkdir(parents=True, exist_ok=True)
            args.report.write_text(output + "\n", encoding="utf-8")
        print(output)
        return 2 if report["summary"]["rejected"] else 0
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"Importación falló: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
