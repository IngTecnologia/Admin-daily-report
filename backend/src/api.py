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
import pytz

from .config import settings
from .models import (
    DailyReportCreate, DailyReportUpdate, DailyReportResponse, APIResponse, ReportCreateResponse,
    ReportFilter, AnalyticsResponse, HealthCheck, DailyGeneralOperationsResponse,
    DailyDetailedOperationsResponse, AccumulatedGeneralOperationsResponse, AccumulatedDetailedOperationsResponse,
    OperacionDetalle, OperacionDetalleAcumulado, IncidentWithOrigin, MovementWithOrigin, RelevantFactWithOrigin
)
from .excel_handler import excel_handler, get_bogota_now
from .email_service import email_service

# Importar autenticación y rate limiting si están disponibles
try:
    from .auth.auth_routes import router as auth_router
    from .middleware.rate_limiter import setup_rate_limiting
    AUTH_ENABLED = True
except ImportError:
    AUTH_ENABLED = False
    # Logger no está disponible aún, se usará modo legacy sin autenticación
    pass


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

    # Inicializar base de datos si está disponible
    if AUTH_ENABLED:
        try:
            from .database.connection import init_db, check_db_connection
            if check_db_connection():
                init_db()
                logger.info("Base de datos PostgreSQL inicializada")
            else:
                logger.warning("No se pudo conectar a PostgreSQL, usando modo legacy")
        except Exception as e:
            logger.error(f"Error con PostgreSQL: {e}")
    
    yield
    
    # Shutdown
    logger.info("Cerrando Admin Daily Report API")


# Crear aplicacion FastAPI
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=settings.app_description + (" (Auth Enabled)" if AUTH_ENABLED else " (Legacy Mode)"),
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

# Configurar rate limiting si está disponible
if AUTH_ENABLED:
    setup_rate_limiting(app)
    logger.info("Rate limiting configurado")

# Incluir rutas de autenticación si están disponibles
if AUTH_ENABLED:
    app.include_router(auth_router)
    logger.info("Rutas de autenticación agregadas")


