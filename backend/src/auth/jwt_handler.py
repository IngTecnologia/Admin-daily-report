"""
JWT Authentication Handler
Maneja la creación y validación de tokens JWT con refresh tokens
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
import os
from loguru import logger

# Configuración de seguridad
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

class JWTHandler:
    """Manejador de tokens JWT con soporte para refresh tokens"""

    def __init__(self):
        self.SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
        self.REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET", "your-refresh-secret-change-this")
        self.ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
        self.REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

        # Verificar que las claves estén configuradas en producción
        if os.getenv("NODE_ENV") == "production":
            if "change-this" in self.SECRET_KEY or "change-this" in self.REFRESH_SECRET:
                raise ValueError("JWT secrets must be properly configured in production!")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verificar contraseña contra hash"""
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """Generar hash de contraseña"""
        return pwd_context.hash(password)

    def create_access_token(self, data: Dict[str, Any]) -> str:
        """
        Crear token de acceso JWT

        Args:
            data: Datos a codificar en el token (user_id, role, etc.)

        Returns:
            Token JWT firmado
        """
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({
            "exp": expire,
            "type": "access",
            "iat": datetime.utcnow()
        })

        encoded_jwt = jwt.encode(to_encode, self.SECRET_KEY, algorithm=self.ALGORITHM)
        logger.debug(f"Access token created for user: {data.get('sub')}")
        return encoded_jwt

    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """
        Crear refresh token JWT

        Args:
            data: Datos a codificar en el token

        Returns:
            Refresh token JWT firmado
        """
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=self.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({
            "exp": expire,
            "type": "refresh",
            "iat": datetime.utcnow()
        })

        encoded_jwt = jwt.encode(to_encode, self.REFRESH_SECRET, algorithm=self.ALGORITHM)
        logger.debug(f"Refresh token created for user: {data.get('sub')}")
        return encoded_jwt

    def verify_token(self, token: str, token_type: str = "access") -> Dict[str, Any]:
        """
        Verificar y decodificar token JWT

        Args:
            token: Token JWT a verificar
            token_type: Tipo de token ("access" o "refresh")

        Returns:
            Payload del token decodificado

        Raises:
            HTTPException: Si el token es inválido o expirado
        """
        try:
            # Seleccionar la clave según el tipo de token
            secret = self.SECRET_KEY if token_type == "access" else self.REFRESH_SECRET

            # Decodificar token
            payload = jwt.decode(token, secret, algorithms=[self.ALGORITHM])

            # Verificar tipo de token
            if payload.get("type") != token_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid token type. Expected {token_type}",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            return payload

        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except JWTError as e:
            logger.error(f"JWT validation error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def get_current_user(self, token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
        """
        Obtener usuario actual desde el token

        Args:
            token: Token JWT desde el header Authorization

        Returns:
            Información del usuario decodificada del token
        """
        payload = self.verify_token(token, token_type="access")

        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return {
            "user_id": user_id,
            "username": payload.get("username"),
            "email": payload.get("email"),
            "role": payload.get("role"),
            "full_name": payload.get("full_name")
        }

    def refresh_access_token(self, refresh_token: str) -> Dict[str, str]:
        """
        Generar nuevo access token usando refresh token

        Args:
            refresh_token: Refresh token válido

        Returns:
            Diccionario con nuevo access token y refresh token
        """
        # Verificar refresh token
        payload = self.verify_token(refresh_token, token_type="refresh")

        # Crear nuevo access token con los datos del refresh token
        new_access_token = self.create_access_token({
            "sub": payload.get("sub"),
            "username": payload.get("username"),
            "email": payload.get("email"),
            "role": payload.get("role"),
            "full_name": payload.get("full_name")
        })

        # Opcionalmente, crear nuevo refresh token (rotation)
        new_refresh_token = self.create_refresh_token({
            "sub": payload.get("sub"),
            "username": payload.get("username"),
            "email": payload.get("email"),
            "role": payload.get("role"),
            "full_name": payload.get("full_name")
        })

        logger.info(f"Tokens refreshed for user: {payload.get('sub')}")

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }

# Instancia global del manejador JWT
jwt_handler = JWTHandler()

# Dependency para obtener usuario actual
async def get_current_user_dependency(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """Dependency de FastAPI para obtener usuario actual"""
    return jwt_handler.get_current_user(token)

# Dependency para verificar rol de admin
async def require_admin(current_user: Dict = Depends(get_current_user_dependency)) -> Dict[str, Any]:
    """Dependency para requerir rol de administrador"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user