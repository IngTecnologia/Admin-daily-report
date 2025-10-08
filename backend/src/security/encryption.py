"""
Sistema de encriptación para datos sensibles
Utiliza Fernet (symmetric encryption) para proteger información PII
"""
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os
import json
from typing import Any, Optional, Dict, List
from loguru import logger

class DataEncryption:
    """
    Manejador de encriptación para datos sensibles

    Usa encriptación simétrica con Fernet para proteger:
    - Información personal identificable (PII)
    - Datos de configuración sensibles
    - Tokens y credenciales
    """

    def __init__(self, key: Optional[str] = None):
        """
        Inicializar el sistema de encriptación

        Args:
            key: Clave de encriptación base64. Si no se proporciona, se genera desde env
        """
        if key:
            self.key = key.encode() if isinstance(key, str) else key
        else:
            # Obtener o generar clave desde variables de entorno
            env_key = os.getenv("ENCRYPTION_KEY")

            if env_key:
                self.key = env_key.encode()
            else:
                # Generar nueva clave si no existe
                self.key = self._generate_key_from_password(
                    os.getenv("ENCRYPTION_PASSWORD", "default-dev-password")
                )

        try:
            self.cipher = Fernet(self.key)
            logger.info("Encryption system initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize encryption: {e}")
            raise ValueError("Invalid encryption key")

    def _generate_key_from_password(self, password: str) -> bytes:
        """
        Generar clave de encriptación desde una contraseña

        Args:
            password: Contraseña para derivar la clave

        Returns:
            Clave de encriptación compatible con Fernet
        """
        salt = os.getenv("ENCRYPTION_SALT", "default-salt").encode()

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )

        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key

    @classmethod
    def generate_new_key(cls) -> str:
        """
        Generar nueva clave de encriptación

        Returns:
            Nueva clave en formato string base64
        """
        return Fernet.generate_key().decode()

    def encrypt(self, data: str) -> str:
        """
        Encriptar string de datos

        Args:
            data: Datos a encriptar

        Returns:
            Datos encriptados en base64
        """
        if not data:
            return data

        try:
            encrypted = self.cipher.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise

    def decrypt(self, encrypted_data: str) -> str:
        """
        Desencriptar datos

        Args:
            encrypted_data: Datos encriptados en base64

        Returns:
            Datos originales desencriptados
        """
        if not encrypted_data:
            return encrypted_data

        try:
            decoded = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self.cipher.decrypt(decoded)
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise

    def encrypt_dict(self, data: Dict) -> str:
        """
        Encriptar diccionario completo

        Args:
            data: Diccionario a encriptar

        Returns:
            JSON encriptado en base64
        """
        json_str = json.dumps(data)
        return self.encrypt(json_str)

    def decrypt_dict(self, encrypted_data: str) -> Dict:
        """
        Desencriptar diccionario

        Args:
            encrypted_data: JSON encriptado en base64

        Returns:
            Diccionario original
        """
        json_str = self.decrypt(encrypted_data)
        return json.loads(json_str)

    def encrypt_field(self, value: Any, field_type: str = "string") -> str:
        """
        Encriptar un campo específico según su tipo

        Args:
            value: Valor a encriptar
            field_type: Tipo de campo (string, int, float, bool, json)

        Returns:
            Valor encriptado con metadata de tipo
        """
        if value is None:
            return None

        # Preparar metadata
        metadata = {
            "type": field_type,
            "value": value
        }

        # Serializar y encriptar
        return self.encrypt_dict(metadata)

    def decrypt_field(self, encrypted_value: str) -> Any:
        """
        Desencriptar un campo preservando su tipo original

        Args:
            encrypted_value: Valor encriptado con metadata

        Returns:
            Valor original con tipo correcto
        """
        if encrypted_value is None:
            return None

        try:
            # Desencriptar y obtener metadata
            metadata = self.decrypt_dict(encrypted_value)

            value = metadata["value"]
            field_type = metadata["type"]

            # Convertir al tipo original
            if field_type == "int":
                return int(value)
            elif field_type == "float":
                return float(value)
            elif field_type == "bool":
                return bool(value)
            else:
                return value

        except Exception as e:
            logger.error(f"Failed to decrypt field: {e}")
            return None