# Handler para errores de validacion
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Serializar errores de manera segura
    safe_errors = []
    for error in exc.errors():
        safe_error = {
            "type": error.get("type"),
            "loc": error.get("loc"),
            "msg": error.get("msg"),
            "input": error.get("input")
        }
        # Convertir ctx con objetos no serializables
        if "ctx" in error:
            safe_error["ctx"] = {k: str(v) for k, v in error["ctx"].items()}
        safe_errors.append(safe_error)
    
    logger.error(f"Error de validacion en {request.method} {request.url}: {safe_errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Error de validacion",
            "errors": safe_errors,
            "message": "Datos de entrada inválidos"
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

    # Verificar estado de los servicios
    db_status = "not_configured"
    if AUTH_ENABLED:
        try:
            from .database.connection import check_db_connection
            db_status = "healthy" if check_db_connection() else "unhealthy"
        except:
            db_status = "error"

    return HealthCheck(
        status="healthy",
        timestamp=datetime.now(),
        version=settings.app_version,
        services={
            "excel": "healthy",
            "database": db_status,
            "auth": "enabled" if AUTH_ENABLED else "disabled"
        }
    )


# Helper function para convertir datetime a timezone de Bogotá
def convert_to_bogota_timezone(dt: Optional[datetime]) -> Optional[str]:
    """
    Convierte un datetime a timezone de Bogotá y retorna como ISO string

    Args:
        dt: datetime a convertir (puede ser naive o con timezone)

    Returns:
        String ISO con timezone de Bogotá o None si dt es None
    """
    if not dt:
        return None

    local_tz = pytz.timezone(settings.timezone)

    if dt.tzinfo is None:
        # Si es naive, asumir UTC y convertir a Bogotá
        dt_utc = pytz.UTC.localize(dt)
        dt_bogota = dt_utc.astimezone(local_tz)
    else:
        # Si ya tiene timezone, convertir a Bogotá
        dt_bogota = dt.astimezone(local_tz)

    return dt_bogota.isoformat()

# Helper function for dual-write to PostgreSQL
def save_report_to_postgres(
    report: DailyReportCreate,
    admin_name: str,
    client_info: Dict[str, str],
    report_date: date
) -> Optional[str]:
    """
    Guardar reporte en PostgreSQL (dual-write con Excel)

    Args:
        report: Datos del reporte a guardar
        admin_name: Nombre del administrador
        client_info: Información del cliente (IP, user agent)
        report_date: Fecha del reporte

    Returns:
        ID del reporte creado en PostgreSQL o None si hay error
    """
    try:
        from database.connection import SessionLocal
        from database.models import Report, Incident, Movement, User
        from security.encryption import field_encryptor

        db = SessionLocal()
        try:
            # Buscar usuario por administrator_name
            user = db.query(User).filter(
                User.administrator_name == admin_name
            ).first()

            if not user:
                logger.warning(f"User not found for admin: {admin_name}, skipping PostgreSQL save")
                return None

            # Crear reporte en PostgreSQL
            postgres_report = Report(
                user_id=user.id,
                administrator=admin_name,
                client_operation=report.cliente_operacion,
                daily_hours=report.horas_diarias,
                staff_personnel=report.personal_staff,
                base_personnel=report.personal_base,
                relevant_facts=report.hechos_relevantes or "",
                status="completed",
                report_date=report_date,
                created_at=get_bogota_now(),
                client_ip=client_info.get("ip", "Unknown"),
                user_agent=client_info.get("user_agent", "Unknown")
            )

            # Encriptar campos sensibles
            postgres_report = field_encryptor.encrypt_model_fields(postgres_report, "reports")

            db.add(postgres_report)
            db.flush()  # Para obtener el ID

            # Guardar incidencias
            if report.incidencias:
                for inc_data in report.incidencias:
                    incident = Incident(
                        report_id=postgres_report.id,
                        incident_type=inc_data.tipo,
                        employee_name=inc_data.nombre_empleado,
                        end_date=inc_data.fecha_fin,
                        notes=""
                    )
                    incident = field_encryptor.encrypt_model_fields(incident, "incidents")
                    db.add(incident)

            # Guardar movimientos
            if report.ingresos_retiros:
                for mov_data in report.ingresos_retiros:
                    movement = Movement(
                        report_id=postgres_report.id,
                        employee_name=mov_data.nombre_empleado,
                        position=mov_data.cargo,
                        movement_type=mov_data.estado,
                        effective_date=report_date,
                        notes=""
                    )
                    movement = field_encryptor.encrypt_model_fields(movement, "movements")
                    db.add(movement)

            db.commit()
            logger.info(f"Reporte guardado en PostgreSQL: {postgres_report.id}")
            return str(postgres_report.id)

        except Exception as e:
            db.rollback()
            logger.error(f"Error guardando en PostgreSQL: {e}")
            return None
        finally:
            db.close()

    except Exception as e:
        logger.error(f"Error en save_report_to_postgres: {e}")
        return None


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
        # Usar timezone de Bogotá para fecha del reporte
        local_tz = pytz.timezone(settings.timezone)
        now_local = datetime.now(local_tz)
        today = now_local.date()
        existing_reports = excel_handler.get_reports_by_date(today)
        admin_reports_today = [
            r for r in existing_reports
            if r.get('Administrador') == report.administrador
        ]

        # Guardar reporte en Excel
        saved_report = excel_handler.save_report(report, client_info)
        logger.info(f"Reporte creado en Excel: {saved_report.id} por {report.administrador}")

        # DUAL-WRITE: Guardar también en PostgreSQL
        postgres_id = save_report_to_postgres(
            report=report,
            admin_name=report.administrador,
            client_info=client_info,
            report_date=today
        )

        if postgres_id:
            logger.info(f"Reporte guardado en PostgreSQL: {postgres_id}")
        else:
            logger.warning("Reporte NO guardado en PostgreSQL (ver logs anteriores)")
        
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
    page: Optional[int] = None,
    limit: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Obtener lista de reportes con filtros opcionales

    - **administrador**: Filtrar por administrador especifico
    - **cliente**: Filtrar por cliente/operacion
    - **fecha_inicio**: Fecha inicial del rango (YYYY-MM-DD)
    - **fecha_fin**: Fecha final del rango (YYYY-MM-DD)
    - **page**: Numero de pagina para paginacion (opcional)
    - **limit**: Registros por pagina (opcional, max. 100)

    Nota: Si no se especifica limit, se devuelven todos los reportes sin paginacion
    """
    try:
        from database.connection import SessionLocal
        from database.models import Report, Incident, Movement
        from security.encryption import field_encryptor
        from sqlalchemy import func, and_

        # Validar parametros de paginacion si se proporcionan
        if limit is not None:
            if limit > 100:
                limit = 100
            if limit < 1:
                limit = 20

        if page is not None and page < 1:
            page = 1

        db = SessionLocal()
        try:
            # Construir query con filtros
            query = db.query(Report)

            if administrador:
                query = query.filter(func.lower(Report.administrator) == administrador.lower())

            if cliente:
                query = query.filter(func.lower(Report.client_operation) == cliente.lower())

            if fecha_inicio:
                try:
                    fecha_inicio_parsed = datetime.fromisoformat(fecha_inicio).date()
                    query = query.filter(Report.report_date >= fecha_inicio_parsed)
                except (ValueError, TypeError):
                    logger.warning(f"Fecha inicio inválida: {fecha_inicio}")

            if fecha_fin:
                try:
                    fecha_fin_parsed = datetime.fromisoformat(fecha_fin).date()
                    query = query.filter(Report.report_date <= fecha_fin_parsed)
                except (ValueError, TypeError):
                    logger.warning(f"Fecha fin inválida: {fecha_fin}")

            # Ordenar por fecha de creación descendente
            query = query.order_by(Report.created_at.desc())

            # Contar total de reportes
            total_reports = query.count()

            # Aplicar paginacion solo si se especifica limit
            if limit is not None and page is not None:
                skip = (page - 1) * limit
                reports = query.offset(skip).limit(limit).all()
            else:
                # Sin paginación - devolver todos los reportes
                reports = query.all()

            # Construir respuesta con incidencias y movimientos
            reports_list = []
            for report in reports:
                # Desencriptar campos sensibles del reporte
                report_decrypted = field_encryptor.decrypt_model_fields(report, "reports")

                # Obtener incidencias
                incidents = db.query(Incident).filter(Incident.report_id == report.id).all()
                incidents_list = []
                for inc in incidents:
                    inc_decrypted = field_encryptor.decrypt_model_fields(inc, "incidents")
                    incidents_list.append({
                        "id": str(inc_decrypted.id),
                        "tipo": inc_decrypted.incident_type,
                        "nombre_empleado": inc_decrypted.employee_name,
                        "fecha_fin": inc_decrypted.end_date.isoformat() if inc_decrypted.end_date else None,
                        "notas": inc_decrypted.notes or ""
                    })

                # Obtener movimientos
                movements = db.query(Movement).filter(Movement.report_id == report.id).all()
                movements_list = []
                for mov in movements:
                    mov_decrypted = field_encryptor.decrypt_model_fields(mov, "movements")
                    movements_list.append({
                        "id": str(mov_decrypted.id),
                        "nombre_empleado": mov_decrypted.employee_name,
                        "cargo": mov_decrypted.position,
                        "estado": mov_decrypted.movement_type,
                        "fecha_efectiva": mov_decrypted.effective_date.isoformat() if mov_decrypted.effective_date else None,
                        "notas": mov_decrypted.notes or ""
                    })

                # Construir objeto del reporte
                report_data = {
                    "ID": str(report_decrypted.id),
                    "Fecha_Creacion": convert_to_bogota_timezone(report_decrypted.created_at),
                    "Administrador": report_decrypted.administrator,
                    "Cliente_Operacion": report_decrypted.client_operation,
                    "Horas_Diarias": report_decrypted.daily_hours,
                    "Personal_Staff": report_decrypted.staff_personnel,
                    "Personal_Base": report_decrypted.base_personnel,
                    "Cantidad_Incidencias": len(incidents_list),
                    "Cantidad_Ingresos_Retiros": len(movements_list),
                    "Hechos_Relevantes": report_decrypted.relevant_facts or "",
                    "Estado": report_decrypted.status.value if hasattr(report_decrypted.status, 'value') else str(report_decrypted.status),
                    "IP_Origen": report_decrypted.client_ip,
                    "User_Agent": report_decrypted.user_agent,
                    "incidencias": incidents_list,
                    "ingresos_retiros": movements_list
                }
                reports_list.append(report_data)

            logger.info(f"Reportes obtenidos desde PostgreSQL: {len(reports_list)} de {total_reports}")

            return reports_list

        finally:
            db.close()

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

    - **report_id**: ID unico del reporte (UUID)
    """
    try:
        from database.connection import SessionLocal
        from database.models import Report, Incident, Movement
        from security.encryption import field_encryptor

        db = SessionLocal()
        try:
            # Buscar reporte por UUID
            report = db.query(Report).filter(Report.id == report_id).first()

            if not report:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Reporte {report_id} no encontrado"
                )

            # Desencriptar campos sensibles del reporte
            report_decrypted = field_encryptor.decrypt_model_fields(report, "reports")

            # Obtener incidencias
            incidents = db.query(Incident).filter(Incident.report_id == report_id).all()
            incidents_list = []
            for inc in incidents:
                inc_decrypted = field_encryptor.decrypt_model_fields(inc, "incidents")
                incidents_list.append({
                    "id": str(inc_decrypted.id),
                    "tipo": inc_decrypted.incident_type,
                    "nombre_empleado": inc_decrypted.employee_name,
                    "fecha_fin": inc_decrypted.end_date.isoformat() if inc_decrypted.end_date else None,
                    "notas": inc_decrypted.notes or ""
                })

            # Obtener movimientos
            movements = db.query(Movement).filter(Movement.report_id == report_id).all()
            movements_list = []
            for mov in movements:
                mov_decrypted = field_encryptor.decrypt_model_fields(mov, "movements")
                movements_list.append({
                    "id": str(mov_decrypted.id),
                    "nombre_empleado": mov_decrypted.employee_name,
                    "cargo": mov_decrypted.position,
                    "estado": mov_decrypted.movement_type,
                    "fecha_efectiva": mov_decrypted.effective_date.isoformat() if mov_decrypted.effective_date else None,
                    "notas": mov_decrypted.notes or ""
                })

            # Construir respuesta compatible con frontend
            report_data = {
                "ID": str(report_decrypted.id),
                "Fecha_Creacion": convert_to_bogota_timezone(report_decrypted.created_at),
                "Administrador": report_decrypted.administrator,
                "Cliente_Operacion": report_decrypted.client_operation,
                "Horas_Diarias": report_decrypted.daily_hours,
                "Personal_Staff": report_decrypted.staff_personnel,
                "Personal_Base": report_decrypted.base_personnel,
                "Cantidad_Incidencias": len(incidents_list),
                "Cantidad_Ingresos_Retiros": len(movements_list),
                "Hechos_Relevantes": report_decrypted.relevant_facts or "",
                "Estado": report_decrypted.status.value if hasattr(report_decrypted.status, 'value') else str(report_decrypted.status),
                "incidencias": incidents_list,
                "ingresos_retiros": movements_list
            }

            logger.info(f"Detalles de reporte obtenidos: {report_id} con {len(incidents_list)} incidencias y {len(movements_list)} movimientos")
            return report_data

        finally:
            db.close()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo detalles del reporte {report_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor al obtener detalles del reporte: {str(e)}"
        )


