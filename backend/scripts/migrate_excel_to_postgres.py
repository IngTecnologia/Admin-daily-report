"""
Script de migración de Excel a PostgreSQL
Migra todos los datos existentes del sistema Excel al nuevo sistema PostgreSQL
"""
import pandas as pd
import openpyxl
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, date
import uuid
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
from loguru import logger
import argparse

# Agregar el directorio src al path
sys.path.append(str(Path(__file__).parent.parent / "src"))

from database.connection import get_database_url, init_db
from database.models import User, Report, Incident, Movement, SystemConfig
from auth.jwt_handler import jwt_handler
from security.encryption import field_encryptor

class ExcelToPostgresMigrator:
    """Migrador de datos de Excel a PostgreSQL"""

    def __init__(self, excel_path: str, db_url: Optional[str] = None):
        """
        Inicializar migrador

        Args:
            excel_path: Ruta al archivo Excel
            db_url: URL de conexión a PostgreSQL (opcional)
        """
        self.excel_path = Path(excel_path)
        if not self.excel_path.exists():
            raise FileNotFoundError(f"Excel file not found: {excel_path}")

        # Configurar base de datos
        self.db_url = db_url or get_database_url()
        self.engine = create_engine(self.db_url)
        self.Session = sessionmaker(bind=self.engine)

        # Mapeo de administradores a usuarios
        self.admin_user_map: Dict[str, User] = {}

        # Estadísticas de migración
        self.stats = {
            "users_created": 0,
            "reports_migrated": 0,
            "incidents_migrated": 0,
            "movements_migrated": 0,
            "errors": []
        }

    def migrate(self, create_tables: bool = True) -> Dict:
        """
        Ejecutar migración completa

        Args:
            create_tables: Si crear las tablas antes de migrar

        Returns:
            Diccionario con estadísticas de la migración
        """
        logger.info(f"Starting migration from {self.excel_path}")

        try:
            # Crear tablas si es necesario
            if create_tables:
                logger.info("Creating database tables...")
                init_db()

            # Leer datos de Excel
            logger.info("Reading Excel file...")
            excel_data = self._read_excel_data()

            # Migrar en orden
            with self.Session() as session:
                self._migrate_users(session, excel_data["Reportes"])
                self._migrate_reports(session, excel_data["Reportes"])
                self._migrate_incidents(session, excel_data.get("Incidencias"))
                self._migrate_movements(session, excel_data.get("Ingresos_Retiros"))
                self._migrate_config(session, excel_data.get("Configuracion"))

                session.commit()

            logger.info("Migration completed successfully!")
            return self.stats

        except Exception as e:
            logger.error(f"Migration failed: {e}")
            self.stats["errors"].append(str(e))
            raise

    def _read_excel_data(self) -> Dict[str, pd.DataFrame]:
        """
        Leer todas las hojas del Excel

        Returns:
            Diccionario con DataFrames por hoja
        """
        excel_data = {}

        with pd.ExcelFile(self.excel_path) as xls:
            for sheet_name in xls.sheet_names:
                logger.info(f"Reading sheet: {sheet_name}")
                df = pd.read_excel(xls, sheet_name=sheet_name)

                # Limpiar columnas
                df.columns = df.columns.str.strip()

                # Convertir fechas si es necesario
                date_columns = ["Fecha", "FechaCreacion", "FechaFin", "Fecha_Fin", "Fecha_Modificacion"]
                for col in date_columns:
                    if col in df.columns:
                        df[col] = pd.to_datetime(df[col], errors="coerce")

                excel_data[sheet_name] = df

        return excel_data

    def _migrate_users(self, session, reports_df: pd.DataFrame):
        """
        Crear usuarios basados en administradores únicos

        Args:
            session: Sesión de SQLAlchemy
            reports_df: DataFrame de reportes
        """
        logger.info("Migrating users...")

        # Obtener administradores únicos
        unique_admins = reports_df["Administrador"].unique()

        # Mapeo de administrador a cliente
        admin_client_map = {
            "Adriana Robayo": "Administrativo Bogota",
            "Angela Ramirez": "VRC",
            "Floribe Correa": "Administrativo Bogota",
            "Julieth Rincon": "Sierracol CLM",
            "Eddinson Javier Martinez": "VPI CUSIANA",
            "Kellis Minosca Morquera": "VPI FLORENA",
            "Kenia Sanchez": "Sierracol CLM",
            "Liliana Romero": "Administrativo Bogota",
            "Marcela Cusba Gomez": "VPI CUPIAGUA",
            "Mirledys Garcia San Juan": "Sierracol CRC",
            "Yolima Arenas Zarate": "VPI CUPIAGUA"
        }

        for admin_name in unique_admins:
            if pd.isna(admin_name):
                continue

            admin_name = str(admin_name).strip()

            # Verificar si ya existe
            existing = session.query(User).filter_by(username=self._create_username(admin_name)).first()
            if existing:
                self.admin_user_map[admin_name] = existing
                continue

            # Crear nuevo usuario
            user = User(
                username=self._create_username(admin_name),
                email=self._create_email(admin_name),
                password_hash=jwt_handler.get_password_hash("Admin123!"),  # Contraseña temporal
                full_name=admin_name,
                role="operator",
                administrator_name=admin_name,
                client_operation=admin_client_map.get(admin_name, "General"),
                is_active=True,
                is_verified=False
            )

            # Encriptar campos sensibles
            user = field_encryptor.encrypt_model_fields(user, "users")

            session.add(user)
            self.admin_user_map[admin_name] = user
            self.stats["users_created"] += 1

            logger.info(f"Created user for: {admin_name}")

        session.flush()  # Asegurar que los IDs estén disponibles

    def _migrate_reports(self, session, reports_df: pd.DataFrame):
        """
        Migrar reportes principales

        Args:
            session: Sesión de SQLAlchemy
            reports_df: DataFrame de reportes
        """
        logger.info("Migrating reports...")

        # Mapeo de IDs legacy
        self.report_id_map = {}

        for _, row in reports_df.iterrows():
            try:
                # Obtener usuario correspondiente
                admin_name = str(row.get("Administrador", "")).strip()
                user = self.admin_user_map.get(admin_name)

                if not user:
                    logger.warning(f"User not found for admin: {admin_name}")
                    continue

                # Parsear fechas
                report_date = self._parse_date(row.get("Fecha"))
                if not report_date:
                    logger.warning(f"Invalid date for report: {row}")
                    continue

                # Crear reporte
                report = Report(
                    legacy_id=str(row.get("ID", "")),
                    user_id=user.id,
                    administrator=admin_name,
                    client_operation=str(row.get("ClienteOperacion", "")).strip(),
                    daily_hours=float(row.get("HorasDiarias", 0)),
                    staff_personnel=int(row.get("PersonalStaff", 0)),
                    base_personnel=int(row.get("PersonalBase", 0)),
                    relevant_facts=str(row.get("HechosRelevantes", "")),
                    status="completed",
                    report_date=report_date,
                    created_at=self._parse_datetime(row.get("FechaCreacion")),
                    client_ip=str(row.get("IP", "")),
                    user_agent=str(row.get("UserAgent", ""))
                )

                # Encriptar campos sensibles
                report = field_encryptor.encrypt_model_fields(report, "reports")

                session.add(report)
                session.flush()

                # Guardar mapeo de IDs
                if row.get("ID"):
                    self.report_id_map[str(row["ID"])] = report.id

                self.stats["reports_migrated"] += 1

            except Exception as e:
                logger.error(f"Error migrating report: {e}")
                self.stats["errors"].append(f"Report migration: {e}")

    def _migrate_incidents(self, session, incidents_df: Optional[pd.DataFrame]):
        """
        Migrar incidencias

        Args:
            session: Sesión de SQLAlchemy
            incidents_df: DataFrame de incidencias
        """
        if incidents_df is None or incidents_df.empty:
            logger.warning("No incidents to migrate")
            return

        logger.info("Migrating incidents...")

        for _, row in incidents_df.iterrows():
            try:
                # Obtener ID del reporte
                legacy_report_id = str(row.get("IDReporte", ""))
                report_id = self.report_id_map.get(legacy_report_id)

                if not report_id:
                    logger.warning(f"Report not found for incident: {legacy_report_id}")
                    continue

                # Crear incidencia
                incident = Incident(
                    report_id=report_id,
                    incident_type=str(row.get("TipoIncidencia", "")),
                    employee_name=str(row.get("NombreEmpleado", "")),
                    end_date=self._parse_date(row.get("FechaFin")),
                    notes=str(row.get("Notas", ""))
                )

                # Encriptar campos sensibles
                incident = field_encryptor.encrypt_model_fields(incident, "incidents")

                session.add(incident)
                self.stats["incidents_migrated"] += 1

            except Exception as e:
                logger.error(f"Error migrating incident: {e}")
                self.stats["errors"].append(f"Incident migration: {e}")

    def _migrate_movements(self, session, movements_df: Optional[pd.DataFrame]):
        """
        Migrar movimientos de personal

        Args:
            session: Sesión de SQLAlchemy
            movements_df: DataFrame de movimientos
        """
        if movements_df is None or movements_df.empty:
            logger.warning("No movements to migrate")
            return

        logger.info("Migrating movements...")

        for _, row in movements_df.iterrows():
            try:
                # Obtener ID del reporte
                legacy_report_id = str(row.get("IDReporte", ""))
                report_id = self.report_id_map.get(legacy_report_id)

                if not report_id:
                    logger.warning(f"Report not found for movement: {legacy_report_id}")
                    continue

                # Crear movimiento
                movement = Movement(
                    report_id=report_id,
                    employee_name=str(row.get("NombreEmpleado", "")),
                    position=str(row.get("Cargo", "")),
                    movement_type=str(row.get("Estado", "Ingreso")),
                    effective_date=self._parse_date(row.get("FechaEfectiva")),
                    notes=str(row.get("Notas", ""))
                )

                # Encriptar campos sensibles
                movement = field_encryptor.encrypt_model_fields(movement, "movements")

                session.add(movement)
                self.stats["movements_migrated"] += 1

            except Exception as e:
                logger.error(f"Error migrating movement: {e}")
                self.stats["errors"].append(f"Movement migration: {e}")

    def _migrate_config(self, session, config_df: Optional[pd.DataFrame]):
        """
        Migrar configuración del sistema

        Args:
            session: Sesión de SQLAlchemy
            config_df: DataFrame de configuración
        """
        if config_df is None or config_df.empty:
            logger.warning("No configuration to migrate")
            return

        logger.info("Migrating system configuration...")

        for _, row in config_df.iterrows():
            try:
                config = SystemConfig(
                    key=str(row.get("Clave", "")),
                    value=str(row.get("Valor", "")),
                    description=str(row.get("Descripcion", ""))
                )

                # Verificar si ya existe
                existing = session.query(SystemConfig).filter_by(key=config.key).first()
                if not existing:
                    session.add(config)

            except Exception as e:
                logger.error(f"Error migrating config: {e}")

    def _create_username(self, admin_name: str) -> str:
        """Crear username desde nombre de administrador"""
        return admin_name.lower().replace(" ", ".").replace("ñ", "n")

    def _create_email(self, admin_name: str) -> str:
        """Crear email desde nombre de administrador"""
        username = self._create_username(admin_name)
        return f"{username}@inemec.com"

    def _parse_date(self, value) -> Optional[date]:
        """Parsear fecha de varios formatos"""
        if pd.isna(value):
            return None

        if isinstance(value, (date, datetime)):
            return value.date() if isinstance(value, datetime) else value

        try:
            return pd.to_datetime(value).date()
        except:
            return None

    def _parse_datetime(self, value) -> Optional[datetime]:
        """Parsear datetime de varios formatos"""
        if pd.isna(value):
            return datetime.now()

        if isinstance(value, datetime):
            return value

        try:
            return pd.to_datetime(value)
        except:
            return datetime.now()

    def print_stats(self):
        """Imprimir estadísticas de migración"""
        print("\n" + "="*50)
        print("MIGRATION STATISTICS")
        print("="*50)
        print(f"Users created: {self.stats['users_created']}")
        print(f"Reports migrated: {self.stats['reports_migrated']}")
        print(f"Incidents migrated: {self.stats['incidents_migrated']}")
        print(f"Movements migrated: {self.stats['movements_migrated']}")

        if self.stats["errors"]:
            print(f"\nErrors encountered: {len(self.stats['errors'])}")
            for error in self.stats["errors"][:10]:  # Mostrar primeros 10 errores
                print(f"  - {error}")
        else:
            print("\nNo errors encountered ✓")

        print("="*50)


def main():
    """Función principal del script"""
    parser = argparse.ArgumentParser(description="Migrate Excel data to PostgreSQL")
    parser.add_argument(
        "--excel-path",
        default="data/reportes_diarios.xlsx",
        help="Path to Excel file"
    )
    parser.add_argument(
        "--db-url",
        help="Database URL (optional, will use env vars if not provided)"
    )
    parser.add_argument(
        "--create-tables",
        action="store_true",
        default=True,
        help="Create database tables before migration"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Perform a dry run without committing changes"
    )

    args = parser.parse_args()

    # Configurar logging
    logger.add("migration_{time}.log", rotation="500 MB")

    try:
        # Crear migrador
        migrator = ExcelToPostgresMigrator(
            excel_path=args.excel_path,
            db_url=args.db_url
        )

        # Ejecutar migración
        if args.dry_run:
            logger.info("DRY RUN MODE - No changes will be committed")

        stats = migrator.migrate(create_tables=args.create_tables)

        # Mostrar estadísticas
        migrator.print_stats()

        if not args.dry_run:
            print("\n✅ Migration completed successfully!")
        else:
            print("\n📋 Dry run completed - no changes were made")

    except Exception as e:
        logger.error(f"Migration failed: {e}")
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()