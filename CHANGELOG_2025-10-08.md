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

### 8. Dual-Write a PostgreSQL (CRÍTICO)
**Archivos modificados:**
- `backend/src/api.py:188-285` - Nueva función `save_report_to_postgres()`
- `backend/src/api.py:324-339` - Modificado endpoint POST `/api/v1/reportes` para dual-write
- `backend/src/api.py:23` - Agregado import `get_bogota_now`

**Problema:** Los reportes se guardaban solo en Excel, pero las consultas leían de PostgreSQL
**Solución:** Implementado dual-write - ahora los reportes se guardan en AMBOS sistemas

**Cómo funciona:**
```python
# 1. Guarda en Excel (legacy)
saved_report = excel_handler.save_report(report, client_info)

# 2. Guarda en PostgreSQL (nuevo)
postgres_id = save_report_to_postgres(
    report=report,
    admin_name=report.administrador,
    client_info=client_info,
    report_date=today
)
```

**Beneficios:**
- ✅ Reportes aparecen en dashboard de administradores
- ✅ Bandera "Ya reportaste hoy" funciona correctamente
- ✅ Compatibilidad con sistema legacy (Excel)
- ✅ Transición gradual a PostgreSQL

**Nota:** Si el usuario no se encuentra en PostgreSQL (por administrator_name), el reporte solo se guarda en Excel con un warning en logs.

---

## 🎯 Próximos Pasos

### Para usuarios multi-operación:
El sistema actual guarda un reporte por administrador por día. Si Handerson reporta para "VPI transversales", el sistema mostrará que ya reportó. **Solución pendiente:** Necesitamos modificar la lógica para permitir múltiples reportes del mismo administrador si son de diferentes operaciones.

---

### 9. Lógica de Reportes por Operación (CRÍTICO)
**Archivos modificados:**
- `backend/src/api.py:392-407` - Endpoint GET `/reportes/admin/{admin_name}/today` ahora acepta parámetro `operacion`
- `frontend/src/components/form/TodayReportsStatus.jsx:20-22,68` - Pasa operación seleccionada a API
- `frontend/src/pages/Home.jsx:7,37` - Gestión de estado de operación seleccionada
- `frontend/src/components/form/DailyReportForm.jsx:14,85-90` - Notifica cambios de operación al padre

**Problema:** Sistema permitía solo un reporte por administrador por día, pero usuarios multi-operación necesitan reportar para cada operación

**Solución implementada:**
1. Backend filtra verificación por operación cuando se especifica:
```python
# Si operacion se especifica en query params, filtrar por ella
if operacion:
    query = query.filter(
        func.lower(Report.client_operation) == operacion.lower()
    )
```

2. Frontend pasa operación seleccionada:
```javascript
// TodayReportsStatus.jsx
const url = selectedOperation
  ? `${API_BASE_URL}/reportes/admin/${adminName}/today?operacion=${selectedOperation}`
  : `${API_BASE_URL}/reportes/admin/${adminName}/today`
```

3. Form solo se deshabilita cuando se ha reportado para la operación ESPECÍFICA:
```javascript
// Home.jsx
<DailyReportForm
  isDisabled={selectedOperation && hasReportsToday}
  onOperationChange={setSelectedOperation}
/>
```

**Flujo de usuario:**
1. Handerson inicia sesión
2. Ve dropdown con "VPI transversales" y "VPI Mayor"
3. Selecciona "VPI transversales" → Banner muestra: "Listo para reportar para VPI transversales"
4. Envía reporte para "VPI transversales" → Banner muestra: "Ya reportaste para VPI transversales hoy"
5. Cambia a "VPI Mayor" → Banner muestra: "Listo para reportar para VPI Mayor"
6. Puede enviar segundo reporte para "VPI Mayor"

**Base de datos:** No hay unique constraint en (administrator, report_date), permitiendo múltiples reportes por admin/día siempre que sean de diferentes operaciones

---

### 10. Corrección: Formulario Deshabilitado Sin Operación Seleccionada
**Archivos modificados:**
- `frontend/src/components/form/TodayReportsStatus.jsx:72-79,156-186` - Lógica mejorada para notificación y mensajes

**Problema:** Después de reportar para una operación, al recargar la página el formulario quedaba deshabilitado sin poder seleccionar otra operación

**Causa raíz:**
1. Usuario inicia sesión sin operación seleccionada (`selectedOperation = null`)
2. TodayReportsStatus consulta SIN filtro → encuentra reportes
3. Notifica `onReportsChange(true)` → deshabilita formulario
4. Usuario no podía seleccionar otra operación porque formulario deshabilitado

**Solución:**
```javascript
// Solo deshabilitar cuando HAY operación seleccionada Y ya reportó para ella
const shouldDisable = selectedOperation ? (reportsInfo.ha_reportado || false) : false
onReportsChange(shouldDisable)
```