@app.put(
    f"{settings.api_v1_prefix}/admin/reportes/{{report_id}}",
    response_model=Dict[str, Any],
    summary="Actualizar un reporte especifico",
    description="Actualizar campos editables de un reporte existente"
)
async def update_report(report_id: str, report_update: DailyReportUpdate) -> Dict[str, Any]:
    """
    Actualizar un reporte especifico

    - **report_id**: ID unico del reporte (UUID)
    - **report_update**: Datos a actualizar (solo campos permitidos)
    """
    try:
        from database.connection import SessionLocal
        from database.models import Report, Incident, Movement
        from security.encryption import field_encryptor
        from sqlalchemy import func
        import pytz

        db = SessionLocal()
        try:
            # Buscar el reporte
            report = db.query(Report).filter(Report.id == report_id).first()

            if not report:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Reporte {report_id} no encontrado"
                )

            # Verificar que el reporte es del día actual (solo permitir editar reportes del mismo día)
            local_tz = pytz.timezone(settings.timezone)
            now_local = datetime.now(local_tz)
            today = now_local.date()

            if report.report_date != today:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Solo se pueden editar reportes del día actual"
                )

            # Verificar que al menos algo se va a actualizar
            has_basic_updates = any([
                report_update.horas_diarias is not None,
                report_update.personal_staff is not None,
                report_update.personal_base is not None,
                report_update.hechos_relevantes is not None
            ])
            has_incidents = report_update.incidencias is not None
            has_movements = report_update.ingresos_retiros is not None

            if not (has_basic_updates or has_incidents or has_movements):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se proporcionaron campos para actualizar"
                )

            # Actualizar campos básicos del reporte
            if report_update.horas_diarias is not None:
                report.daily_hours = report_update.horas_diarias
            if report_update.personal_staff is not None:
                report.staff_personnel = report_update.personal_staff
            if report_update.personal_base is not None:
                report.base_personnel = report_update.personal_base
            if report_update.hechos_relevantes is not None:
                report.relevant_facts = report_update.hechos_relevantes

            # Actualizar timestamp
            report.updated_at = func.now()

            # Actualizar incidencias si se proporcionaron
            if has_incidents:
                # Eliminar incidencias existentes
                db.query(Incident).filter(Incident.report_id == report_id).delete()

                # Agregar nuevas incidencias
                for inc_data in report_update.incidencias:
                    incident = Incident(
                        report_id=report_id,
                        incident_type=inc_data.tipo.value if hasattr(inc_data.tipo, 'value') else str(inc_data.tipo) if inc_data.tipo else "",
                        employee_name=inc_data.nombre_empleado if inc_data.nombre_empleado else "",
                        end_date=inc_data.fecha_fin,
                        notes=""
                    )
                    # Encriptar campos sensibles
                    incident = field_encryptor.encrypt_model_fields(incident, "incidents")
                    db.add(incident)

            # Actualizar movimientos si se proporcionaron
            if has_movements:
                # Eliminar movimientos existentes
                db.query(Movement).filter(Movement.report_id == report_id).delete()

                # Agregar nuevos movimientos
                for mov_data in report_update.ingresos_retiros:
                    movement = Movement(
                        report_id=report_id,
                        employee_name=mov_data.nombre_empleado if mov_data.nombre_empleado else "",
                        position=mov_data.cargo if mov_data.cargo else "",
                        movement_type=mov_data.estado.value if hasattr(mov_data.estado, 'value') else str(mov_data.estado) if mov_data.estado else "Ingreso",
                        effective_date=today,
                        notes=""
                    )
                    # Encriptar campos sensibles
                    movement = field_encryptor.encrypt_model_fields(movement, "movements")
                    db.add(movement)

            # Guardar cambios
            db.commit()
            db.refresh(report)

            # Desencriptar para respuesta
            report_decrypted = field_encryptor.decrypt_model_fields(report, "reports")

            # Obtener incidencias actualizadas
            incidents = db.query(Incident).filter(Incident.report_id == report_id).all()
            incidents_list = []
            for inc in incidents:
                inc_decrypted = field_encryptor.decrypt_model_fields(inc, "incidents")
                incidents_list.append({
                    "id": str(inc_decrypted.id),
                    "tipo": inc_decrypted.incident_type,
                    "nombre_empleado": inc_decrypted.employee_name,
                    "fecha_fin": inc_decrypted.end_date.isoformat() if inc_decrypted.end_date else None,
                    "notas": inc_decrypted.notes or ""
                })

            # Obtener movimientos actualizados
            movements = db.query(Movement).filter(Movement.report_id == report_id).all()
            movements_list = []
            for mov in movements:
                mov_decrypted = field_encryptor.decrypt_model_fields(mov, "movements")
                movements_list.append({
                    "id": str(mov_decrypted.id),
                    "nombre_empleado": mov_decrypted.employee_name,
                    "cargo": mov_decrypted.position,
                    "estado": mov_decrypted.movement_type,
                    "fecha_efectiva": mov_decrypted.effective_date.isoformat() if mov_decrypted.effective_date else None,
                    "notas": mov_decrypted.notes or ""
                })

            # Construir respuesta
            updated_report = {
                "ID": str(report_decrypted.id),
                "Fecha_Creacion": convert_to_bogota_timezone(report_decrypted.created_at),
                "Administrador": report_decrypted.administrator,
                "Cliente_Operacion": report_decrypted.client_operation,
                "Horas_Diarias": report_decrypted.daily_hours,
                "Personal_Staff": report_decrypted.staff_personnel,
                "Personal_Base": report_decrypted.base_personnel,
                "Cantidad_Incidencias": len(incidents_list),
                "Cantidad_Ingresos_Retiros": len(movements_list),
                "Hechos_Relevantes": report_decrypted.relevant_facts or "",
                "Estado": report_decrypted.status.value if hasattr(report_decrypted.status, 'value') else str(report_decrypted.status),
                "incidencias": incidents_list,
                "ingresos_retiros": movements_list
            }

            logger.info(f"Reporte actualizado exitosamente: {report_id}")
            return updated_report

        finally:
            db.close()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando reporte {report_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor al actualizar el reporte: {str(e)}"
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
    f"{settings.api_v1_prefix}/admin/daily-general-operations",
    response_model=DailyGeneralOperationsResponse,
    summary="Vista 1: Operación General Diaria",
    description="Obtener datos consolidados de todas las operaciones para un día específico"
)
async def get_daily_general_operations(
    fecha: Optional[date] = None
) -> DailyGeneralOperationsResponse:
    """
    Vista 1: Operación General Diaria
    
    Obtiene datos consolidados de TODAS las operaciones para un día específico:
    - Promedio de horas diarias entre todas las operaciones
    - Suma total de personal staff y base
    - Lista consolidada de incidencias con origen (admin/operación)
    - Lista consolidada de movimientos con origen (admin/operación) 
    - Lista consolidada de hechos relevantes con origen (admin/operación)
    
    Args:
        fecha: Fecha específica (por defecto: hoy)
    
    Returns:
        DailyGeneralOperationsResponse: Datos consolidados del día
    """
    try:
        # Si no se especifica fecha, usar hoy
        target_date = fecha or date.today()
        
        # Obtener datos consolidados del día
        data = excel_handler.get_daily_general_operations(target_date)
        
        # Convertir a modelo Pydantic
        response = DailyGeneralOperationsResponse(**data)
        
        logger.info(f"Vista 1 obtenida exitosamente para {target_date}")
        return response
        
    except Exception as e:
        logger.error(f"Error obteniendo Vista 1 para {fecha}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor al obtener datos del día {fecha}"
        )