class FieldEncryptor:
    """
    Encriptador específico para campos de base de datos

    Permite encriptar/desencriptar selectivamente campos sensibles
    """

    # Campos que deben ser encriptados
    ENCRYPTED_FIELDS = {
        "users": ["email", "full_name", "administrator_name"],
        "reports": ["relevant_facts"],
        "incidents": ["employee_name", "notes"],
        "movements": ["employee_name", "notes"],
        "audit_logs": ["details"]
    }

    def __init__(self):
        self.encryptor = DataEncryption()

    def should_encrypt_field(self, table: str, field: str) -> bool:
        """
        Determinar si un campo debe ser encriptado

        Args:
            table: Nombre de la tabla
            field: Nombre del campo

        Returns:
            True si el campo debe ser encriptado
        """
        return field in self.ENCRYPTED_FIELDS.get(table, [])

    def encrypt_model_fields(self, model_instance: Any, table: str) -> Any:
        """
        Encriptar campos sensibles de un modelo

        Args:
            model_instance: Instancia del modelo SQLAlchemy
            table: Nombre de la tabla

        Returns:
            Modelo con campos encriptados
        """
        encrypted_fields = self.ENCRYPTED_FIELDS.get(table, [])

        for field in encrypted_fields:
            if hasattr(model_instance, field):
                value = getattr(model_instance, field)
                if value and not self._is_encrypted(value):
                    encrypted = self.encryptor.encrypt(str(value))
                    setattr(model_instance, field, encrypted)

        return model_instance

    def decrypt_model_fields(self, model_instance: Any, table: str) -> Any:
        """
        Desencriptar campos sensibles de un modelo

        Args:
            model_instance: Instancia del modelo SQLAlchemy
            table: Nombre de la tabla

        Returns:
            Modelo con campos desencriptados
        """
        encrypted_fields = self.ENCRYPTED_FIELDS.get(table, [])

        for field in encrypted_fields:
            if hasattr(model_instance, field):
                value = getattr(model_instance, field)
                if value and self._is_encrypted(value):
                    try:
                        decrypted = self.encryptor.decrypt(str(value))
                        setattr(model_instance, field, decrypted)
                    except Exception as e:
                        logger.warning(f"Could not decrypt field {field}: {e}")

        return model_instance

    def _is_encrypted(self, value: str) -> bool:
        """
        Verificar si un valor ya está encriptado

        Args:
            value: Valor a verificar

        Returns:
            True si el valor parece estar encriptado
        """
        if not value or not isinstance(value, str):
            return False

        # Los valores encriptados con Fernet empiezan con 'gAAAAA'
        # después de ser codificados en base64
        try:
            decoded = base64.urlsafe_b64decode(value.encode())
            return decoded.startswith(b'gAAAAA')
        except:
            return False

    def encrypt_dict_fields(self, data: Dict, table: str) -> Dict:
        """
        Encriptar campos sensibles en un diccionario

        Args:
            data: Diccionario con datos
            table: Nombre de la tabla

        Returns:
            Diccionario con campos encriptados
        """
        encrypted_fields = self.ENCRYPTED_FIELDS.get(table, [])
        result = data.copy()

        for field in encrypted_fields:
            if field in result and result[field]:
                if not self._is_encrypted(str(result[field])):
                    result[field] = self.encryptor.encrypt(str(result[field]))

        return result

    def decrypt_dict_fields(self, data: Dict, table: str) -> Dict:
        """
        Desencriptar campos sensibles en un diccionario

        Args:
            data: Diccionario con datos encriptados
            table: Nombre de la tabla

        Returns:
            Diccionario con campos desencriptados
        """
        encrypted_fields = self.ENCRYPTED_FIELDS.get(table, [])
        result = data.copy()

        for field in encrypted_fields:
            if field in result and result[field]:
                if self._is_encrypted(str(result[field])):
                    try:
                        result[field] = self.encryptor.decrypt(str(result[field]))
                    except Exception as e:
                        logger.warning(f"Could not decrypt field {field}: {e}")

        return result


class TokenEncryption:
    """
    Encriptación específica para tokens y credenciales
    """

    def __init__(self):
        self.encryptor = DataEncryption()

    def encrypt_token(self, token: str, metadata: Optional[Dict] = None) -> str:
        """
        Encriptar token con metadata opcional

        Args:
            token: Token a encriptar
            metadata: Metadata adicional (expiry, type, etc)

        Returns:
            Token encriptado
        """
        data = {
            "token": token,
            "metadata": metadata or {},
            "encrypted_at": datetime.now().isoformat()
        }

        return self.encryptor.encrypt_dict(data)

    def decrypt_token(self, encrypted_token: str) -> tuple[str, Dict]:
        """
        Desencriptar token y obtener metadata

        Args:
            encrypted_token: Token encriptado

        Returns:
            Tupla (token, metadata)
        """
        try:
            data = self.encryptor.decrypt_dict(encrypted_token)
            return data["token"], data.get("metadata", {})
        except Exception as e:
            logger.error(f"Failed to decrypt token: {e}")
            return None, {}


# Instancias globales
data_encryptor = DataEncryption()
field_encryptor = FieldEncryptor()
token_encryptor = TokenEncryption()

# Función helper para testing
def test_encryption():
    """Probar que la encriptación funcione correctamente"""
    try:
        # Test básico
        original = "sensitive data"
        encrypted = data_encryptor.encrypt(original)
        decrypted = data_encryptor.decrypt(encrypted)

        assert original == decrypted, "Encryption/Decryption failed"

        # Test diccionario
        original_dict = {"user": "test", "password": "secret"}
        encrypted_dict = data_encryptor.encrypt_dict(original_dict)
        decrypted_dict = data_encryptor.decrypt_dict(encrypted_dict)

        assert original_dict == decrypted_dict, "Dict encryption failed"

        logger.info("Encryption system test passed ✓")
        return True

    except Exception as e:
        logger.error(f"Encryption system test failed: {e}")
        return False