**Mejoras en UX:**
1. **Banner azul informativo** cuando no hay operación seleccionada (en lugar de amarillo advertencia)
2. **Mensaje claro:** "Selecciona otra operación abajo para enviar un nuevo reporte"
3. **Formulario siempre habilitado** cuando no hay operación seleccionada
4. **Banner amarillo** solo cuando operación seleccionada y ya reportada

**Flujo corregido:**
1. Handerson inicia sesión → Banner azul: "Has enviado 1 reporte(s) hoy - VPI Transversales - 👇 Selecciona otra operación"
2. Formulario HABILITADO → Puede ver y usar dropdown
3. Selecciona "VPI Mayor" → Banner verde: "Listo para reportar para VPI Mayor"
4. Envía reporte → Banner amarillo: "Ya reportaste para VPI Mayor hoy"
5. Puede cambiar a otra operación sin problema

---

### 11. Corrección CRÍTICA: Autoselección de Operación (Bug Root Cause)
**Archivo modificado:**
- `backend/src/auth/auth_routes.py:421-422` - Cambio en lógica de `default_operation`

**Problema:** Handerson no podía enviar segundo reporte porque el sistema autoseleccionaba "VPI transversales" al iniciar sesión, y al estar ya reportada, deshabilitaba el formulario

**Causa raíz encontrada:**
El backend devolvía SIEMPRE `operations[0]` como `default_operation`, incluso para usuarios con múltiples operaciones:
```python
# ANTES (INCORRECTO):
"default_operation": operations[0] if operations else None
# Handerson tiene 2 ops → devolvía "VPI transversales" como default
```

El frontend autoseleccionaba esa operación (DailyReportForm.jsx líneas 54-56):
```javascript
} else if (data.default_operation) {
    setSelectedOperation(data.default_operation)  // Autoselecciona!
}
```

**Flujo del bug:**
1. Handerson inicia sesión
2. Backend devuelve `default_operation: "VPI transversales"`
3. Frontend autoselecciona "VPI transversales"
4. TodayReportsStatus consulta con filtro `operacion=VPI transversales`
5. Encuentra reporte → `ha_reportado = true`
6. Deshabilita formulario → No puede cambiar a otra operación

**Solución:**
```python
# AHORA (CORRECTO):
"default_operation": operations[0] if len(operations) == 1 else None
# Handerson tiene 2 ops → devuelve None (no autoselecciona)
# Usuario con 1 op → autoselecciona (conveniente)
```

**Resultado:**
- Usuarios con 1 operación: Autoselección (no tienen que elegir)
- Usuarios con 2+ operaciones: NO autoselecciona (deben elegir manualmente)
- Formulario permanece habilitado hasta que usuario elige operación

---

### 12. Corrección de Timezone en Hora de Reportes
**Archivos modificados:**
- `backend/src/api.py:189-212,502,595,770,1169` - Nueva función helper `convert_to_bogota_timezone()`
- Endpoints que devuelven `Fecha_Creacion` ahora convierten a timezone de Bogotá

**Problema:** Las horas en el módulo admin se mostraban 5 horas atrás (UTC en lugar de Colombia GMT-5)

**Solución:**
```python
def convert_to_bogota_timezone(dt: Optional[datetime]) -> Optional[str]:
    """Convierte datetime a timezone de Bogotá"""
    if not dt:
        return None
    local_tz = pytz.timezone(settings.timezone)
    if dt.tzinfo is None:
        dt_utc = pytz.UTC.localize(dt)
        dt_bogota = dt_utc.astimezone(local_tz)
    else:
        dt_bogota = dt.astimezone(local_tz)
    return dt_bogota.isoformat()
```

**Resultado:** Todas las horas ahora se muestran correctamente en hora de Colombia

---

### 13. Permitir Selección del Día de Hoy en Fecha Fin de Incidencia
**Archivo modificado:**
- `frontend/src/hooks/useForm.js:67-69` - Corrección en validación de fecha

**Problema:** El sistema rechazaba la fecha de hoy al reportar incidencias, mostrando error de validación

**Causa raíz:**
```javascript
// ANTES (incorrecto):
const selectedDate = new Date(value)  // "2025-10-08" → UTC medianoche → local 19:00 del día anterior
```
JavaScript interpretaba el string "YYYY-MM-DD" como UTC, causando desfase de timezone

**Solución:**
```javascript
// AHORA (correcto):
const [year, month, day] = value.split('-').map(Number)
const selectedDate = new Date(year, month - 1, day)  // Fecha local sin ambigüedad
```

**Resultado:** Ahora se puede seleccionar el día de hoy como fecha fin de incidencia sin errores

---

### 14. Nueva Opción de Incidencia: "Permiso Remunerado"
**Archivos modificados:**
- `frontend/src/services/constants.js:42` - Agregado a INCIDENT_TYPES
- `backend/src/config.py:167` - Agregado a INCIDENT_TYPES
- `backend/src/database/models.py:34` - Agregado al Enum IncidentType

