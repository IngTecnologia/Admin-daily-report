"""
Modelos Pydantic para el sistema de reportes diarios
Basado en las especificaciones del README.md
"""
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field, validator
from enum import Enum


class AdministratorEnum(str, Enum):
    """Administradores válidos según especificaciones"""
    ADRIANA_ROBAYO = "Adriana Robayo"
    ANGELA_RAMIREZ = "Angela Ramirez"
    FLORIBE_CORREA = "Floribe Correa"
    JULIETH_RINCON = "Julieth Rincon"
    EDDINSON_MARTINEZ = "Eddinson Javier Martinez"
    KELLIS_MORQUERA = "Kellis Minosca Morquera"
    KENIA_SANCHEZ = "Kenia Sanchez"
    LILIANA_ROMERO = "Liliana Romero"
    MARCELA_CUSBA = "Marcela Cusba Gomez"
    MIRLEDYS_GARCIA = "Mirledys García San Juan"
    YOLIMA_ARENAS = "Yolima Arenas Zarate"


class ClientOperationEnum(str, Enum):
    """Clientes/Operaciones válidos según especificaciones"""
    ADMIN_BARRANCA = "Administrativo Barranca"
    ADMIN_BOGOTA = "Administrativo Bogota"
    CEDCO = "CEDCO"
    PAREX = "PAREX"
    VRC = "VRC"
    SIERRACOL = "SIERRACOL"
    VPI_ADMON = "VPI ADMON"
    VPI_CUSIANA = "VPI CUSIANA"
    VPI_FLORENA = "VPI FLOREÑA"
    VPI_CUPIAGUA = "VPI CUPIAGUA"


class IncidentTypeEnum(str, Enum):
    """Tipos de incidencias válidos según especificaciones"""
    INCAPACIDAD_COMUN = "Incapacidad Médica Por Enfermedad Común"
    INCAPACIDAD_LABORAL = "Incapacidad Médica por Enfermedad Laboral"
    PERMISO_CITA = "Permiso por Cita Médica"
    LICENCIA_MATERNIDAD = "Licencia de Maternidad"
    LICENCIA_PATERNIDAD = "Licencia de paternidad"
    PERMISO_LUTO = "Permiso por Luto"
    PERMISO_CALAMIDAD = "Permiso por Calamidad Doméstica"
    VACACIONES = "Vacaciones"
    COMPENSATORIOS = "Compensatorios"
    DIA_FAMILIA = "Día de la Familia"
    SUSPENSIONES = "Suspensiones de contrato"
    PERMISOS_NO_REMUNERADOS = "Permisos no remunerados"


class EmployeeStatusEnum(str, Enum):
    """Estados de empleado para movimientos"""
    INGRESO = "Ingreso"
    RETIRO = "Retiro"


# Modelos para incidencias
class IncidentCreate(BaseModel):
    """Modelo para crear una incidencia"""
    tipo: IncidentTypeEnum = Field(..., description="Tipo de incidencia")
    nombre_empleado: str = Field(
        ..., 
        min_length=3, 
        max_length=100, 
        description="Nombre completo del empleado"
    )
    fecha_fin: date = Field(..., description="Fecha de fin de la novedad")

    @validator('fecha_fin')
    def validate_fecha_fin(cls, v):
        """Validar que la fecha no sea anterior a hoy"""
        if v < date.today():
            raise ValueError('La fecha de fin no puede ser anterior a hoy')
        return v

    @validator('nombre_empleado')
    def validate_nombre_empleado(cls, v):
        """Validar formato del nombre del empleado"""
        if not v.strip():
            raise ValueError('El nombre del empleado no puede estar vacío')
        if len(v.strip()) < 3:
            raise ValueError('El nombre debe tener al menos 3 caracteres')
        return v.strip().title()


class IncidentResponse(IncidentCreate):
    """Modelo de respuesta para incidencias"""
    id: Optional[int] = None
    fecha_registro: Optional[datetime] = None


