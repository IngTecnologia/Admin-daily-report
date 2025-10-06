"""
Script para migrar usuarios hardcodeados a PostgreSQL con contraseñas seguras
"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent / "src"))

from database.connection import get_db, init_db
from database.models import User
from auth.jwt_handler import jwt_handler
from security.encryption import field_encryptor
from loguru import logger

# Usuarios actuales del sistema con sus contraseñas en texto plano
# DESPUÉS DE MIGRAR, ESTE ARCHIVO DEBE SER ELIMINADO
USERS_TO_MIGRATE = [
    # Usuarios operadores (solo formulario)
    {
        "username": "administrador@inemec-pyc.com",
        "password": "admonpyc2025",
        "full_name": "Adriana Robayo",
        "role": "operator",
        "administrator_name": "Adriana Robayo",
        "client_operation": "Consorcio P&C"
    },
    {
        "username": "admon.vrc@inemec.com",
        "password": "admonvrc2025",
        "full_name": "Angela Ramirez",
        "role": "operator",
        "administrator_name": "Angela Ramirez",
        "client_operation": "Confiabilidad VRC"
    },
    {
        "username": "asistente.admonrh@inemec.com",
        "password": "admonbog2025",
        "full_name": "Floribe Correa",
        "role": "operator",
        "administrator_name": "Floribe Correa",
        "client_operation": "Administrativo Bogota"
    },
    {
        "username": "administradora.sc@inemec.com",
        "password": "admoncedco2025",
        "full_name": "Julieth Rincon",
        "role": "operator",
        "administrator_name": "Julieth Rincon",
        "client_operation": "Sierracol CEDCO"
    },
    {
        "username": "admincus.ggs@inemec.com",
        "password": "admoncus2025",
        "full_name": "Eddinson Javier Martinez",
        "role": "operator",
        "administrator_name": "Eddinson Javier Martinez",
        "client_operation": "VPI CUSIANA"
    },
    {
        "username": "adminflo.ggs@inemec.com",
        "password": "admonflo2025",
        "full_name": "Jorge Iván Alvarado Celis",
        "role": "operator",
        "administrator_name": "Jorge Iván Alvarado Celis",
        "client_operation": "VPI FLOREÑA"
    },
    {
        "username": "admon.sierracolclm@inemec.com",
        "password": "admonclm2025",
        "full_name": "Kenia Sanchez",
        "role": "operator",
        "administrator_name": "Kenia Sanchez",
        "client_operation": "Sierracol CLM"
    },
    {
        "username": "contadora@inemec.com",
        "password": "admonbrc2025",
        "full_name": "Liliana Romero",
        "role": "operator",
        "administrator_name": "Liliana Romero",
        "client_operation": "Administrativo Barranca"
    },
    {
        "username": "administrador.ggs@inemec.com",
        "password": "admonggs2025",
        "full_name": "Marcela Cusba Gomez",
        "role": "operator",
        "administrator_name": "Marcela Cusba Gomez",
        "client_operation": "VPI ADMON"
    },
    {
        "username": "admonjr.sierracolcrm@inemec.com",
        "password": "admoncrc2025",
        "full_name": "Mirledys Garcia San Juan",
        "role": "operator",
        "administrator_name": "Mirledys Garcia San Juan",
        "client_operation": "Sierracol CRC"
    },
    {
        "username": "admincup.ggs@inemec.com",
        "password": "admoncup2025",
        "full_name": "Yolima Arenas Zarate",
        "role": "operator",
        "administrator_name": "Yolima Arenas Zarate",
        "client_operation": "VPI CUPIAGUA"
    },
    # Usuarios administradores (formulario + panel admin)
    {
        "username": "ing.tecnologia2@inemec.com",
        "password": "protec2025",
        "full_name": "Jesús David Cotes",
        "role": "admin",
        "administrator_name": None,
        "client_operation": "Nuevas Tecnologías"
    },
    {
        "username": "ing.tecnologia1@inemec.com",
        "password": "protec2025",
        "full_name": "Andrés Pérez",
        "role": "admin",
        "administrator_name": None,
        "client_operation": "Nuevas Tecnologías"
    },
    {
        "username": "pro.automatizacion@inemec.com",
        "password": "proti2025",
        "full_name": "Andrés Muñoz",
        "role": "admin",
        "administrator_name": None,
        "client_operation": "TI"
    },
    {
        "username": "gte.administrativo@inemec.com",
        "password": "gteadmon2025",
        "full_name": "Hugo Rodríguez",
        "role": "admin",
        "administrator_name": None,
        "client_operation": "Gerencia Administrativa"
    }
]

def migrate_users():
    """Migrar usuarios con contraseñas hasheadas a PostgreSQL"""

    # Inicializar base de datos
    init_db()

    # Obtener sesión
    db = next(get_db())

    try:
        migrated = 0
        skipped = 0
        errors = 0

        for user_data in USERS_TO_MIGRATE:
            try:
                # Verificar si el usuario ya existe
                existing_user = db.query(User).filter_by(
                    username=user_data["username"]
                ).first()

                if existing_user:
                    logger.info(f"Usuario ya existe: {user_data['username']}")
                    skipped += 1
                    continue

                # Crear nuevo usuario con contraseña hasheada
                new_user = User(
                    username=user_data["username"],
                    email=user_data["username"],  # Usando username como email
                    password_hash=jwt_handler.get_password_hash(user_data["password"]),
                    full_name=user_data["full_name"],
                    role=user_data["role"],
                    administrator_name=user_data["administrator_name"],
                    client_operation=user_data["client_operation"],
                    is_active=True,
                    is_verified=True  # Pre-verificados
                )

                # Encriptar campos sensibles
                new_user = field_encryptor.encrypt_model_fields(new_user, "users")

                db.add(new_user)
                db.commit()

                logger.info(f"✅ Usuario migrado: {user_data['full_name']} ({user_data['username']})")
                migrated += 1

            except Exception as e:
                logger.error(f"❌ Error migrando usuario {user_data['username']}: {e}")
                errors += 1
                db.rollback()

        # Resumen
        print("\n" + "="*50)
        print("MIGRACIÓN DE USUARIOS COMPLETADA")
        print("="*50)
        print(f"✅ Usuarios migrados: {migrated}")
        print(f"⏭️  Usuarios omitidos (ya existían): {skipped}")
        print(f"❌ Errores: {errors}")
        print("="*50)

        if migrated > 0:
            print("\n⚠️  IMPORTANTE:")
            print("1. Las contraseñas originales han sido hasheadas")
            print("2. Los usuarios pueden iniciar sesión con sus credenciales actuales")
            print("3. Se recomienda forzar cambio de contraseña en primer login")
            print("4. Eliminar el archivo frontend/src/config/users.js")

    finally:
        db.close()

if __name__ == "__main__":
    migrate_users()