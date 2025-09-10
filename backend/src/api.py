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
from .email_service import email_service


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
        
        # Obtener reportes existentes del día (información para el frontend)
        today = date.today()
        existing_reports = excel_handler.get_reports_by_date(today)
        admin_reports_today = [
            r for r in existing_reports 
            if r.get('Administrador') == report.administrador.value
        ]
        
        # Guardar reporte
        saved_report = excel_handler.save_report(report, client_info)
        
        logger.info(f"Reporte creado: {saved_report.id} por {report.administrador.value}")
        
        # Preparar mensaje informativo
        message = "Reporte creado exitosamente"
        if len(admin_reports_today) > 0:
            message += f" (Reporte #{len(admin_reports_today) + 1} del día)"
        
        return ReportCreateResponse(
            success=True,
            message=message,
            data={
                "id": saved_report.id,
                "fecha_creacion": saved_report.fecha_creacion.isoformat(),
                "reportes_del_dia": len(admin_reports_today) + 1,
                "es_primer_reporte": len(admin_reports_today) == 0
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
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
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
            try:
                fecha_inicio_parsed = datetime.fromisoformat(fecha_inicio).date()
                filters['fecha_inicio'] = fecha_inicio_parsed
            except (ValueError, TypeError):
                logger.warning(f"Fecha inicio inválida: {fecha_inicio}")
        if fecha_fin:
            try:
                fecha_fin_parsed = datetime.fromisoformat(fecha_fin).date()
                filters['fecha_fin'] = fecha_fin_parsed
            except (ValueError, TypeError):
                logger.warning(f"Fecha fin inválida: {fecha_fin}")
        
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


# Endpoint para verificar reportes del día por administrador
@app.get(
    f"{settings.api_v1_prefix}/reportes/admin/{{admin_name}}/today",
    summary="Verificar reportes del día por administrador",
    description="Obtener información sobre reportes enviados hoy por un administrador específico"
)
async def check_admin_today_reports(admin_name: str):
    """Verificar reportes enviados hoy por un administrador específico"""
    try:
        today = date.today()
        existing_reports = excel_handler.get_reports_by_date(today)
        admin_reports_today = [
            r for r in existing_reports 
            if r.get('Administrador', '').lower() == admin_name.lower()
        ]
        
        return APIResponse(
            success=True,
            message=f"Información de reportes del día para {admin_name}",
            data={
                "administrador": admin_name,
                "fecha": today.isoformat(),
                "reportes_enviados": len(admin_reports_today),
                "ha_reportado": len(admin_reports_today) > 0,
                "reportes": [
                    {
                        "id": r.get('ID'),
                        "hora": r.get('Fecha_Creacion'),
                        "estado": r.get('Estado', 'Completado')
                    } for r in admin_reports_today
                ]
            }
        )
        
    except Exception as e:
        logger.error(f"Error verificando reportes del administrador {admin_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al verificar reportes"
        )


# Endpoint para eliminar un reporte específico (solo del mismo día)
@app.delete(
    f"{settings.api_v1_prefix}/reportes/{{report_id}}",
    summary="Eliminar un reporte específico",
    description="Eliminar un reporte del mismo día (solo permitido para reportes creados hoy)"
)
async def delete_report(report_id: str, request: Request):
    """Eliminar un reporte específico del mismo día"""
    try:
        # Obtener información del cliente para auditoría
        client_info = get_client_info(request)
        
        # Verificar que el reporte existe
        all_reports = excel_handler.get_all_reports()
        report_to_delete = next((r for r in all_reports if r.get('ID') == report_id), None)
        
        if not report_to_delete:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Reporte {report_id} no encontrado"
            )
        
        # Verificar que el reporte es del día actual
        report_date = report_to_delete.get('Fecha_Creacion')
        if isinstance(report_date, str):
            report_date = datetime.fromisoformat(report_date.replace('Z', '+00:00')).date()
        elif isinstance(report_date, datetime):
            report_date = report_date.date()
        
        today = date.today()
        if report_date != today:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Solo se pueden eliminar reportes del día actual. El reporte {report_id} es de {report_date}"
            )
        
        # Eliminar el reporte usando el excel_handler
        success = excel_handler.delete_report(report_id)
        
        if success:
            logger.info(f"Reporte eliminado: {report_id} por IP {client_info['ip']}")
            return APIResponse(
                success=True,
                message=f"Reporte {report_id} eliminado exitosamente",
                data={
                    "id_eliminado": report_id,
                    "fecha_eliminacion": datetime.now().isoformat()
                }
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error eliminando el reporte"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando reporte {report_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al eliminar el reporte"
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
                "POST /api/v1/notifications/test-email": "Probar conexion de email",
                "POST /api/v1/notifications/send-reminder/{admin}": "Enviar recordatorio",
                "POST /api/v1/notifications/send-bulk-reminders": "Recordatorios masivos",
                "GET /health": "Health check"
            }
        }
    )