# Modelos para movimientos de personal
class MovementCreate(BaseModel):
    """Modelo para crear un movimiento de personal"""
    nombre_empleado: str = Field(
        ..., 
        min_length=3, 
        max_length=100, 
        description="Nombre completo del empleado"
    )
    cargo: str = Field(
        ..., 
        min_length=2, 
        max_length=50, 
        description="Cargo del empleado"
    )
    estado: EmployeeStatusEnum = Field(..., description="Estado: Ingreso o Retiro")

    @validator('nombre_empleado')
    def validate_nombre_empleado(cls, v):
        """Validar formato del nombre del empleado"""
        if not v.strip():
            raise ValueError('El nombre del empleado no puede estar vacío')
        return v.strip().title()

    @validator('cargo')
    def validate_cargo(cls, v):
        """Validar formato del cargo"""
        if not v.strip():
            raise ValueError('El cargo no puede estar vacío')
        return v.strip().title()


class MovementResponse(MovementCreate):
    """Modelo de respuesta para movimientos"""
    id: Optional[int] = None
    fecha_registro: Optional[datetime] = None


# Modelo principal del reporte
class DailyReportCreate(BaseModel):
    """Modelo para crear un reporte diario"""
    administrador: AdministratorEnum = Field(..., description="Administrador que reporta")
    cliente_operacion: ClientOperationEnum = Field(..., description="Cliente/Operación")
    horas_diarias: int = Field(
        ..., 
        ge=1, 
        le=24, 
        description="Horas trabajadas en el día (1-24)"
    )
    personal_staff: int = Field(
        ..., 
        ge=0, 
        description="Cantidad de personal staff"
    )
    personal_base: int = Field(
        ..., 
        ge=0, 
        description="Cantidad de personal base"
    )
    incidencias: List[IncidentCreate] = Field(
        default=[], 
        description="Lista de incidencias del personal"
    )
    ingresos_retiros: List[MovementCreate] = Field(
        default=[], 
        description="Lista de ingresos y retiros"
    )

    @validator('incidencias')
    def validate_incidencias(cls, v):
        """Validar límite máximo de incidencias"""
        if len(v) > 50:
            raise ValueError('Máximo 50 incidencias permitidas')
        return v

    @validator('ingresos_retiros')
    def validate_ingresos_retiros(cls, v):
        """Validar límite máximo de movimientos"""
        if len(v) > 50:
            raise ValueError('Máximo 50 movimientos permitidos')
        return v


class DailyReportResponse(BaseModel):
    """Modelo de respuesta para reportes diarios"""
    id: str = Field(..., description="ID único del reporte")
    fecha_creacion: datetime = Field(..., description="Fecha y hora de creación")
    administrador: str
    cliente_operacion: str
    horas_diarias: int
    personal_staff: int
    personal_base: int
    cantidad_incidencias: int = Field(..., description="Número total de incidencias")
    cantidad_ingresos_retiros: int = Field(..., description="Número total de movimientos")
    estado: str = Field(default="Completado", description="Estado del reporte")
    incidencias: List[IncidentResponse] = Field(default=[])
    ingresos_retiros: List[MovementResponse] = Field(default=[])


# Modelos para respuestas de API
class APIResponse(BaseModel):
    """Respuesta estándar de la API"""
    success: bool = Field(..., description="Indica si la operación fue exitosa")
    message: str = Field(..., description="Mensaje descriptivo")
    data: Optional[dict] = Field(None, description="Datos de la respuesta")


class ReportCreateResponse(APIResponse):
    """Respuesta específica para creación de reportes"""
    data: Optional[dict] = Field(
        None, 
        description="Contiene id y fecha_creacion del reporte creado"
    )


# Modelos para filtros y búsquedas (Admin)
class ReportFilter(BaseModel):
    """Filtros para búsqueda de reportes"""
    administrador: Optional[str] = None
    cliente: Optional[str] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)


class AnalyticsResponse(BaseModel):
    """Respuesta para analytics del dashboard"""
    total_reportes: int
    reportes_hoy: int
    promedio_horas_diarias: float
    total_incidencias_mes: int
    administradores_activos: int
    graficos: dict = Field(default={})


# Modelos para configuración
class SystemConfig(BaseModel):
    """Configuración del sistema"""
    max_reportes_por_dia: int = Field(default=10)
    max_incidencias_por_reporte: int = Field(default=50)
    max_movimientos_por_reporte: int = Field(default=50)
    administradores_activos: List[str] = Field(default=[])
    operaciones_activas: List[str] = Field(default=[])


# Modelo para health check
class HealthCheck(BaseModel):
    """Modelo para health check"""
    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.now)
    version: str = "1.0.0"