"""
Database connection configuration for PostgreSQL
"""
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
import os
from typing import Generator
from loguru import logger

# Construir URL de base de datos desde variables de entorno
def get_database_url() -> str:
    """Construir URL de conexión a PostgreSQL desde variables de entorno"""

    # Intentar obtener DATABASE_URL directamente (para Heroku, Railway, etc)
    database_url = os.getenv("DATABASE_URL")

    if database_url:
        # Algunos servicios usan postgres:// en lugar de postgresql://
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        return database_url

    # Construir URL desde componentes individuales
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "postgres")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "reportes_diarios")

    return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

# Configuración de la base de datos
DATABASE_URL = get_database_url()

# Configuración del engine según el entorno
if os.getenv("NODE_ENV") == "production":
    # En producción, usar pool de conexiones
    engine = create_engine(
        DATABASE_URL,
        pool_size=20,
        max_overflow=40,
        pool_pre_ping=True,  # Verificar conexiones antes de usar
        echo=False  # No mostrar SQL en logs
    )
else:
    # En desarrollo, mostrar SQL y usar pool más pequeño
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        echo=True  # Mostrar SQL en consola
    )

# Configurar eventos para logging
@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    """Log cuando se establece una conexión"""
    logger.debug("Database connection established")

@event.listens_for(engine, "close")
def receive_close(dbapi_conn, connection_record):
    """Log cuando se cierra una conexión"""
    logger.debug("Database connection closed")

# Crear SessionLocal class
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base para los modelos
Base = declarative_base()

# Dependency para obtener sesión de base de datos
def get_db() -> Generator[Session, None, None]:
    """
    Dependency de FastAPI para obtener sesión de base de datos

    Yields:
        Session: Sesión de SQLAlchemy
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Funciones auxiliares
def init_db():
    """
    Inicializar base de datos creando todas las tablas

    NOTA: En producción usar Alembic para migraciones
    """
    try:
        # Importar todos los modelos para que Base los conozca
        from .models import User, Report, Incident, Movement  # noqa

        # Crear todas las tablas
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")

    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

def check_db_connection() -> bool:
    """
    Verificar que la conexión a la base de datos funcione

    Returns:
        bool: True si la conexión es exitosa
    """
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        logger.info("Database connection successful")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        return False

def get_db_stats() -> dict:
    """
    Obtener estadísticas de la base de datos

    Returns:
        dict: Estadísticas del pool de conexiones
    """
    pool = engine.pool
    return {
        "size": pool.size(),
        "checked_in": pool.checkedin(),
        "overflow": pool.overflow(),
        "total": pool.size() + pool.overflow()
    }