@app.get(
    f"{settings.api_v1_prefix}/admin/daily-detailed-operations",
    response_model=DailyDetailedOperationsResponse,
    summary="Vista 2: Detalle Diario por Operaciones",
    description="Obtener datos desglosados por cada operación para un día específico"
)
async def get_daily_detailed_operations(
    fecha: Optional[date] = None
) -> DailyDetailedOperationsResponse:
    """
    Vista 2: Detalle Diario por Operaciones

    Obtiene datos desglosados POR CADA operación para un día específico:
    - Horas diarias de cada operación individual
    - Personal staff y base de cada operación
    - Incidencias específicas de cada operación
    - Movimientos específicos de cada operación
    - Hechos relevantes específicos de cada operación

    Args:
        fecha: Fecha específica (por defecto: hoy)

    Returns:
        DailyDetailedOperationsResponse: Datos desglosados por operación
    """
    try:
        # Si no se especifica fecha, usar hoy
        target_date = fecha or date.today()

        # Obtener datos desglosados por operación
        data = excel_handler.get_daily_detailed_operations(target_date)

        # DEBUG: Log raw data structure for debugging
        logger.info(f"DEBUG: Raw data structure for {target_date}")
        if data.get('operaciones'):
            for i, op in enumerate(data['operaciones'][:2]):  # Only log first 2 operations
                logger.info(f"  Operation {i}: {op.get('cliente_operacion')}")
                if op.get('incidencias'):
                    logger.info(f"    First incident keys: {list(op['incidencias'][0].keys())}")
                    logger.info(f"    First incident sample: {op['incidencias'][0]}")
                if op.get('movimientos'):
                    logger.info(f"    First movement keys: {list(op['movimientos'][0].keys())}")
                    logger.info(f"    First movement sample: {op['movimientos'][0]}")

        # DEBUG: Skip Pydantic validation temporarily
        logger.info(f"DEBUG: Returning raw data for {target_date}")
        logger.info(f"DEBUG: Data keys: {list(data.keys())}")
        if data.get('operaciones'):
            logger.info(f"DEBUG: First operation keys: {list(data['operaciones'][0].keys())}")
            if data['operaciones'][0].get('incidencias'):
                logger.info(f"DEBUG: First incident: {data['operaciones'][0]['incidencias'][0]}")

        # DEBUG: Log the actual data structure being returned
        logger.info(f"DATA STRUCTURE DEBUG for {target_date}")
        logger.info(f"Keys: {list(data.keys())}")
        if data.get('operaciones'):
            first_op = data['operaciones'][0] if data['operaciones'] else {}
            logger.info(f"First operation keys: {list(first_op.keys())}")
            if first_op.get('incidencias'):
                first_inc = first_op['incidencias'][0] if first_op['incidencias'] else {}
                logger.info(f"First incident keys: {list(first_inc.keys())}")
                logger.info(f"First incident full: {first_inc}")
                logger.info(f"Has cliente_operacion? {'cliente_operacion' in first_inc}")

        # Try to create the Pydantic model and catch specific errors
        try:
            response = DailyDetailedOperationsResponse(**data)
            logger.info(f"Vista 2 obtenida exitosamente para {target_date}")
            return response
        except Exception as pydantic_error:
            logger.error(f"PYDANTIC VALIDATION ERROR: {pydantic_error}")
            # Return raw data temporarily to bypass validation
            return data

    except Exception as e:
        logger.error(f"Error obteniendo Vista 2 para {fecha}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor al obtener detalle por operaciones del día {fecha}"
        )


