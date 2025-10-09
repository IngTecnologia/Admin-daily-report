"""
Configuracion del sistema Admin Daily Report para Cloudflare Tunnel
"""
import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuracion principal del sistema"""
    
    # Informacion de la aplicacion
    app_name: str = "Admin Daily Report API"
    app_version: str = "1.0.0"
    app_description: str = "API para sistema de reportes diarios de administradores"
    
    # Configuracion del servidor
    host: str = "0.0.0.0"
    port: int = 8001
    debug: bool = False
    reload: bool = False
    
    # Configuracion de CORS para Cloudflare Tunnel
    cors_origins: List[str] = [
        # Dominios del túnel de Cloudflare
        "https://reportediario2.inemec.com",
        "https://api.reportediario.inemec.com",
        # Para desarrollo local
        "http://localhost:3000",
        "http://localhost:5173",  # Vite dev server
        "http://localhost:4501",  # Frontend local
        "http://localhost:8001",  # Backend local
        # Variaciones para testing
        "http://frontend:80",     # Docker internal
        "http://backend:8001",    # Docker internal
        # Cloudflare tunnel internals
        "https://*.cfargotunnel.com",
        "https://*.trycloudflare.com"
    ]
    cors_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    cors_headers: List[str] = ["*"]
    
    # Rutas de archivos
    base_dir: Path = Path(__file__).parent.parent
    data_dir: Path = base_dir / "data"
    logs_dir: Path = base_dir / "logs"
    
    # Configuracion de Excel
    excel_file_name: str = "reportes_diarios.xlsx"
    excel_file_path: Path = data_dir / excel_file_name
    
    # Configuracion de hojas Excel segun README
    excel_sheets: dict = {
        "reportes": "Reportes",
        "incidencias": "Incidencias", 
        "ingresos_retiros": "Ingresos_Retiros",
        "configuracion": "Configuracion"
    }
    
    # Limites del sistema
    max_reportes_per_admin_per_day: int = 1
    max_incidencias_per_report: int = 50
    max_movimientos_per_report: int = 50
    max_file_retention_days: int = 365
    
    # Rate limiting
    rate_limit_per_minute: int = 60
    rate_limit_per_hour: int = 1000
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}"
    log_file: str = "admin_daily_report.log"
    
    # Timezone
    timezone: str = "America/Bogota"
    
    # Validaciones de negocio
    validate_future_dates: bool = True
    max_future_months: int = 12
    
    # Backup y seguridad
    create_backups: bool = True
    backup_frequency_hours: int = 24
    backup_retention_days: int = 30
    
    # API Configuration
    api_v1_prefix: str = "/api/v1"
    docs_url: str = "/docs"
    redoc_url: str = "/redoc"
    openapi_url: str = "/openapi.json"
    
    # Configuración específica para Cloudflare Tunnel
    tunnel_mode: bool = True
    frontend_domain: str = "reportediario2.inemec.com"
    api_domain: str = "api.reportediario.inemec.com"
    use_https: bool = True
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Crear directorios si no existen
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        
        # Agregar CORS dinámicamente desde variables de entorno si están definidas
        env_cors = os.getenv('CORS_ORIGINS')
        if env_cors:
            try:
                import json
                additional_origins = json.loads(env_cors)
                self.cors_origins.extend(additional_origins)
                # Remover duplicados manteniendo orden
                self.cors_origins = list(dict.fromkeys(self.cors_origins))
            except (json.JSONDecodeError, TypeError):
                # Si no es JSON válido, intentar como string separado por comas
                additional_origins = [origin.strip() for origin in env_cors.split(',')]
                self.cors_origins.extend(additional_origins)
                self.cors_origins = list(dict.fromkeys(self.cors_origins))


# Configuración de constantes según el README
ADMINISTRATORS = [
    "Adriana Robayo",
    "Angela Ramirez",
    "Floribe Correa",
    "Julieth Rincon",
    "Eddinson Javier Martinez",
    "Jorge Iván Alvarado Celis",
    "Kellis Minosca Morquera",
    "Kenia Sanchez",
    "Liliana Romero",
    "Marcela Cusba Gomez",
    "Mirledys Garcia San Juan",
    "Yolima Arenas Zarate"
]

CLIENT_OPERATIONS = [
    "Administración Barranca",
    "Administrativo Barranca",
    "Administración Bogotá",
    "Administrativo Bogota",
    "Cedco",
    "CEDCO",
    "Consorcio P&C",
    "Confiabilidad VRC",
    "General",
    "Gerencia Administrativa",
    "Nuevas Tecnologías",
    "Parex Quimico",
    "PAREX",
    "Sierracol Caño limón",
    "Sierracol Caricare",
    "Sierracol CEDCO",
    "Sierracol CLM",
    "Sierracol CRC",
    "Sierracol Telecomunicaciones",
    "SIERRACOL",
    "TI",
    "VPI ADMON",
    "VPI CUPIAGUA",
    "VPI CUSIANA",
    "VPI FLORENA",
    "VPI Mayor",
    "VPI transversales",
    "VRC"
]

INCIDENT_TYPES = [
    "Incapacidad Medica Por Enfermedad Comun",
    "Incapacidad Medica por Enfermedad Laboral",
    "Permiso por Cita Medica",
    "Licencia de Maternidad",
    "Licencia de paternidad",
    "Permiso por Luto",
    "Permiso por Calamidad Domestica",
    "Vacaciones",
    "Compensatorios",
    "Dia de la Familia",
    "Permiso Remunerado",
    "Suspensiones de contrato",
    "Permisos no remunerados"
]

EMPLOYEE_STATUSES = ["Ingreso", "Retiro"]

# Estructura de la base de datos Excel segun README
EXCEL_SCHEMA = {
    "reportes": {
        "columns": [
            "ID", "Fecha_Creacion", "Administrador", "Cliente_Operacion",
            "Horas_Diarias", "Personal_Staff", "Personal_Base", 
            "Cantidad_Incidencias", "Cantidad_Ingresos_Retiros",
            "Hechos_Relevantes", "Estado", "IP_Origen", "User_Agent"
        ],
        "types": {
            "ID": "string",
            "Fecha_Creacion": "datetime",
            "Administrador": "string",
            "Cliente_Operacion": "string", 
            "Horas_Diarias": "integer",
            "Personal_Staff": "integer",
            "Personal_Base": "integer",
            "Cantidad_Incidencias": "integer",
            "Cantidad_Ingresos_Retiros": "integer",
            "Hechos_Relevantes": "string",
            "Estado": "string",
            "IP_Origen": "string",
            "User_Agent": "string"
        }
    },
    "incidencias": {
        "columns": [
            "ID_Reporte", "Numero_Incidencia", "Tipo_Incidencia",
            "Nombre_Empleado", "Fecha_Fin_Novedad", "Fecha_Registro"
        ],
        "types": {
            "ID_Reporte": "string",
            "Numero_Incidencia": "integer",
            "Tipo_Incidencia": "string",
            "Nombre_Empleado": "string",
            "Fecha_Fin_Novedad": "date",
            "Fecha_Registro": "datetime"
        }
    },
    "ingresos_retiros": {
        "columns": [
            "ID_Reporte", "Numero_Movimiento", "Nombre_Empleado",
            "Cargo", "Estado", "Fecha_Registro"
        ],
        "types": {
            "ID_Reporte": "string",
            "Numero_Movimiento": "integer", 
            "Nombre_Empleado": "string",
            "Cargo": "string",
            "Estado": "string",
            "Fecha_Registro": "datetime"
        }
    },
    "configuracion": {
        "columns": [
            "Clave", "Valor", "Descripcion", "Fecha_Modificacion"
        ],
        "types": {
            "Clave": "string",
            "Valor": "string",
            "Descripcion": "string",
            "Fecha_Modificacion": "datetime"
        }
    }
}

# Instancia global de configuracion
settings = Settings()