**Cambio:** Agregado nuevo tipo de incidencia "Permiso Remunerado" entre "Dia de la Familia" y "Suspensiones de contrato"

**Lista actualizada:**
1. Incapacidad Medica Por Enfermedad Comun
2. Incapacidad Medica por Enfermedad Laboral
3. Permiso por Cita Medica
4. Licencia de Maternidad
5. Licencia de paternidad
6. Permiso por Luto
7. Permiso por Calamidad Domestica
8. Vacaciones
9. Compensatorios
10. Dia de la Familia
11. **Permiso Remunerado** ← NUEVO
12. Suspensiones de contrato
13. Permisos no remunerados

---

### 15. Funcionalidad de Eliminación de Reportes para Administradores
**Archivos modificados:**
- `frontend/src/components/admin/ReportDetail.jsx:4,7-15,117-142,905-1023` - Botón y modal de eliminación
- `backend/src/api.py:1197-1272` - Endpoint DELETE con dual-delete

**Funcionalidad:** Los administradores del sistema ahora pueden eliminar reportes desde la vista de detalle

**Implementación Frontend:**
```javascript
// Verificar si es administrador
const { hasAdminAccess } = useAuth()

// Botón solo visible para admins
{hasAdminAccess() && !isEditing && (
  <button onClick={() => setShowDeleteConfirm(true)}>
    🗑️ Eliminar Reporte
  </button>
)}
```

**Modal de confirmación:**
- ⚠️ Advertencia clara: "Esta acción NO se puede deshacer"
- 📋 Muestra información del reporte a eliminar (ID, Administrador, Operación)
- Confirmación explícita requerida
- Estados de carga durante eliminación

**Implementación Backend (Dual-Delete):**
```python
# 1. Eliminar de Excel (sistema legacy)
excel_success = excel_handler.delete_report(report_id)

# 2. Eliminar de PostgreSQL (sistema nuevo)
report = db.query(Report).filter(Report.id == report_id).first()
if report:
    db.delete(report)  # Cascada elimina incidencias y movimientos
    db.commit()
```

**Características:**
- ✅ Solo visible para administradores de sistema
- ✅ Dual-delete: elimina de Excel Y PostgreSQL
- ✅ Eliminación en cascada (incidencias y movimientos)
- ✅ Modal de confirmación con doble verificación
- ✅ Sin restricción de fecha para admins
- ✅ Actualiza lista automáticamente después de eliminar
- ✅ Logging de auditoría

**Flujo de uso:**
1. Admin abre detalle de un reporte
2. Ve botón rojo "🗑️ Eliminar Reporte"
3. Click → Modal de confirmación
4. Confirma → Eliminación dual (Excel + PostgreSQL)
5. Lista se actualiza automáticamente

**Uso para pruebas:**
Permite a los administradores eliminar reportes de prueba antes de validar con todos los usuarios.

---

### 16. Fix: Eliminación de Reportes Solo en PostgreSQL
**Archivo modificado:**
- `backend/src/api.py:1203-1295` - Lógica de eliminación mejorada

**Problema:** Error al intentar eliminar reportes que solo existen en PostgreSQL (con UUID)
```
Error: Reporte 15fd83ea-e2c8-4061-ba4a-12019e79e5f5 no encontrado
```

**Causa:** El endpoint buscaba primero en Excel, pero reportes nuevos (creados con dual-write) solo existen en PostgreSQL con UUID

**Solución - Nueva lógica de eliminación:**
```python
# 1. Intentar eliminar de PostgreSQL primero (búsqueda por UUID)
report = db.query(Report).filter(Report.id == report_id).first()
if report:
    # Guardar legacy_id si existe
    legacy_id = report.legacy_id
    db.delete(report)

    # Si tiene legacy_id, intentar eliminar también de Excel
    if legacy_id:
        excel_handler.delete_report(legacy_id)

# 2. Si no está en PostgreSQL, buscar en Excel
if not report_found:
    report_to_delete = next((r for r in all_reports if r.get('ID') == report_id), None)
    if report_to_delete:
        excel_handler.delete_report(report_id)
```

**Beneficios:**
- ✅ Elimina reportes que solo existen en PostgreSQL (UUID)
- ✅ Elimina reportes que solo existen en Excel (legacy)
- ✅ Dual-delete cuando el reporte existe en ambos sistemas
- ✅ Manejo robusto de errores en cada sistema

**Casos cubiertos:**
1. Reporte solo en PostgreSQL → Eliminación exitosa
2. Reporte solo en Excel → Eliminación exitosa
3. Reporte en ambos (con legacy_id) → Dual-delete exitoso
4. Reporte en ninguno → Error 404 apropiado

---

**Última actualización:** 2025-10-08 20:42
**Deploy realizado con:** `./deploy-tunnel.sh restart`
**Estado:** ✅ Eliminación de reportes funcionando para todos los casos
