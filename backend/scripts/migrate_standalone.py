"""
Migracion independiente de Excel a PostgreSQL
Evita imports problematicos usando solo pandas, psycopg2 y bcrypt
"""
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import bcrypt
from datetime import datetime
import uuid
import sys

# Configuracion
DB_CONFIG = {
    'host': 'postgres',
    'port': 5432,
    'dbname': 'reportes_diarios',
    'user': 'postgres',
    'password': 'ZfNh0gN7Q4gYM0XbKxajdg24YCy2GI2E'
}

EXCEL_PATH = '/app/data/reportes_diarios.xlsx'
DRY_RUN = '--dry-run' in sys.argv

def hash_password(password: str) -> str:
    """Hash password con bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_username(admin_name: str) -> str:
    """Crear username desde nombre"""
    return admin_name.lower().replace(" ", ".").replace("ñ", "n")

def create_email(admin_name: str) -> str:
    """Crear email desde nombre"""
    username = create_username(admin_name)
    return f"{username}@inemec.com"

def migrate():
    """Ejecutar migracion completa"""
    print("\n" + "="*60)
    print("MIGRACION EXCEL -> PostgreSQL")
    if DRY_RUN:
        print("MODO: DRY RUN (sin commits)")
    else:
        print("MODO: PRODUCCION (con commits)")
    print("="*60 + "\n")

    # Conectar a DB
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    stats = {
        'users_created': 0,
        'reports_migrated': 0,
        'incidents_migrated': 0,
        'movements_migrated': 0,
        'configs_migrated': 0
    }

    try:
        # Leer Excel
        print("📂 Leyendo archivo Excel...")
        xl_file = pd.ExcelFile(EXCEL_PATH)
        print(f"   Hojas encontradas: {xl_file.sheet_names}\n")

        # Leer hojas
        df_reportes = pd.read_excel(EXCEL_PATH, sheet_name='Reportes')
        df_incidencias = pd.read_excel(EXCEL_PATH, sheet_name='Incidencias')
        df_movimientos = pd.read_excel(EXCEL_PATH, sheet_name='Ingresos_Retiros')
        df_config = pd.read_excel(EXCEL_PATH, sheet_name='Configuracion')

        print(f"📊 Datos a migrar:")
        print(f"   Reportes: {len(df_reportes)}")
        print(f"   Incidencias: {len(df_incidencias)}")
        print(f"   Movimientos: {len(df_movimientos)}")
        print(f"   Configuracion: {len(df_config)}\n")

        # Mapeo de admin a cliente
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

        # 1. MIGRAR USUARIOS
        print("👥 Migrando usuarios...")
        unique_admins = df_reportes['Administrador'].dropna().unique()
        admin_user_map = {}
        password_hash = hash_password("Admin123!")

        for admin_name in unique_admins:
            admin_name = str(admin_name).strip()
            username = create_username(admin_name)
            email = create_email(admin_name)
            client_op = admin_client_map.get(admin_name, "General")

            # Verificar si existe
            cur.execute("SELECT id FROM reports.users WHERE username = %s", (username,))
            existing = cur.fetchone()

            if existing:
                admin_user_map[admin_name] = existing[0]
                print(f"   ✓ Usuario existente: {username}")
            else:
                user_id = str(uuid.uuid4())
                cur.execute("""
                    INSERT INTO reports.users
                    (id, username, email, password_hash, full_name, role,
                     administrator_name, client_operation, is_active, is_verified)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (user_id, username, email, password_hash, admin_name,
                      'operator', admin_name, client_op, True, False))

                admin_user_map[admin_name] = user_id
                stats['users_created'] += 1
                print(f"   + Creado: {username}")

        print(f"   Total usuarios nuevos: {stats['users_created']}\n")

        # 2. MIGRAR REPORTES
        print("📋 Migrando reportes...")
        report_id_map = {}

        for _, row in df_reportes.iterrows():
            try:
                admin_name = str(row['Administrador']).strip()
                user_id = admin_user_map.get(admin_name)

                if not user_id:
                    print(f"   ⚠️  Usuario no encontrado: {admin_name}")
                    continue

                report_id = str(uuid.uuid4())
                legacy_id = str(row.get('ID', ''))

                # Convertir fecha - usar Fecha_Creacion como report_date
                report_date = pd.to_datetime(row['Fecha_Creacion']).date() if not pd.isna(row.get('Fecha_Creacion')) else None
                if not report_date:
                    continue

                cur.execute("""
                    INSERT INTO reports.reports
                    (id, user_id, administrator, client_operation, daily_hours,
                     staff_personnel, base_personnel, relevant_facts, status,
                     report_date, legacy_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    report_id, user_id, admin_name,
                    str(row.get('Cliente_Operacion', '')).strip(),
                    float(row.get('Horas_Diarias', 0)),
                    int(row.get('Personal_Staff', 0)),
                    int(row.get('Personal_Base', 0)),
                    str(row.get('Hechos_Relevantes', '')),
                    'completed',
                    report_date,
                    legacy_id
                ))

                if legacy_id:
                    report_id_map[legacy_id] = report_id
                stats['reports_migrated'] += 1

            except Exception as e:
                print(f"   ❌ Error: {e}")

        print(f"   Total reportes: {stats['reports_migrated']}\n")

        # 3. MIGRAR INCIDENCIAS
        print("🚨 Migrando incidencias...")
        for _, row in df_incidencias.iterrows():
            try:
                legacy_report_id = str(row.get('ID_Reporte', ''))
                report_id = report_id_map.get(legacy_report_id)

                if not report_id:
                    continue

                end_date = pd.to_datetime(row.get('Fecha_Fin_Novedad')).date() if not pd.isna(row.get('Fecha_Fin_Novedad')) else None

                cur.execute("""
                    INSERT INTO reports.incidents
                    (id, report_id, incident_type, employee_name, end_date, notes)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    str(uuid.uuid4()),
                    report_id,
                    str(row.get('Tipo_Incidencia', '')),
                    str(row.get('Nombre_Empleado', '')),
                    end_date,
                    ''  # No hay columna Notas en el Excel
                ))

                stats['incidents_migrated'] += 1

            except Exception as e:
                print(f"   ❌ Error: {e}")

        print(f"   Total incidencias: {stats['incidents_migrated']}\n")

        # 4. MIGRAR MOVIMIENTOS
        print("👔 Migrando movimientos de personal...")
        for _, row in df_movimientos.iterrows():
            try:
                legacy_report_id = str(row.get('ID_Reporte', ''))
                report_id = report_id_map.get(legacy_report_id)

                if not report_id:
                    continue

                # Usar Fecha_Registro como effective_date
                effective_date = pd.to_datetime(row.get('Fecha_Registro')).date() if not pd.isna(row.get('Fecha_Registro')) else None

                cur.execute("""
                    INSERT INTO reports.movements
                    (id, report_id, employee_name, position, movement_type,
                     effective_date, notes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    str(uuid.uuid4()),
                    report_id,
                    str(row.get('Nombre_Empleado', '')),
                    str(row.get('Cargo', '')),
                    str(row.get('Estado', 'Ingreso')),
                    effective_date,
                    ''  # No hay columna Notas en el Excel
                ))

                stats['movements_migrated'] += 1

            except Exception as e:
                print(f"   ❌ Error: {e}")

        print(f"   Total movimientos: {stats['movements_migrated']}\n")

        # 5. MIGRAR CONFIGURACION
        print("⚙️  Migrando configuracion...")
        for _, row in df_config.iterrows():
            try:
                key = str(row.get('Clave', ''))
                if not key:
                    continue

                # Verificar si existe
                cur.execute("SELECT id FROM reports.system_config WHERE key = %s", (key,))
                if cur.fetchone():
                    continue

                cur.execute("""
                    INSERT INTO reports.system_config (id, key, value, description)
                    VALUES (%s, %s, %s, %s)
                """, (
                    str(uuid.uuid4()),
                    key,
                    str(row.get('Valor', '')),
                    str(row.get('Descripcion', ''))
                ))

                stats['configs_migrated'] += 1

            except Exception as e:
                print(f"   ❌ Error: {e}")

        print(f"   Total configs: {stats['configs_migrated']}\n")

        # COMMIT o ROLLBACK
        if DRY_RUN:
            conn.rollback()
            print("🔄 ROLLBACK - Ningun cambio guardado (dry-run)")
        else:
            conn.commit()
            print("✅ COMMIT - Cambios guardados exitosamente")

        # ESTADISTICAS FINALES
        print("\n" + "="*60)
        print("RESUMEN DE MIGRACION")
        print("="*60)
        print(f"✅ Usuarios creados:      {stats['users_created']}")
        print(f"✅ Reportes migrados:     {stats['reports_migrated']}")
        print(f"✅ Incidencias migradas:  {stats['incidents_migrated']}")
        print(f"✅ Movimientos migrados:  {stats['movements_migrated']}")
        print(f"✅ Configs migradas:      {stats['configs_migrated']}")
        print("="*60 + "\n")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ ERROR: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    migrate()