# Endpoints de notificaciones por correo
@app.post(
    f"{settings.api_v1_prefix}/notifications/test-email",
    summary="Probar conexión de email",
    description="Probar la conexión SMTP del servicio de email"
)
async def test_email_connection():
    """Probar conexión de email"""
    try:
        success, message = email_service.test_connection()
        return APIResponse(
            success=success,
            message=message,
            data={"smtp_server": email_service.smtp_server}
        )
    except Exception as e:
        logger.error(f"Error probando conexión de email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno probando conexión de email"
        )


@app.post(
    f"{settings.api_v1_prefix}/notifications/send-reminder/{{admin_name}}",
    summary="Enviar recordatorio a administrador específico",
    description="Enviar recordatorio de reporte diario a un administrador específico"
)
async def send_admin_reminder(admin_name: str):
    """Enviar recordatorio a administrador específico"""
    try:
        # Obtener estado actual de reportes del administrador
        today = date.today()
        existing_reports = excel_handler.get_reports_by_date(today)
        admin_reports_today = [
            r for r in existing_reports 
            if r.get('Administrador', '').lower() == admin_name.lower()
        ]
        
        report_status = {
            "administrador": admin_name,
            "fecha": today.isoformat(),
            "reportes_enviados": len(admin_reports_today),
            "ha_reportado": len(admin_reports_today) > 0,
            "reportes": [
                {
                    "id": r.get('ID'),
                    "hora": r.get('Fecha_Creacion'),
                    "estado": r.get('Estado', 'Completado')
                } for r in admin_reports_today
            ]
        }
        
        # Enviar recordatorio
        success, message = email_service.send_daily_reminder(admin_name, report_status)
        
        if success:
            logger.info(f"Recordatorio enviado a {admin_name}")
            return APIResponse(
                success=True,
                message=message,
                data={
                    "administrador": admin_name,
                    "estado_reporte": report_status
                }
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enviando recordatorio a {admin_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno enviando recordatorio"
        )


@app.post(
    f"{settings.api_v1_prefix}/notifications/send-bulk-reminders",
    summary="Enviar recordatorios masivos",
    description="Enviar recordatorios a todos los administradores que no han reportado"
)
async def send_bulk_reminders():
    """Enviar recordatorios masivos a administradores pendientes"""
    try:
        today = date.today()
        existing_reports = excel_handler.get_reports_by_date(today)
        
        # Preparar estados para cada administrador
        admin_statuses = {}
        
        # Obtener lista de todos los administradores
        all_admins = list(email_service.admin_emails.keys())
        
        for admin_name in all_admins:
            admin_reports_today = [
                r for r in existing_reports 
                if r.get('Administrador', '').lower() == admin_name.lower()
            ]
            
            admin_statuses[admin_name] = {
                "administrador": admin_name,
                "fecha": today.isoformat(),
                "reportes_enviados": len(admin_reports_today),
                "ha_reportado": len(admin_reports_today) > 0,
                "reportes": [
                    {
                        "id": r.get('ID'),
                        "hora": r.get('Fecha_Creacion'),
                        "estado": r.get('Estado', 'Completado')
                    } for r in admin_reports_today
                ]
            }
        
        # Enviar solo a los que no han reportado (o enviar confirmación a los que sí)
        results = email_service.send_bulk_reminders(admin_statuses)
        
        successful_sends = [admin for admin, (success, _) in results.items() if success]
        failed_sends = [admin for admin, (success, _) in results.items() if not success]
        
        logger.info(f"Recordatorios enviados: {len(successful_sends)} exitosos, {len(failed_sends)} fallidos")
        
        return APIResponse(
            success=True,
            message=f"Proceso completado: {len(successful_sends)} exitosos, {len(failed_sends)} fallidos",
            data={
                "total_enviados": len(successful_sends),
                "total_fallidos": len(failed_sends),
                "resultados": results,
                "administradores_exitosos": successful_sends,
                "administradores_fallidos": failed_sends
            }
        )
        
    except Exception as e:
        logger.error(f"Error enviando recordatorios masivos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno enviando recordatorios masivos"
        )