@app.get(
    f"{settings.api_v1_prefix}/admin/accumulated-general-operations",
    response_model=AccumulatedGeneralOperationsResponse,
    summary="Vista 3: Operación General Acumulado",
    description="Obtener datos consolidados de todas las operaciones para un período específico"
)
async def get_accumulated_general_operations(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None
) -> AccumulatedGeneralOperationsResponse:
    """
    Vista 3: Operación General Acumulado
    
    Obtiene datos CONSOLIDADOS de todas las operaciones para un período:
    - Promedio de horas diarias del período
    - Suma total de personal staff y base
    - Lista consolidada de incidencias de todas las operaciones
    - Lista consolidada de movimientos de todas las operaciones
    - Lista consolidada de hechos relevantes de todas las operaciones
    - Por defecto muestra "última semana" (lunes a día actual)
    
    Args:
        fecha_inicio: Fecha de inicio del período (por defecto: lunes de esta semana)
        fecha_fin: Fecha de fin del período (por defecto: día actual)
    
    Returns:
        AccumulatedGeneralOperationsResponse: Datos consolidados del período
    """
    try:
        # Obtener datos acumulados del período
        data = excel_handler.get_accumulated_general_operations(fecha_inicio, fecha_fin)
        
        # Convertir a modelo Pydantic
        response = AccumulatedGeneralOperationsResponse(**data)
        
        logger.info(f"Vista 3 obtenida exitosamente para período {response.fecha_inicio} - {response.fecha_fin}")
        return response
        
    except Exception as e:
        logger.error(f"Error obteniendo Vista 3 para período {fecha_inicio} - {fecha_fin}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor al obtener operación general acumulada para período {fecha_inicio} - {fecha_fin}"
        )


