"""
SQLAlchemy models for PostgreSQL database
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, Boolean, Date, Enum, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime

from .connection import Base

# Enums para los campos con valores fijos
class UserRole(str, enum.Enum):
    """Roles de usuario en el sistema"""
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    OPERATOR = "operator"
    VIEWER = "viewer"

class IncidentType(str, enum.Enum):
    """Tipos de incidencias válidos"""
    INCAPACIDAD_COMUN = "Incapacidad Medica Por Enfermedad Comun"
    INCAPACIDAD_LABORAL = "Incapacidad Medica por Enfermedad Laboral"
    PERMISO_CITA = "Permiso por Cita Medica"
    LICENCIA_MATERNIDAD = "Licencia de Maternidad"
    LICENCIA_PATERNIDAD = "Licencia de paternidad"
    PERMISO_LUTO = "Permiso por Luto"
    PERMISO_CALAMIDAD = "Permiso por Calamidad Domestica"
    VACACIONES = "Vacaciones"
    COMPENSATORIOS = "Compensatorios"
    DIA_FAMILIA = "Dia de la Familia"
    SUSPENSIONES = "Suspensiones de contrato"
    PERMISOS_NO_REMUNERADOS = "Permisos no remunerados"

class MovementType(str, enum.Enum):
    """Tipos de movimiento de personal"""
    INGRESO = "Ingreso"
    RETIRO = "Retiro"

class ReportStatus(str, enum.Enum):
    """Estados posibles de un reporte"""
    DRAFT = "draft"
    COMPLETED = "completed"
    REVIEWED = "reviewed"
    ARCHIVED = "archived"

# Modelos de la base de datos
class User(Base):
    """Modelo de usuario del sistema"""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.OPERATOR)
    administrator_name = Column(String(255))  # Nombre como administrador en reportes
    client_operation = Column(String(255))  # Operación/cliente asignado
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(username='{self.username}', email='{self.email}', role='{self.role}')>"

class Report(Base):
    """Modelo de reporte diario"""
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    legacy_id = Column(String(100), unique=True, index=True)  # Para mantener IDs del sistema anterior
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))

    # Información del reporte
    administrator = Column(String(255), nullable=False, index=True)
    client_operation = Column(String(255), nullable=False, index=True)
    daily_hours = Column(Float, nullable=False)
    staff_personnel = Column(Integer, nullable=False)
    base_personnel = Column(Integer, nullable=False)
    relevant_facts = Column(Text)
    status = Column(Enum(ReportStatus), default=ReportStatus.COMPLETED)

    # Metadatos
    report_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    reviewed_at = Column(DateTime(timezone=True))
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))

    # IP y user agent para auditoría
    client_ip = Column(String(45))  # IPv6 max length
    user_agent = Column(String(500))

    # Relaciones
    user = relationship("User", back_populates="reports", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    incidents = relationship("Incident", back_populates="report", cascade="all, delete-orphan")
    movements = relationship("Movement", back_populates="report", cascade="all, delete-orphan")

    # Índices compuestos para búsquedas comunes
    __table_args__ = (
        Index('idx_report_date_admin', 'report_date', 'administrator'),
        Index('idx_report_date_client', 'report_date', 'client_operation'),
        Index('idx_report_status_date', 'status', 'report_date'),
    )

    def __repr__(self):
        return f"<Report(id='{self.id}', admin='{self.administrator}', date='{self.report_date}')>"

class Incident(Base):
    """Modelo de incidencia de personal"""
    __tablename__ = "incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)

    # Información de la incidencia
    incident_type = Column(Enum(IncidentType), nullable=False)
    employee_name = Column(String(255), nullable=False, index=True)
    end_date = Column(Date, nullable=False)
    notes = Column(Text)

    # Metadatos
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    report = relationship("Report", back_populates="incidents")

    # Índices para búsquedas
    __table_args__ = (
        Index('idx_incident_type_date', 'incident_type', 'end_date'),
        Index('idx_incident_employee', 'employee_name'),
    )

    def __repr__(self):
        return f"<Incident(type='{self.incident_type}', employee='{self.employee_name}')>"

class Movement(Base):
    """Modelo de movimiento de personal (ingresos/retiros)"""
    __tablename__ = "movements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)

    # Información del movimiento
    employee_name = Column(String(255), nullable=False, index=True)
    position = Column(String(255), nullable=False)
    movement_type = Column(Enum(MovementType), nullable=False, index=True)
    effective_date = Column(Date)
    notes = Column(Text)

    # Metadatos
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    report = relationship("Report", back_populates="movements")

    # Índices para búsquedas
    __table_args__ = (
        Index('idx_movement_type_date', 'movement_type', 'effective_date'),
        Index('idx_movement_employee', 'employee_name'),
    )

    def __repr__(self):
        return f"<Movement(type='{self.movement_type}', employee='{self.employee_name}', position='{self.position}')>"

class AuditLog(Base):
    """Modelo para auditoría de acciones en el sistema"""
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))

    # Información de la acción
    action = Column(String(100), nullable=False, index=True)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    resource_type = Column(String(100), index=True)  # report, user, incident, etc.
    resource_id = Column(String(100))  # ID del recurso afectado
    details = Column(Text)  # JSON con detalles adicionales

    # Información del cliente
    client_ip = Column(String(45))
    user_agent = Column(String(500))

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relaciones
    user = relationship("User", back_populates="audit_logs")

    # Índices para búsquedas
    __table_args__ = (
        Index('idx_audit_user_action', 'user_id', 'action'),
        Index('idx_audit_resource', 'resource_type', 'resource_id'),
        Index('idx_audit_date', 'created_at'),
    )

    def __repr__(self):
        return f"<AuditLog(action='{self.action}', resource='{self.resource_type}', user_id='{self.user_id}')>"

class SystemConfig(Base):
    """Modelo para configuración del sistema"""
    __tablename__ = "system_config"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<SystemConfig(key='{self.key}', value='{self.value}')>"