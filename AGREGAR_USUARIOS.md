# 📝 Guía para Agregar Nuevos Usuarios al Sistema

Esta guía explica paso a paso cómo agregar un nuevo usuario/administrador al sistema de reportes diarios.

## 🎯 Información Necesaria

Antes de comenzar, necesitas tener la siguiente información del nuevo usuario:

- **Nombre completo**: Ejemplo: "María Pérez Gómez"
- **Usuario (email)**: Ejemplo: "maria.perez@inemec.com"
- **Contraseña**: Contraseña inicial que usará
- **Rol**: `form_user` (solo formulario) o `admin_user` (formulario + panel admin)
- **Área**: Ejemplo: "VPI CUSIANA", "Administrativo Bogota", etc.
- **Cliente/Operación asignada**: Ejemplo: "VPI CUSIANA", "Sierracol CEDCO", etc.

---

## 📂 Archivos a Modificar

### ✅ FRONTEND (3 archivos)

#### **1. Frontend: `/frontend/src/config/users.js`**

**Qué hace:** Define las credenciales de acceso y roles de los usuarios.

**Cómo agregar:**
```javascript
export const USERS = [
  // ... usuarios existentes ...

  // Nuevo usuario - María Pérez
  {
    id: 7,  // ⚠️ Usar el siguiente ID disponible
    username: 'maria.perez@inemec.com',
    password: 'mariaperez2025',  // ⚠️ Cambiar después del primer login
    fullName: 'María Pérez Gómez',
    role: 'form_user',  // o 'admin_user' si necesita acceso admin
    area: 'VPI CUSIANA'
  }
]
```

**⚠️ Importante:**
- El `id` debe ser único y consecutivo
- El `username` debe ser un email válido
- El `fullName` debe coincidir EXACTAMENTE con el resto de archivos
- `role` puede ser: `form_user` o `admin_user`

---

#### **2. Frontend: `/frontend/src/services/constants.js`**

**Qué hace:** Lista de administradores válidos para el formulario.

**Cómo agregar:**
```javascript
export const ADMINISTRATORS = [
  'Adriana Robayo',
  'Angela Ramirez',
  'Floribe Correa',
  'Julieth Rincon',
  'Eddinson Javier Martinez',
  'Jorge Iván Alvarado Celis',
  'Kellis Minosca Morquera',
  'Kenia Sanchez',
  'Liliana Romero',
  'Marcela Cusba Gomez',
  'María Pérez Gómez',  // ⬅️ AGREGAR AQUÍ (orden alfabético recomendado)
  'Mirledys García San Juan',
  'Yolima Arenas Zarate'
]
```

**⚠️ Importante:**
- El nombre debe ser EXACTAMENTE igual que en `users.js`
- Respetar tildes y caracteres especiales

---

#### **3. Frontend: `/frontend/src/config/adminMapping.js`**

**Qué hace:** Mapea cada administrador a su cliente/operación asignada.

**Cómo agregar:**
```javascript
export const ADMIN_CLIENT_MAPPING = {
  'Adriana Robayo': 'Consorcio P&C',
  'Angela Ramirez': 'Confiabilidad VRC',
  'Floribe Correa': 'Administrativo Bogota',
  // ... otros administradores ...
  'María Pérez Gómez': 'VPI CUSIANA',  // ⬅️ AGREGAR AQUÍ
  'Yolima Arenas Zarate': 'VPI CUPIAGUA'
}
```

**⚠️ Importante:**
- El cliente/operación debe existir en la lista de `CLIENT_OPERATIONS`
- Si es un cliente nuevo, también deberás agregarlo al backend

---

### ✅ BACKEND (3 archivos)

#### **4. Backend: `/backend/src/models.py`**

**Qué hace:** Define el enum de administradores válidos para validación Pydantic.

**Cómo agregar:**
```python
class AdministratorEnum(str, Enum):
    """Administradores validos segun especificaciones"""
    ADRIANA_ROBAYO = "Adriana Robayo"
    ANGELA_RAMIREZ = "Angela Ramirez"
    FLORIBE_CORREA = "Floribe Correa"
    JULIETH_RINCON = "Julieth Rincon"
    EDDINSON_MARTINEZ = "Eddinson Javier Martinez"
    JORGE_ALVARADO = "Jorge Iván Alvarado Celis"
    KELLIS_MORQUERA = "Kellis Minosca Morquera"
    KENIA_SANCHEZ = "Kenia Sanchez"
    LILIANA_ROMERO = "Liliana Romero"
    MARCELA_CUSBA = "Marcela Cusba Gomez"
    MARIA_PEREZ = "María Pérez Gómez"  # ⬅️ AGREGAR AQUÍ
    MIRLEDYS_GARCIA = "Mirledys Garcia San Juan"
    YOLIMA_ARENAS = "Yolima Arenas Zarate"
```

**⚠️ Importante:**
- La clave (ej: `MARIA_PEREZ`) debe ser en MAYÚSCULAS con guiones bajos
- El valor (ej: `"María Pérez Gómez"`) debe coincidir EXACTAMENTE con el frontend

---

#### **5. Backend: `/backend/src/config.py`**

**Qué hace:** Lista de administradores para configuración del sistema.

