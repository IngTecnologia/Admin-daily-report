"""
API principal para el sistema de reportes diarios
Endpoints segun especificaciones del README
"""
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
import logging
from contextlib import asynccontextmanager

from .config import settings
from .models import (
    DailyReportCreate, DailyReportResponse, APIResponse, ReportCreateResponse,
    ReportFilter, AnalyticsResponse, HealthCheck
)
from .excel_handler import excel_handler


# Configurar logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manejo del ciclo de vida de la aplicacion"""
    # Startup
    logger.info("Iniciando Admin Daily Report API")
    logger.info(f"Archivo Excel: {settings.excel_file_path}")
    
    # Verificar que el manejador de Excel funcione
    try:
        excel_handler._ensure_file_exists()
        logger.info("Sistema de Excel inicializado correctamente")
    except Exception as e:
        logger.error(f"Error inicializando Excel: {e}")
    
    yield
    
    # Shutdown
    logger.info("Cerrando Admin Daily Report API")


# Crear aplicacion FastAPI
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=settings.app_description,
    docs_url=settings.docs_url,
    redoc_url=settings.redoc_url,
    openapi_url=settings.openapi_url,
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=settings.cors_methods,
    allow_headers=settings.cors_headers,
)


# Handler para errores de validacion
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Error de validacion en {request.method} {request.url}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Error de validacion",
            "errors": exc.errors(),
            "body": exc.body
        }
    )


# Middleware para logging de requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url}")
    
    response = await call_next(request)
    
    # Log response
    process_time = (datetime.now() - start_time).total_seconds()
    logger.info(f"Response: {response.status_code} - {process_time:.3f}s")
    
    return response


# Funcion auxiliar para obtener informacion del cliente
def get_client_info(request: Request) -> Dict[str, str]:
    """Obtener informacion del cliente para auditoria"""
    return {
        "ip": request.client.host if request.client else "Unknown",
        "user_agent": request.headers.get("user-agent", "Unknown")
    }


# Health Check
@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    return HealthCheck(
        status="healthy",
        timestamp=datetime.now(),
        version=settings.app_version
    )


# ENDPOINTS PRINCIPALES segun especificaciones del README

