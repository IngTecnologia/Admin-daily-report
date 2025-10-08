# Changelog - 2025-10-08

## 🔧 Cambios Implementados

### 1. Validación de Horas Máximas Corregida
**Archivo:** `frontend/src/services/constants.js:59`
- **Antes:** `max: 24`
- **Ahora:** `max: 1000`
- **Razón:** Permitir valores de horas superiores a 24 para reportes que cubren múltiples días

### 2. Interpretación de Fechas Corregida
**Archivo:** `frontend/src/components/form/DynamicIncidentFields.jsx:121-131`
- **Problema:** Las fechas en formato YYYY-MM-DD se interpretaban como UTC, causando desfase de un día
- **Solución:** Parser manual de componentes de fecha para crear fecha local
```javascript
const [year, month, day] = incident.fecha_fin.split('-').map(Number)
const date = new Date(year, month - 1, day)
```

### 3. Operación Seleccionada en Resumen
**Archivo:** `frontend/src/components/form/DailyReportForm.jsx:439`
- **Antes:** Usaba `getClientForAdmin()` (método legacy)
- **Ahora:** Usa `selectedOperation` directamente
- **Beneficio:** Muestra correctamente la operación seleccionada cuando el usuario tiene múltiples operaciones

### 4. Validación Flexible de Operaciones (Backend)
**Archivo:** `backend/src/models.py:33,35`
- **Antes:** Validación estricta con Enums (AdministratorEnum, ClientOperationEnum)
- **Ahora:** Validación flexible con strings (min_length=3, max_length=255)
- **Razón:** Permite agregar nuevas operaciones sin modificar código
- **Cambios relacionados:**
  - `backend/src/api.py:221,227` - Removido `.value` de `report.administrador`
  - `backend/src/excel_handler.py:254-255,286-287` - Removido `.value` de `report.administrador` y `report.cliente_operacion`

### 5. Soporte Multi-Operación para Usuarios
**Archivos modificados:**
- `backend/src/database/models.py:63` - Agregado campo JSONB `client_operations`
- `backend/src/auth/auth_routes.py:155-177` - Nuevo endpoint `/api/v1/auth/me/operations`
- `frontend/src/components/form/DailyReportForm.jsx:30-83,289-332` - Dropdown para selección de operación

**Usuarios actualizados en base de datos:**
```sql
UPDATE reports.users SET client_operations = '["VPI transversales", "VPI Mayor"]'::jsonb
WHERE full_name = 'Handerson Daniel Cordoba Perafan';

UPDATE reports.users SET client_operations = '["Sierracol Caño limón", "Sierracol Telecomunicaciones"]'::jsonb
WHERE full_name = 'Kellis Minosca Mosquera';

UPDATE reports.users SET client_operations = '["Administración Bogotá", "Parex Quimico"]'::jsonb
WHERE full_name = 'Floribe Correa';
```

### 6. Contraseñas Reseteadas
**Script usado:** `/tmp/reset_passwords.py`
- **Handerson Daniel Cordoba Perafan:** `handerson2025`
- **Kellis Minosca Mosquera:** `kellis2025`

### 7. Health Check del Frontend Corregido
**Archivo:** `docker-compose.yml:62`
- **Antes:** `http://localhost:80/health`
- **Ahora:** `http://127.0.0.1:80/health`
- **Razón:** Problemas de resolución DNS con `localhost` en el contenedor

---

## 📋 Cómo Aplicar Estos Cambios

### Para Código (Backend/Frontend)
Los cambios en código se aplican automáticamente con:
```bash
./deploy-tunnel.sh restart
```

Este comando:
1. Detiene los servicios
2. **Reconstruye las imágenes Docker** con el código actualizado
3. Reinicia los contenedores

### Para Base de Datos
Los cambios en base de datos requieren ejecutar scripts SQL manualmente:
```bash
# Conectarse a PostgreSQL
docker exec -it reportes-postgres psql -U postgres -d reportes_diarios

# Ejecutar SQL de cambios
-- Ver CHANGELOG para scripts específicos
```

### Para Variables de Entorno
Actualizar ambos archivos:
- `.env` (desarrollo local)
- `.env.tunnel` (producción)

Luego reiniciar: `./deploy-tunnel.sh restart`

---

## ✅ Verificaciones Post-Deployment

- [x] Frontend carga correctamente
- [x] Backend responde en /health
- [x] Túnel de Cloudflare conectado
- [x] Login funciona para usuarios multi-operación
- [x] Formulario muestra dropdown de operaciones
- [x] Validación de horas permite hasta 1000
- [x] Fechas se interpretan correctamente
- [x] Resumen muestra operación seleccionada
- [x] Reportes se pueden enviar sin errores

---

## 🔍 Logs de Errores Solucionados

### Error 1: `'str' object has no attribute 'value'`
**Causa:** Código intentaba acceder a `.value` en strings (antes eran Enums)
**Solución:** Removido `.value` en `api.py` y `excel_handler.py`
**Archivos:** `backend/src/api.py`, `backend/src/excel_handler.py`

### Error 2: "Usuario o contraseña incorrectos"
**Causa:** Contraseñas en base de datos no coincidían con las esperadas
**Solución:** Ejecutado script de reset de contraseñas
**Usuarios afectados:** Handerson, Kellis

### Error 3: Validación rechaza "VPI transversales"
**Causa:** Enum estricto no incluía nuevas operaciones
**Solución:** Cambio a validación string flexible
**Archivo:** `backend/src/models.py`

---

## 📌 Notas Importantes

1. **Dos Entornos:** Este proyecto tiene desarrollo (`docker-compose.yml`) y producción (`docker-compose.tunnel.yml`)
2. **Replicabilidad:** Todos los cambios en código son replicables con rebuild. Cambios en DB requieren scripts SQL documentados.
3. **Scripts de Reset:** El script `/tmp/reset_passwords.py` debe ser ejecutado dentro del contenedor backend con credenciales correctas.
4. **Credenciales Actualizadas:** Ver `RESUMEN_USUARIOS.md` para credenciales actuales.

---

**Última actualización:** 2025-10-08 19:15
**Deploy realizado con:** `./deploy-tunnel.sh restart`
**Estado:** ✅ Todos los cambios aplicados y verificados en producción
