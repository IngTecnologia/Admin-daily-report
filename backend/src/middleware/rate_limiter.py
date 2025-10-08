"""
Rate Limiting Middleware
Protección contra abuso de API y ataques DDoS
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import redis
import os
from typing import Optional
from loguru import logger
import json
from datetime import datetime, timedelta

# Configurar Redis para almacenamiento de rate limits
def get_redis_client() -> Optional[redis.Redis]:
    """Obtener cliente Redis si está configurado"""
    redis_url = os.getenv("REDIS_URL")

    if redis_url:
        try:
            client = redis.from_url(redis_url, decode_responses=True)
            client.ping()  # Verificar conexión
            logger.info("Redis connected for rate limiting")
            return client
        except Exception as e:
            logger.warning(f"Redis connection failed, using in-memory storage: {e}")
            return None
    else:
        logger.info("No Redis URL configured, using in-memory rate limiting")
        return None

# Crear limiter con Redis o memoria según disponibilidad
redis_client = get_redis_client()
storage_uri = os.getenv("REDIS_URL", "memory://") if redis_client else "memory://"

# Función personalizada para obtener identificador del cliente
def get_client_id(request: Request) -> str:
    """
    Obtener identificador único del cliente para rate limiting

    Prioridad:
    1. User ID si está autenticado
    2. IP del cliente
    3. IP del forwarded header (para proxies)
    """
    # Intentar obtener user ID si está autenticado
    if hasattr(request.state, "user") and request.state.user:
        return f"user:{request.state.user.get('user_id')}"

    # Obtener IP del cliente
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return f"ip:{forwarded.split(',')[0].strip()}"

    client = request.client
    if client:
        return f"ip:{client.host}"

    return "ip:unknown"

# Configurar limiter principal
limiter = Limiter(
    key_func=get_client_id,
    default_limits=["1000 per hour", "100 per minute"],  # Límites globales
    storage_uri=storage_uri,
    swallow_errors=False  # Fallar si hay errores en rate limiting
)

# Manejador personalizado para límites excedidos
async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Manejador personalizado cuando se excede el límite"""

    # Registrar el intento
    client_id = get_client_id(request)
    logger.warning(f"Rate limit exceeded for {client_id} on {request.url.path}")

    # Registrar en auditoría si es posible
    if redis_client:
        try:
            # Incrementar contador de violaciones
            key = f"rate_violations:{client_id}"
            redis_client.incr(key)
            redis_client.expire(key, 3600)  # Expirar en 1 hora

            # Obtener número de violaciones
            violations = int(redis_client.get(key) or 0)

            # Si hay muchas violaciones, considerar bloqueo temporal
            if violations > 10:
                block_key = f"blocked:{client_id}"
                redis_client.setex(block_key, 600, "blocked")  # Bloquear por 10 minutos
                logger.error(f"Client {client_id} temporarily blocked due to excessive violations")
        except Exception as e:
            logger.error(f"Error recording rate limit violation: {e}")

    response = JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "message": f"Too many requests. Limit: {exc.detail}",
            "retry_after": request.headers.get("Retry-After", "60")
        }
    )
    response.headers["Retry-After"] = request.headers.get("Retry-After", "60")
    response.headers["X-RateLimit-Limit"] = request.headers.get("X-RateLimit-Limit", "")
    response.headers["X-RateLimit-Remaining"] = "0"
    response.headers["X-RateLimit-Reset"] = request.headers.get("X-RateLimit-Reset", "")

    return response

# Middleware para verificar bloqueos
class BlockedClientMiddleware(BaseHTTPMiddleware):
    """Middleware para verificar si un cliente está bloqueado"""

    async def dispatch(self, request: Request, call_next):
        if redis_client:
            client_id = get_client_id(request)
            block_key = f"blocked:{client_id}"

            if redis_client.exists(block_key):
                logger.warning(f"Blocked client attempted access: {client_id}")
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": "Forbidden",
                        "message": "Your access has been temporarily blocked due to excessive requests"
                    }
                )

        response = await call_next(request)
        return response

# Configuraciones de límites específicos por endpoint
class RateLimits:
    """Límites de rate para diferentes endpoints"""

    # Autenticación - más restrictivo
    LOGIN = "5 per minute"
    REGISTER = "3 per minute"
    PASSWORD_RESET = "3 per hour"

    # Reportes - límites normales
    CREATE_REPORT = "10 per hour"
    UPDATE_REPORT = "30 per hour"
    GET_REPORTS = "60 per minute"

    # Admin - límites más altos
    ADMIN_OPERATIONS = "100 per minute"
    EXPORT_DATA = "10 per hour"

    # Públicos - más permisivos
    HEALTH_CHECK = "1000 per minute"
    PUBLIC_API = "30 per minute"

# Decoradores auxiliares para aplicar rate limits
def apply_rate_limit(limit: str):
    """Decorador para aplicar rate limit a un endpoint específico"""
    return limiter.limit(limit)

# Clase para tracking avanzado de requests
class RequestTracker:
    """Tracking avanzado de requests para análisis y seguridad"""

    def __init__(self):
        self.redis_client = redis_client

    def track_request(self, request: Request, response_status: int):
        """Registrar información de request para análisis"""
        if not self.redis_client:
            return

        try:
            client_id = get_client_id(request)
            timestamp = datetime.utcnow().isoformat()

            # Crear entrada de tracking
            tracking_data = {
                "path": request.url.path,
                "method": request.method,
                "status": response_status,
                "timestamp": timestamp,
                "user_agent": request.headers.get("User-Agent", "unknown")
            }

            # Guardar en lista Redis con TTL
            key = f"requests:{client_id}:{datetime.utcnow().strftime('%Y%m%d')}"
            self.redis_client.lpush(key, json.dumps(tracking_data))
            self.redis_client.expire(key, 86400)  # Expirar en 24 horas

            # Mantener solo últimos 1000 requests
            self.redis_client.ltrim(key, 0, 999)

        except Exception as e:
            logger.error(f"Error tracking request: {e}")

    def get_client_stats(self, client_id: str) -> dict:
        """Obtener estadísticas de un cliente"""
        if not self.redis_client:
            return {}

        try:
            today = datetime.utcnow().strftime('%Y%m%d')
            key = f"requests:{client_id}:{today}"

            # Obtener últimos requests
            requests = self.redis_client.lrange(key, 0, -1)

            if not requests:
                return {"total_requests": 0, "requests": []}

            # Parsear y analizar
            parsed_requests = [json.loads(r) for r in requests]

            # Calcular estadísticas
            stats = {
                "total_requests": len(parsed_requests),
                "requests_by_path": {},
                "requests_by_status": {},
                "last_request": parsed_requests[0] if parsed_requests else None
            }

            for req in parsed_requests:
                # Por path
                path = req["path"]
                stats["requests_by_path"][path] = stats["requests_by_path"].get(path, 0) + 1

                # Por status
                status = str(req["status"])
                stats["requests_by_status"][status] = stats["requests_by_status"].get(status, 0) + 1

            return stats

        except Exception as e:
            logger.error(f"Error getting client stats: {e}")
            return {}

# Instancia global del tracker
request_tracker = RequestTracker()

# Función para configurar rate limiting en la app
def setup_rate_limiting(app: FastAPI):
    """Configurar rate limiting en la aplicación FastAPI"""

    # Agregar manejador de excepciones
    app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

    # Agregar middleware de bloqueo
    app.add_middleware(BlockedClientMiddleware)

    # Agregar el limiter a la app
    app.state.limiter = limiter

    logger.info("Rate limiting configured successfully")