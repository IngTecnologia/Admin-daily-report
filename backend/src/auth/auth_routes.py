"""
Rutas de autenticación para el backend
Login, refresh token, logout, etc.
"""
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from loguru import logger

from database.connection import get_db
from database.models import User, AuditLog
from .jwt_handler import jwt_handler, get_current_user_dependency
from security.encryption import field_encryptor
from middleware.rate_limiter import RateLimits, apply_rate_limit
import json

# Router para autenticación
router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"]
)

# Modelos Pydantic para requests/responses
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

class RefreshRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    administrator_name: Optional[str]
    client_operation: Optional[str]
    is_active: bool

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/login", response_model=LoginResponse)
@apply_rate_limit(RateLimits.LOGIN)
async def login(
    request: Request,
    form_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Endpoint de login - autentica usuario y retorna tokens JWT

    Args:
        form_data: Username y password
        db: Sesión de base de datos

    Returns:
        Access token, refresh token y datos del usuario

    Raises:
        HTTPException 401: Credenciales inválidas
    """
    try:
        # Buscar usuario por username o email
        user = db.query(User).filter(
            (User.username == form_data.username) |
            (User.email == form_data.username)
        ).first()

        if not user:
            # Log intento fallido
            logger.warning(f"Login attempt failed - user not found: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario o contraseña incorrectos"
            )

        # Desencriptar campos del usuario para la respuesta
        user = field_encryptor.decrypt_model_fields(user, "users")

        # Verificar contraseña
        if not jwt_handler.verify_password(form_data.password, user.password_hash):
            logger.warning(f"Login attempt failed - wrong password for user: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario o contraseña incorrectos"
            )

        # Verificar si el usuario está activo
        if not user.is_active:
            logger.warning(f"Login attempt failed - inactive user: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo. Contacte al administrador."
            )

        # Crear tokens
        token_data = {
            "sub": str(user.id),
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name
        }

        access_token = jwt_handler.create_access_token(token_data)
        refresh_token = jwt_handler.create_refresh_token(token_data)

        # Actualizar último login
        user.last_login = datetime.utcnow()
        db.commit()

        # Registrar en auditoría
        audit_log = AuditLog(
            user_id=user.id,
            action="LOGIN",
            resource_type="auth",
            resource_id=str(user.id),
            details=json.dumps({
                "username": user.username,
                "ip": request.client.host if request.client else "unknown",
                "user_agent": request.headers.get("user-agent", "unknown")
            }),
            client_ip=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        db.add(audit_log)
        db.commit()

        logger.info(f"User logged in successfully: {user.username}")

        # Preparar respuesta del usuario
        user_response = {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "administrator_name": user.administrator_name,
            "client_operation": user.client_operation,
            "is_active": user.is_active
        }

        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=user_response
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.post("/refresh")
@apply_rate_limit(RateLimits.LOGIN)
async def refresh_token(
    refresh_request: RefreshRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Renovar access token usando refresh token

    Args:
        refresh_request: Refresh token válido

    Returns:
        Nuevo access token y refresh token

    Raises:
        HTTPException 401: Token inválido o expirado
    """
    try:
        # Verificar y renovar tokens
        tokens = jwt_handler.refresh_access_token(refresh_request.refresh_token)

        # Obtener usuario del token
        payload = jwt_handler.verify_token(refresh_request.refresh_token, token_type="refresh")
        user_id = payload.get("sub")

        # Verificar que el usuario siga activo
        user = db.query(User).filter_by(id=user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no válido"
            )

        return tokens

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user: dict = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Obtener información del usuario actual

    Args:
        current_user: Usuario autenticado desde el token

    Returns:
        Información del usuario actual
    """
    # Obtener usuario completo de la base de datos
    user = db.query(User).filter_by(id=current_user["user_id"]).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # Desencriptar campos
    user = field_encryptor.decrypt_model_fields(user, "users")

    return UserResponse(
        id=str(user.id),
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        administrator_name=user.administrator_name,
        client_operation=user.client_operation,
        is_active=user.is_active
    )

@router.post("/logout")
async def logout(
    request: Request,
    current_user: dict = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Logout del usuario - registrar en auditoría

    Args:
        current_user: Usuario autenticado

    Returns:
        Mensaje de confirmación
    """
    # Registrar logout en auditoría
    audit_log = AuditLog(
        user_id=current_user["user_id"],
        action="LOGOUT",
        resource_type="auth",
        resource_id=current_user["user_id"],
        details=json.dumps({
            "username": current_user["username"]
        }),
        client_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    db.commit()

    logger.info(f"User logged out: {current_user['username']}")

    return {"message": "Sesión cerrada exitosamente"}

@router.post("/change-password")
@apply_rate_limit(RateLimits.PASSWORD_RESET)
async def change_password(
    request: Request,
    password_data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Cambiar contraseña del usuario actual

    Args:
        password_data: Contraseña actual y nueva
        current_user: Usuario autenticado

    Returns:
        Mensaje de confirmación
    """
    # Obtener usuario
    user = db.query(User).filter_by(id=current_user["user_id"]).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # Verificar contraseña actual
    if not jwt_handler.verify_password(password_data.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña actual incorrecta"
        )

    # Validar nueva contraseña
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe tener al menos 8 caracteres"
        )

    # Actualizar contraseña
    user.password_hash = jwt_handler.get_password_hash(password_data.new_password)
    db.commit()

    # Registrar en auditoría
    audit_log = AuditLog(
        user_id=user.id,
        action="PASSWORD_CHANGE",
        resource_type="user",
        resource_id=str(user.id),
        details=json.dumps({
            "username": user.username,
            "ip": request.client.host if request.client else "unknown"
        }),
        client_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(audit_log)
    db.commit()

    logger.info(f"Password changed for user: {user.username}")

    return {"message": "Contraseña actualizada exitosamente"}

@router.get("/verify")
async def verify_token(
    current_user: dict = Depends(get_current_user_dependency)
):
    """
    Verificar si el token es válido

    Args:
        current_user: Usuario autenticado

    Returns:
        Estado del token
    """
    return {
        "valid": True,
        "user_id": current_user["user_id"],
        "username": current_user["username"]
    }

@router.get("/me/operations")
async def get_user_operations(
    current_user: dict = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Obtener las operaciones/clientes asignados al usuario actual

    Args:
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        Lista de operaciones asignadas al usuario
    """
    try:
        # Buscar usuario
        user = db.query(User).filter(User.id == current_user["user_id"]).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )

        # Desencriptar campos del usuario
        user = field_encryptor.decrypt_model_fields(user, "users")

        # Obtener operaciones del campo JSONB
        operations = []
        if user.client_operations:
            # Si client_operations es un array JSON
            import json
            if isinstance(user.client_operations, str):
                operations = json.loads(user.client_operations)
            elif isinstance(user.client_operations, list):
                operations = user.client_operations
            else:
                # Es un objeto JSONB de SQLAlchemy
                operations = user.client_operations

        # Fallback a client_operation si no hay client_operations
        if not operations and user.client_operation:
            operations = [user.client_operation]

        return {
            "operations": operations,
            "count": len(operations),
            "user_name": user.full_name or user.administrator_name,
            "default_operation": operations[0] if operations else None
        }

    except Exception as e:
        logger.error(f"Error getting user operations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener operaciones del usuario"
        )