**Cómo agregar:**
```python
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
    "María Pérez Gómez",  # ⬅️ AGREGAR AQUÍ
    "Mirledys Garcia San Juan",
    "Yolima Arenas Zarate"
]
```

---

#### **6. Backend: `/backend/src/email_service.py`**

**Qué hace:** Mapea administradores a sus emails para notificaciones.

**Cómo agregar:**
```python
self.admin_emails = {
    "Adriana Robayo": "administrador@inemec-pyc.com",
    "Angela Ramirez": "admon.vrc@inemec.com",
    "Floribe Correa": "asistente.admonrh@inemec.com",
    "Julieth Rincon": "administradora.sc@inemec.com",
    "Eddinson Javier Martinez": "admincus.ggs@inemec.com",
    "Jorge Iván Alvarado Celis": "adminflo.ggs@inemec.com",
    "Kenia Sanchez": "admon.sierracolclm@inemec.com",
    "Liliana Romero": "contadora@inemec.com",
    "Marcela Cusba Gomez": "administrador.ggs@inemec.com",
    "María Pérez Gómez": "maria.perez@inemec.com",  # ⬅️ AGREGAR AQUÍ
    "Mirledys Garcia San Juan": "admonjr.sierracolcrm@inemec.com",
    "Yolima Arenas Zarate": "admincup.ggs@inemec.com",
}
```

---

## 🚀 Despliegue de Cambios

### **Desarrollo Local:**
```bash
# Reiniciar contenedores para aplicar cambios
docker-compose restart backend
docker-compose restart frontend

# Verificar logs
docker logs reportes-backend --tail 50
docker logs reportes-frontend --tail 50
```

### **Producción (Cloudflare Tunnel):**
```bash
# Rebuild y restart de contenedores
docker-compose build
docker-compose up -d

# Verificar que todo funciona
curl https://api.reportediario.inemec.com/health
```

---

## ✅ Checklist de Verificación

Usa este checklist para asegurarte de que no olvidaste nada:

- [ ] ✅ Agregado en `frontend/src/config/users.js`
- [ ] ✅ Agregado en `frontend/src/services/constants.js`
- [ ] ✅ Agregado en `frontend/src/config/adminMapping.js`
- [ ] ✅ Agregado en `backend/src/models.py`
- [ ] ✅ Agregado en `backend/src/config.py`
- [ ] ✅ Agregado en `backend/src/email_service.py`
- [ ] ✅ El nombre es IDÉNTICO en todos los archivos
- [ ] ✅ El cliente/operación asignada existe
- [ ] ✅ Backend reiniciado
- [ ] ✅ Frontend reiniciado
- [ ] ✅ Prueba de login exitosa
- [ ] ✅ Prueba de envío de reporte exitosa

---

## 🧪 Pruebas

### **1. Probar Login**
```bash
# Acceder a: http://localhost:4501 (desarrollo) o https://reportediario2.inemec.com (producción)
# Usar las credenciales configuradas en users.js
```

### **2. Probar Envío de Reporte**
```bash
# Iniciar sesión con el nuevo usuario
# Llenar el formulario y enviar
# Verificar en logs del backend:
docker logs reportes-backend --tail 50 | grep "María Pérez"
```

### **3. Verificar en Dashboard Admin**
```bash
# Acceder al panel admin (si tienes permisos)
# Verificar que el reporte aparece correctamente
```

---

## ⚠️ Errores Comunes

### **Error: "Input should be... or..."**
**Causa:** El nombre no coincide exactamente entre frontend y backend.
**Solución:** Verificar que el nombre sea IDÉNTICO en todos los archivos (tildes, espacios, mayúsculas).

### **Error: "No se encontró cliente asignado"**
**Causa:** El cliente/operación no existe o no está mapeado.
**Solución:** Agregar el cliente en `adminMapping.js` y verificar que existe en `CLIENT_OPERATIONS`.

### **Error: "Email no encontrado para administrador"**
**Causa:** El administrador no está en `email_service.py`.
**Solución:** Agregar el email del administrador en el diccionario `admin_emails`.

---

## 📚 Recursos Adicionales

- **Documentación del sistema:** `CLAUDE.md`
- **Estructura de base de datos:** `backend/src/config.py` (EXCEL_SCHEMA)
- **Modelos de validación:** `backend/src/models.py`
- **Configuración de usuarios:** `frontend/src/config/users.js`

---

## 🔒 Seguridad

**⚠️ IMPORTANTE:**

1. **Contraseñas temporales:** Los usuarios deben cambiar su contraseña después del primer login
2. **No subir credenciales:** El archivo `users.js` contiene contraseñas en texto plano - considerar implementar autenticación con backend
3. **Variables de entorno:** Las credenciales SMTP están en `.env.tunnel` (no debe subirse a git)

---

## 📞 Soporte

Si tienes problemas al agregar un usuario:

1. Verificar logs del backend: `docker logs reportes-backend --tail 100`
2. Verificar logs del frontend: `docker logs reportes-frontend --tail 100`
3. Revisar que todos los archivos tengan el nombre EXACTAMENTE igual
4. Contactar al equipo de Nuevas Tecnologías

---

**Última actualización:** Octubre 2025
**Mantenido por:** Equipo de Nuevas Tecnologías - INEMEC