@app.get(
    f"{settings.api_v1_prefix}/admin/accumulated-detailed-operations",
    response_model=AccumulatedDetailedOperationsResponse,
    summary="Vista 4: Detalle Acumulado por Operaciones",
    description="Obtener datos desglosados por cada operación para un período específico con promedios"
)
async def get_accumulated_detailed_operations(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None
) -> AccumulatedDetailedOperationsResponse:
    """
    Vista 4: Detalle Acumulado por Operaciones
    
    Obtiene datos DESGLOSADOS por cada operación individual para un período:
    - Promedio de horas diarias del período para cada operación
    - Promedio de personal staff y base para cada operación
    - Lista completa de incidencias por operación del período
    - Lista completa de movimientos por operación del período
    - Lista completa de hechos relevantes por operación del período
    - Por defecto muestra "última semana" (lunes a día actual)
    
    Args:
        fecha_inicio: Fecha de inicio del período (por defecto: lunes de esta semana)
        fecha_fin: Fecha de fin del período (por defecto: día actual)
    
    Returns:
        AccumulatedDetailedOperationsResponse: Datos desglosados por operación para el período
    """
    try:
        # Obtener datos acumulados desglosados por operación
        data = excel_handler.get_accumulated_detailed_operations(fecha_inicio, fecha_fin)
        
        # Convertir a modelo Pydantic
        response = AccumulatedDetailedOperationsResponse(**data)
        
        logger.info(f"Vista 4 obtenida exitosamente para período {response.fecha_inicio} - {response.fecha_fin}")
        return response
        
    except Exception as e:
        logger.error(f"Error obteniendo Vista 4 para período {fecha_inicio} - {fecha_fin}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor al obtener detalle acumulado por operaciones para período {fecha_inicio} - {fecha_fin}"
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
    description="Obtener información sobre reportes enviados hoy por un administrador específico (opcionalmente filtrado por operación)"
)
async def check_admin_today_reports(
    admin_name: str,
    operacion: Optional[str] = None
):
    """
    Verificar reportes enviados hoy por un administrador específico

    Args:
        admin_name: Nombre del administrador
        operacion: (Opcional) Filtrar por operación específica

    Returns:
        Información sobre reportes del día, incluyendo operaciones
    """
    try:
        from database.connection import SessionLocal
        from database.models import Report
        from sqlalchemy import func
        from security.encryption import field_encryptor

        # Usar timezone configurada (America/Bogota)
        local_tz = pytz.timezone(settings.timezone)
        now_local = datetime.now(local_tz)
        today = now_local.date()

        # Consultar PostgreSQL
        db = SessionLocal()
        try:
            # Query base
            query = db.query(Report).filter(
                func.lower(Report.administrator) == admin_name.lower(),
                Report.report_date == today
            )

            # Filtrar por operación si se especifica
            if operacion:
                query = query.filter(
                    func.lower(Report.client_operation) == operacion.lower()
                )

            admin_reports_today = query.all()

            reports_list = []
            operaciones_reportadas = set()

            for r in admin_reports_today:
                # Desencriptar para obtener la operación
                r_decrypted = field_encryptor.decrypt_model_fields(r, "reports")
                operaciones_reportadas.add(r_decrypted.client_operation)

                reports_list.append({
                    "id": str(r.id),
                    "operacion": r_decrypted.client_operation,
                    "hora": convert_to_bogota_timezone(r.created_at),
                    "estado": r.status.value if hasattr(r.status, 'value') else str(r.status)
                })

            return APIResponse(
                success=True,
                message=f"Información de reportes del día para {admin_name}" + (f" - {operacion}" if operacion else ""),
                data={
                    "administrador": admin_name,
                    "operacion_filtrada": operacion,
                    "fecha": today.isoformat(),
                    "reportes_enviados": len(admin_reports_today),
                    "ha_reportado": len(admin_reports_today) > 0,
                    "operaciones_reportadas": list(operaciones_reportadas),
                    "reportes": reports_list
                }
            )
        finally:
            db.close()

    except Exception as e:
        logger.error(f"Error verificando reportes del administrador {admin_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al verificar reportes"
        )


