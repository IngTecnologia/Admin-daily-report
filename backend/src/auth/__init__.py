"""
M\u00f3dulo de autenticaci\u00f3n y autorizaci\u00f3n
"""
from .jwt_handler import jwt_handler, get_current_user_dependency, require_admin
from .auth_routes import router

__all__ = [
    'jwt_handler',
    'get_current_user_dependency',
    'require_admin',
    'router'
]