@app.post(
    f"{settings.api_v1_prefix}/reportes",
    response_model=ReportCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nuevo reporte diario",
    description="Endpoint principal para crear reportes diarios de administradores"
)
async def create_daily_report(
    report: DailyReportCreate,
    request: Request
) -> ReportCreateResponse:
    """
    Crear un nuevo reporte diario
    
    - **administrador**: Administrador que reporta (de la lista predefinida)
    - **cliente_operacion**: Cliente/Operacion (de la lista predefinida)
    - **horas_diarias**: Horas trabajadas (1-24)
    - **personal_staff**: Cantidad de personal staff (e0)
    - **personal_base**: Cantidad de personal base (e0)
    - **incidencias**: Lista de incidencias (opcional)
    - **ingresos_retiros**: Lista de movimientos de personal (opcional)
    """
    try:
        # Obtener informacion del cliente
        client_info = get_client_info(request)
        
        # Validar limite de reportes por dia (regla de negocio)
        today = date.today()
        existing_reports = excel_handler.get_reports_by_date(today)
        admin_reports_today = [
            r for r in existing_reports 
            if r.get('Administrador') == report.administrador.value
        ]
        
        if len(admin_reports_today) >= settings.max_reportes_per_admin_per_day:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El administrador {report.administrador.value} ya ha enviado su reporte diario"
            )
        
        # Guardar reporte
        saved_report = excel_handler.save_report(report, client_info)
        
        logger.info(f"Reporte creado: {saved_report.id} por {report.administrador.value}")
        
        return ReportCreateResponse(
            success=True,
            message="Reporte creado exitosamente",
            data={
                "id": saved_report.id,
                "fecha_creacion": saved_report.fecha_creacion.isoformat()
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creando reporte: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al crear el reporte"
        )


# ENDPOINTS DEL AREA ADMIN

@app.get(
    f"{settings.api_v1_prefix}/admin/reportes",
    response_model=List[Dict[str, Any]],
    summary="Obtener lista de reportes (Admin)",
    description="Obtener lista filtrable de todos los reportes para el area admin"
)
async def get_reports(
    administrador: Optional[str] = None,
    cliente: Optional[str] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    page: int = 1,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """
    Obtener lista de reportes con filtros opcionales
    
    - **administrador**: Filtrar por administrador especifico
    - **cliente**: Filtrar por cliente/operacion
    - **fecha_inicio**: Fecha inicial del rango (YYYY-MM-DD)
    - **fecha_fin**: Fecha final del rango (YYYY-MM-DD)
    - **page**: Numero de pagina para paginacion
    - **limit**: Registros por pagina (max. 100)
    """
    try:
        # Validar parametros
        if limit > 100:
            limit = 100
        if page < 1:
            page = 1
        
        # Crear filtros
        filters = {}
        if administrador:
            filters['administrador'] = administrador
        if cliente:
            filters['cliente'] = cliente
        if fecha_inicio:
            filters['fecha_inicio'] = fecha_inicio
        if fecha_fin:
            filters['fecha_fin'] = fecha_fin
        
        # Obtener reportes
        all_reports = excel_handler.get_all_reports(filters)
        
        # Aplicar paginacion
        start_index = (page - 1) * limit
        end_index = start_index + limit
        paginated_reports = all_reports[start_index:end_index]
        
        logger.info(f"Reportes obtenidos: {len(paginated_reports)} de {len(all_reports)}")
        
        return paginated_reports
        
    except Exception as e:
        logger.error(f"Error obteniendo reportes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al obtener reportes"
        )


@app.get(
    f"{settings.api_v1_prefix}/admin/reportes/{{report_id}}",
    response_model=Dict[str, Any],
    summary="Obtener detalles de un reporte especifico",
    description="Obtener detalles completos de un reporte por su ID"
)
async def get_report_details(report_id: str) -> Dict[str, Any]:
    """
    Obtener detalles completos de un reporte especifico
    
    - **report_id**: ID unico del reporte (formato: RPT-YYYYMMDD-NNN)
    """
    try:
        all_reports = excel_handler.get_all_reports()
        report = next((r for r in all_reports if r.get('ID') == report_id), None)
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Reporte {report_id} no encontrado"
            )
        
        # TODO: Agregar detalles de incidencias y movimientos
        # Por ahora retornamos el reporte basico
        
        logger.info(f"Detalles de reporte obtenidos: {report_id}")
        return report
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo detalles del reporte {report_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al obtener detalles del reporte"
        )


@app.get(
    f"{settings.api_v1_prefix}/admin/analytics",
    response_model=AnalyticsResponse,
    summary="Obtener metricas para dashboard",
    description="Obtener metricas y estadisticas para el dashboard administrativo"
)
async def get_analytics() -> AnalyticsResponse:
    """
    Obtener metricas para el dashboard administrativo
    
    Retorna estadisticas como:
    - Total de reportes
    - Reportes del dia
    - Promedio de horas diarias
    - Total de incidencias del mes
    - Administradores activos
    - Datos para graficos
    """
    try:
        analytics_data = excel_handler.get_analytics_data()
        
        response = AnalyticsResponse(
            total_reportes=analytics_data["total_reportes"],
            reportes_hoy=analytics_data["reportes_hoy"],
            promedio_horas_diarias=analytics_data["promedio_horas_diarias"],
            total_incidencias_mes=analytics_data["total_incidencias_mes"],
            administradores_activos=analytics_data["administradores_activos"],
            graficos=analytics_data["graficos"]
        )
        
        logger.info("Analytics obtenidos exitosamente")
        return response
        
    except Exception as e:
        logger.error(f"Error obteniendo analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al obtener analytics"
        )


@app.get(
    f"{settings.api_v1_prefix}/admin/export",
    summary="Exportar datos filtrados",
    description="Exportar datos filtrados en Excel/CSV (placeholder)"
)
async def export_data(
    administrador: Optional[str] = None,
    cliente: Optional[str] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    formato: str = "excel"
):
    """
    Exportar datos filtrados
    
    TODO: Implementar exportacion real de archivos
    Por ahora retorna informacion sobre que se exportaria
    """
    try:
        # Por ahora, solo retornamos un placeholder
        filters = {
            "administrador": administrador,
            "cliente": cliente, 
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin,
            "formato": formato
        }
        
        # Obtener datos que se exportarian
        reports = excel_handler.get_all_reports(filters)
        
        return APIResponse(
            success=True,
            message=f"Se exportarian {len(reports)} reportes en formato {formato}",
            data={
                "cantidad_reportes": len(reports),
                "filtros_aplicados": filters,
                "nota": "Funcionalidad de exportacion en desarrollo"
            }
        )
        
    except Exception as e:
        logger.error(f"Error en exportacion: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor en exportacion"
        )


# Endpoint para obtener configuraciones/constantes
@app.get(
    f"{settings.api_v1_prefix}/config",
    summary="Obtener configuraciones del sistema",
    description="Obtener listas de administradores, operaciones, tipos de incidencias, etc."
)
async def get_system_config():
    """Obtener configuraciones y constantes del sistema"""
    try:
        from .config import ADMINISTRATORS, CLIENT_OPERATIONS, INCIDENT_TYPES, EMPLOYEE_STATUSES
        
        return APIResponse(
            success=True,
            message="Configuraciones obtenidas exitosamente",
            data={
                "administradores": ADMINISTRATORS,
                "operaciones": CLIENT_OPERATIONS,
                "tipos_incidencias": INCIDENT_TYPES,
                "estados_empleado": EMPLOYEE_STATUSES,
                "limites": {
                    "max_incidencias": settings.max_incidencias_per_report,
                    "max_movimientos": settings.max_movimientos_per_report,
                    "max_reportes_por_admin_por_dia": settings.max_reportes_per_admin_per_day
                }
            }
        )
        
    except Exception as e:
        logger.error(f"Error obteniendo configuraciones: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al obtener configuraciones"
        )


# Manejador global de excepciones
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Manejador global de excepciones no capturadas"""
    logger.error(f"Excepcion no manejada: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Error interno del servidor",
            "detail": "Ha ocurrido un error inesperado"
        }
    )


# Endpoint de informacion de la API
@app.get(
    "/",
    summary="Informacion de la API",
    description="Informacion basica sobre la API"
)
async def root():
    """Informacion basica de la API"""
    return APIResponse(
        success=True,
        message=f"API {settings.app_name} v{settings.app_version} funcionando correctamente",
        data={
            "version": settings.app_version,
            "docs_url": settings.docs_url,
            "admin_panel_url": "/admin",
            "endpoints_disponibles": {
                "POST /api/v1/reportes": "Crear nuevo reporte diario",
                "GET /api/v1/admin/reportes": "Obtener lista de reportes", 
                "GET /api/v1/admin/analytics": "Obtener metricas dashboard",
                "GET /api/v1/config": "Obtener configuraciones del sistema",
                "GET /health": "Health check"
            }
        }
    )