# Endpoint para eliminar un reporte específico
@app.delete(
    f"{settings.api_v1_prefix}/reportes/{{report_id}}",
    summary="Eliminar un reporte específico",
    description="Eliminar un reporte (administradores del sistema pueden eliminar cualquier reporte)"
)
async def delete_report(report_id: str, request: Request):
    """Eliminar un reporte específico (dual-delete: Excel + PostgreSQL)"""
    try:
        # Obtener información del cliente para auditoría
        client_info = get_client_info(request)

        excel_success = False
        postgres_success = False
        report_found = False

        # Intentar eliminar de PostgreSQL primero
        try:
            from database.connection import SessionLocal
            from database.models import Report

            db = SessionLocal()
            try:
                # Buscar y eliminar el reporte (las incidencias y movimientos se eliminan en cascada)
                report = db.query(Report).filter(Report.id == report_id).first()
                if report:
                    report_found = True
                    # Guardar legacy_id si existe para buscarlo en Excel
                    legacy_id = report.legacy_id

                    db.delete(report)
                    db.commit()
                    postgres_success = True
                    logger.info(f"Reporte eliminado de PostgreSQL: {report_id}")

                    # Si tiene legacy_id, intentar eliminar de Excel
                    if legacy_id:
                        try:
                            excel_success = excel_handler.delete_report(legacy_id)
                            if excel_success:
                                logger.info(f"Reporte eliminado de Excel: {legacy_id}")
                        except Exception as excel_err:
                            logger.warning(f"No se pudo eliminar de Excel (legacy_id: {legacy_id}): {excel_err}")
                else:
                    logger.warning(f"Reporte no encontrado en PostgreSQL: {report_id}")
            except Exception as pg_error:
                db.rollback()
                logger.error(f"Error eliminando de PostgreSQL: {pg_error}")
                raise
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Error en eliminación de PostgreSQL: {e}")

        # Si no se encontró en PostgreSQL, intentar en Excel
        if not report_found:
            try:
                all_reports = excel_handler.get_all_reports()
                report_to_delete = next((r for r in all_reports if r.get('ID') == report_id), None)

                if report_to_delete:
                    report_found = True
                    excel_success = excel_handler.delete_report(report_id)
                    logger.info(f"Reporte eliminado de Excel: {report_id}")
            except Exception as excel_err:
                logger.error(f"Error eliminando de Excel: {excel_err}")

        if not report_found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Reporte {report_id} no encontrado en ningún sistema"
            )

        if postgres_success or excel_success:
            logger.info(f"Reporte eliminado: {report_id} por IP {client_info['ip']}")
            return APIResponse(
                success=True,
                message=f"Reporte {report_id} eliminado exitosamente",
                data={
                    "id_eliminado": report_id,
                    "fecha_eliminacion": datetime.now().isoformat(),
                    "excel_eliminado": excel_success,
                    "postgres_eliminado": postgres_success
                }
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error eliminando el reporte de ambos sistemas"
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


# DEBUG ENDPOINT - TEMPORAL
@app.get(
    f"{settings.api_v1_prefix}/admin/debug-daily-detailed-operations",
    summary="DEBUG: Vista 2 sin validación Pydantic",
    description="Endpoint de debug temporal"
)
async def debug_daily_detailed_operations(fecha: Optional[date] = None):
    """DEBUG: Obtener datos crudos sin validación Pydantic"""
    try:
        target_date = fecha or date.today()
        data = excel_handler.get_daily_detailed_operations(target_date)
        return data
    except Exception as e:
        logger.error(f"DEBUG Error: {e}")
        return {"error": str(e)}