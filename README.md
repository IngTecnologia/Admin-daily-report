# Sistema de Reporte Diario para Administradores

## 📋 Descripción del Proyecto

### Contexto del Negocio
Este sistema web está diseñado para digitalizar y optimizar el proceso de reporte diario de administradores en operaciones corporativas. Los administradores de diferentes campos operacionales (Barranca, Bogotá, CEDCO, PAREX, VRC, SIERRACOL, VPI, etc.) deben reportar diariamente información crítica sobre:

- **Personal operativo**: Horas trabajadas, cantidad de staff y base
- **Incidencias del personal**: Desde incapacidades médicas hasta vacaciones y permisos
- **Movimientos de personal**: Ingresos y retiros con sus respectivos detalles
- **Hechos relevantes**: Novedades operacionales importantes
- **Métricas operacionales**: Para análisis y toma de decisiones

### Problema que Resuelve
- **Eliminación del papel**: Reemplaza formularios físicos y hojas de cálculo manuales
- **Centralización de datos**: Todas las métricas en un solo lugar accesible
- **Análisis en tiempo real**: Dashboard administrativo con métricas y tendencias
- **Reducción de errores**: Validaciones automáticas y campos obligatorios
- **Histórico completo**: Mantenimiento de registros para auditorías y análisis
- **Acceso controlado**: Sistema de autenticación robusto con roles y permisos

### Objetivo Principal
Crear una plataforma web robusta, segura y escalable que permita a los administradores reportar información diaria de manera eficiente, y a los supervisores analizar estas métricas para tomar decisiones operacionales informadas.

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

```
Frontend:  React 18 + Vite + React Router + Context API
Backend:   FastAPI + Python 3.11 + Pydantic + SQLAlchemy
Database:  PostgreSQL 15 (Principal) + Excel (Legacy/Backup)
Auth:      JWT + Bcrypt + Redis (sessions)
Security:  AES-256 Field Encryption + HTTPS + CORS
Deploy:    Docker + Docker Compose + Nginx + Cloudflare Tunnel
Styles:    CSS Puro (compatible con imagen corporativa existente)
```

### Arquitectura del Sistema

```
                    Internet
                       ↓
              Cloudflare Tunnel
                       ↓
    ┌──────────────────────────────────────┐
    │     Nginx Reverse Proxy (80)         │
    └──────────────────────────────────────┘
              ↓                    ↓
    ┌──────────────────┐  ┌─────────────────────┐
    │  React Frontend  │  │  FastAPI Backend    │
    │   (Static SPA)   │  │   (Port 8001)       │
    └──────────────────┘  └─────────────────────┘
                                   ↓
                    ┌──────────────────────────┐
                    │  Dual-Write Storage      │
                    ├──────────────────────────┤
                    │  PostgreSQL 15           │
                    │  - Users & Auth          │
                    │  - Reports (Primary)     │
                    │  - Incidents             │
                    │  - Movements             │
                    │  - Audit Logs            │
                    ├──────────────────────────┤
                    │  Excel Files (Legacy)    │
                    │  - Backward Compatible   │
                    │  - Manual Access         │
                    │  - Data Backup           │
                    └──────────────────────────┘
                                   ↓
                         ┌──────────────────┐
                         │  Redis Cache     │
                         │  - Sessions      │
                         │  - Rate Limiting │
                         └──────────────────┘
```

### Principios de Diseño

1. **Seguridad Primero**: Autenticación JWT, encriptación de campos sensibles, roles granulares
2. **Dual-Write Pattern**: PostgreSQL como base primaria, Excel como legacy/backup
3. **Escalabilidad**: Arquitectura preparada para alta concurrencia
4. **Mantenibilidad**: Código modular, bien documentado, con patrones claros
5. **Responsividad**: Funcional en desktop, tablet y móvil
6. **Zero-Downtime Deployment**: Cloudflare Tunnel para despliegues sin interrupción

---

## 🔐 Sistema de Autenticación y Seguridad

### Características de Seguridad

#### 1. **Autenticación JWT Robusta**
- **Tokens JWT** firmados con algoritmo HS256
- **Refresh tokens** con expiración configurable (7 días)
- **Access tokens** de corta duración (24 horas)
- **Invalidación de sesión** via Redis blacklist
- **Protección contra robo de tokens**: Validación de IP y User-Agent

#### 2. **Sistema de Roles Granular**
```python
Roles del Sistema:
├── admin_user      # Acceso completo al sistema
│   ├── Ver todos los reportes
│   ├── Editar reportes
│   ├── Eliminar reportes
│   ├── Gestionar usuarios
│   ├── Acceso a analytics avanzado
│   └── Exportar datos
│
├── supervisor      # Supervisor de operaciones
│   ├── Ver reportes de su operación
│   ├── Revisar y aprobar reportes
│   ├── Acceso a analytics de su área
│   └── Exportar datos filtrados
│
├── form_user       # Usuario operador (administrador de campo)
│   ├── Crear reportes diarios
│   ├── Ver sus propios reportes
│   ├── Editar reportes del día actual
│   └── Dashboard básico
│
└── viewer          # Solo lectura
    ├── Ver reportes asignados
    └── Dashboard de solo lectura
```

#### 3. **Encriptación de Datos Sensibles**
- **AES-256-GCM** para encriptación de campos en base de datos
- **Bcrypt** para hashing de contraseñas (12 rounds)
- **Campos encriptados**:
  - Nombres de empleados en incidencias
  - Nombres de empleados en movimientos
  - IP de origen (parcial)
  - Información de contacto

#### 4. **Auditoría Completa**
```sql
-- Tabla audit_logs registra:
├── Acción realizada (CREATE, UPDATE, DELETE, LOGIN, etc.)
├── Usuario que ejecutó la acción
├── Recurso afectado (tipo + ID)
├── IP de origen
├── User Agent
├── Timestamp con zona horaria
└── Detalles adicionales en JSON
```

#### 5. **Protecciones Adicionales**
- **CORS restrictivo**: Solo dominios autorizados
- **Rate limiting**: Por IP y por usuario
- **SQL Injection**: Prevención via SQLAlchemy ORM
- **XSS**: Sanitización de inputs en frontend y backend
- **CSRF**: Tokens en formularios críticos
- **HTTPS obligatorio**: Certificados SSL via Cloudflare

### Flujo de Autenticación

```
1. Usuario ingresa credenciales
   ↓
2. Backend valida contra PostgreSQL (users table)
   ↓
3. Bcrypt verifica hash de contraseña
   ↓
4. Se genera JWT access token (24h) + refresh token (7d)
   ↓
5. Tokens se almacenan en Redis + envían a cliente
   ↓
6. Cliente incluye access token en header de cada request
   ↓
7. Backend valida token, extrae user_id y role
   ↓
8. Se verifican permisos según endpoint y role
   ↓
9. Si access token expira, se usa refresh token
   ↓
10. Logout invalida ambos tokens en Redis blacklist
```

---

## 💾 Base de Datos: PostgreSQL + Dual-Write

### Esquema de Base de Datos

#### Schema: `reports`

**Tabla: users**
```sql
CREATE TABLE reports.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,  -- admin_user, supervisor, form_user, viewer
    administrator_name VARCHAR(255),  -- Nombre como admin en reportes
    client_operation VARCHAR(255),  -- Legacy: operación única
    client_operations JSONB,  -- Array de operaciones asignadas
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_username ON reports.users(username);
CREATE INDEX idx_users_email ON reports.users(email);
CREATE INDEX idx_users_role ON reports.users(role);
```

**Tabla: reports**
```sql
CREATE TABLE reports.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id VARCHAR(100) UNIQUE,  -- ID del Excel legacy
    user_id UUID REFERENCES reports.users(id) ON DELETE CASCADE,

    -- Información del reporte
    administrator VARCHAR(255) NOT NULL,
    client_operation VARCHAR(255) NOT NULL,
    daily_hours DECIMAL(5,2) NOT NULL,
    staff_personnel INTEGER NOT NULL,
    base_personnel INTEGER NOT NULL,
    relevant_facts TEXT,
    status VARCHAR(20) DEFAULT 'completed',  -- draft, completed, reviewed, archived

    -- Metadatos
    report_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES reports.users(id) ON DELETE SET NULL,

    -- Auditoría
    client_ip VARCHAR(45),
    user_agent VARCHAR(500)
);

-- Índices
CREATE INDEX idx_report_date_admin ON reports.reports(report_date, administrator);
CREATE INDEX idx_report_date_client ON reports.reports(report_date, client_operation);
CREATE INDEX idx_report_status_date ON reports.reports(status, report_date);
CREATE INDEX idx_report_user ON reports.reports(user_id);
CREATE INDEX idx_report_legacy ON reports.reports(legacy_id);
```

**Tabla: incidents**
```sql
CREATE TABLE reports.incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports.reports(id) ON DELETE CASCADE,

    -- Información de incidencia (encriptada)
    incident_type VARCHAR(100) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,  -- Encriptado con AES-256
    end_date DATE NOT NULL,
    notes TEXT,

    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_incident_report ON reports.incidents(report_id);
CREATE INDEX idx_incident_type_date ON reports.incidents(incident_type, end_date);
```

**Tabla: movements**
```sql
CREATE TABLE reports.movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports.reports(id) ON DELETE CASCADE,

    -- Información de movimiento (encriptada)
    employee_name VARCHAR(255) NOT NULL,  -- Encriptado con AES-256
    position VARCHAR(255) NOT NULL,
    movement_type VARCHAR(50) NOT NULL,  -- Ingreso, Retiro
    effective_date DATE,
    notes TEXT,

    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_movement_report ON reports.movements(report_id);
CREATE INDEX idx_movement_type_date ON reports.movements(movement_type, effective_date);
```

**Tabla: audit_logs**
```sql
CREATE TABLE reports.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES reports.users(id) ON DELETE SET NULL,

    -- Información de acción
    action VARCHAR(100) NOT NULL,  -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    resource_type VARCHAR(100),  -- report, user, incident, movement
    resource_id VARCHAR(100),
    details TEXT,  -- JSON con información adicional

    -- Información del cliente
    client_ip VARCHAR(45),
    user_agent VARCHAR(500),

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_audit_action_date ON reports.audit_logs(action, created_at);
CREATE INDEX idx_audit_user ON reports.audit_logs(user_id);
CREATE INDEX idx_audit_resource ON reports.audit_logs(resource_type, resource_id);
```

### Patrón Dual-Write

**¿Por qué Dual-Write?**
- **Migración gradual**: Permite transición suave desde Excel legacy
- **Compatibilidad**: Usuarios pueden seguir usando Excel si es necesario
- **Backup automático**: Excel sirve como respaldo de datos
- **Rollback safety**: Si hay problemas con PostgreSQL, Excel tiene los datos

**Funcionamiento:**
```python
def create_report(report_data):
    # 1. Guardar en PostgreSQL (principal)
    pg_report = save_to_postgresql(report_data)

    # 2. Guardar en Excel (legacy/backup)
    excel_id = save_to_excel(report_data)

    # 3. Vincular con legacy_id
    pg_report.legacy_id = excel_id
    db.commit()

    # 4. Auditar acción
    create_audit_log("CREATE", "report", pg_report.id)

    return pg_report
```

**Sincronización:**
- **Escritura**: Siempre dual (PostgreSQL + Excel)
- **Lectura**: Prioridad PostgreSQL, fallback a Excel
- **Eliminación**: Dual delete con manejo de errores
- **Actualización**: Dual update con validación

---

## 📊 Reglas de Negocio Críticas

### 1. Reportes por Operación
- **Regla**: Un usuario puede reportar **una vez por día por operación**
- **Ejemplo**: Si Handerson tiene asignadas "VPI transversales" y "VPI Mayor", puede enviar 2 reportes al día (uno por cada operación)
- **Validación**: Backend verifica por `(administrator + client_operation + report_date)`

### 2. Multi-Operación para Usuarios
- **Campo**: `client_operations` (JSONB array)
- **Lógica**: Usuario con múltiples operaciones elige cuál reportar
- **Autoselección**: Solo si tiene exactamente 1 operación asignada
- **Frontend**: Dropdown dinámico con operaciones del usuario

### 3. Campos Dinámicos
- **Incidencias**: Si cantidad > 0, se generan N grupos de 3 campos obligatorios cada uno
- **Movimientos**: Mismo comportamiento que incidencias
- **Validación**: Todos los subcampos obligatorios si cantidad > 0

### 4. Fechas y Timezone
- **Zona horaria**: America/Bogota (GMT-5)
- **Almacenamiento**: UTC en PostgreSQL
- **Presentación**: Convertido a Bogotá en API responses
- **Validación fechas de incidencias**: Desde hoy hacia el futuro (máximo 1 año)

### 5. Permisos por Rol

| Acción | admin_user | supervisor | form_user | viewer |
|--------|-----------|-----------|-----------|--------|
| Crear reporte | ✅ | ✅ | ✅ | ❌ |
| Ver todos los reportes | ✅ | ✅ (su área) | ❌ (solo suyos) | ✅ (asignados) |
| Editar reportes | ✅ | ✅ (su área) | ✅ (solo hoy) | ❌ |
| Eliminar reportes | ✅ | ❌ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ | ❌ |
| Analytics completo | ✅ | ✅ (su área) | ❌ | ❌ |
| Exportar datos | ✅ | ✅ | ❌ | ❌ |

---

## 🔧 Mantenimiento y Operaciones del Sistema

### Estructura de Deployment

El sistema tiene **DOS configuraciones de deployment**:

1. **Desarrollo Local** (`docker-compose.yml`)
   - Puertos expuestos localmente
   - Variables de entorno en `.env`
   - Base de datos local PostgreSQL

2. **Producción con Cloudflare Tunnel** (`docker-compose.tunnel.yml`)
   - Sin puertos expuestos (más seguro)
   - Variables de entorno en `.env.tunnel`
   - Todo el tráfico via Cloudflare Tunnel
   - URLs: `https://reportediario2.inemec.com`

### Usando `deploy-tunnel.sh`

**Script principal para gestionar el entorno de producción**

```bash
# Ver comandos disponibles
./deploy-tunnel.sh

# Iniciar todos los servicios
./deploy-tunnel.sh start

# Reiniciar servicios (rebuild + restart)
./deploy-tunnel.sh restart

# Ver estado de todos los contenedores
./deploy-tunnel.sh status

# Ver logs en tiempo real
./deploy-tunnel.sh logs

# Ver logs de un servicio específico
./deploy-tunnel.sh logs backend
./deploy-tunnel.sh logs frontend
./deploy-tunnel.sh logs postgres

# Detener todos los servicios
./deploy-tunnel.sh stop

# Limpiar contenedores y volúmenes (¡CUIDADO!)
./deploy-tunnel.sh clean
```

**URLs de Producción:**
- Frontend: `https://reportediario2.inemec.com`
- Backend API: `https://reportediario2.inemec.com/api/v1/`
- API Docs: `https://reportediario2.inemec.com/api/docs`

### Gestión de Usuarios

#### 1. Crear Usuario (método recomendado)

**Opción A: Script Python interactivo**
```bash
# Entrar al contenedor backend
docker exec -it reportes-backend bash

# Ejecutar script de creación de usuario
python3 scripts/create_user.py
```

**Opción B: Desde consola PostgreSQL**
```bash
# Conectar a PostgreSQL
docker exec -it reportes-postgres psql -U postgres -d reports

# Crear usuario manualmente
INSERT INTO reports.users (
    username,
    email,
    password_hash,
    full_name,
    role,
    administrator_name,
    client_operations,
    is_active,
    is_verified
) VALUES (
    'nuevo_usuario',
    'usuario@inemec.com',
    '$2b$12$...',  -- Hash bcrypt de la contraseña
    'Nombre Completo',
    'form_user',  -- o 'admin_user', 'supervisor', 'viewer'
    'Nombre Completo',
    '["VPI ADMON", "VPI CUSIANA"]'::jsonb,  -- Array de operaciones
    TRUE,
    TRUE
);
```

**Opción C: Endpoint API (requiere autenticación admin)**
```bash
curl -X POST "https://reportediario2.inemec.com/api/v1/auth/register" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nuevo_usuario",
    "email": "usuario@inemec.com",
    "password": "contraseña_segura",
    "full_name": "Nombre Completo",
    "role": "form_user",
    "administrator_name": "Nombre Completo",
    "client_operations": ["VPI ADMON", "VPI CUSIANA"]
  }'
```

#### 2. Generar Hash de Contraseña

```python
# En Python (dentro del contenedor backend)
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

password = "contraseña_del_usuario"
hashed = pwd_context.hash(password)
print(hashed)
# Resultado: $2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 3. Listar Usuarios

```sql
-- Conectar a PostgreSQL
docker exec -it reportes-postgres psql -U postgres -d reports

-- Ver todos los usuarios
SELECT
    username,
    email,
    full_name,
    role,
    client_operations,
    is_active,
    last_login
FROM reports.users
ORDER BY created_at DESC;
```

#### 4. Modificar Rol de Usuario

```sql
-- Cambiar rol de un usuario
UPDATE reports.users
SET role = 'admin_user'
WHERE username = 'nombre_usuario';

-- Agregar operaciones a un usuario
UPDATE reports.users
SET client_operations = '["VPI ADMON", "VPI CUSIANA", "SIERRACOL"]'::jsonb
WHERE username = 'nombre_usuario';
```

#### 5. Desactivar/Activar Usuario

```sql
-- Desactivar usuario (no puede hacer login)
UPDATE reports.users
SET is_active = FALSE
WHERE username = 'nombre_usuario';

-- Activar usuario
UPDATE reports.users
SET is_active = TRUE
WHERE username = 'nombre_usuario';
```

#### 6. Resetear Contraseña

```bash
# Opción A: Generar nuevo hash y actualizar
docker exec -it reportes-backend python3 -c "
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
print(pwd_context.hash('nueva_contraseña'))
"

# Opción B: Actualizar en PostgreSQL
docker exec -it reportes-postgres psql -U postgres -d reports -c "
UPDATE reports.users
SET password_hash = '$2b$12$HASH_GENERADO_ARRIBA'
WHERE username = 'nombre_usuario';
"
```

### Operaciones Comunes de Mantenimiento

#### 1. Backup de Base de Datos

```bash
# Backup completo de PostgreSQL
docker exec reportes-postgres pg_dump -U postgres reports > backup_$(date +%Y%m%d).sql

# Restaurar desde backup
cat backup_20251008.sql | docker exec -i reportes-postgres psql -U postgres reports

# Backup de archivos Excel (dual-write)
cp -r /home/nuevastec/SERVICES/2report/Admin-daily-report/data/ \
   /home/nuevastec/backups/2report_data_$(date +%Y%m%d)/
```

#### 2. Ver Logs de Aplicación

```bash
# Backend logs
docker logs reportes-backend -f

# Frontend logs (nginx)
docker logs reportes-frontend -f

# PostgreSQL logs
docker logs reportes-postgres -f

# Cloudflare tunnel logs
docker logs cloudflared-tunnel -f

# Ver logs con timestamp
docker logs reportes-backend -f --timestamps

# Ver últimas 100 líneas
docker logs reportes-backend --tail 100
```

#### 3. Monitorear Performance

```bash
# Stats de contenedores en tiempo real
docker stats reportes-backend reportes-frontend reportes-postgres

# Ver espacio en disco de volúmenes
docker system df -v

# Ver procesos dentro de un contenedor
docker exec reportes-backend ps aux

# Uso de memoria de PostgreSQL
docker exec reportes-postgres psql -U postgres -c "
SELECT
    pg_size_pretty(pg_database_size('reports')) as db_size,
    pg_size_pretty(pg_total_relation_size('reports.reports')) as reports_table_size;
"
```

#### 4. Consultas SQL Útiles

```sql
-- Conectar a PostgreSQL
docker exec -it reportes-postgres psql -U postgres -d reports

-- Total de reportes por fecha
SELECT
    report_date,
    COUNT(*) as total_reportes,
    COUNT(DISTINCT administrator) as admins_reportaron
FROM reports.reports
GROUP BY report_date
ORDER BY report_date DESC
LIMIT 30;

-- Reportes de hoy
SELECT
    administrator,
    client_operation,
    daily_hours,
    created_at
FROM reports.reports
WHERE report_date = CURRENT_DATE
ORDER BY created_at DESC;

-- Usuarios más activos (últimos 30 días)
SELECT
    u.username,
    u.full_name,
    COUNT(r.id) as total_reportes
FROM reports.users u
LEFT JOIN reports.reports r ON r.user_id = u.id AND r.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.id, u.username, u.full_name
ORDER BY total_reportes DESC;

-- Incidencias por tipo (mes actual)
SELECT
    incident_type,
    COUNT(*) as cantidad
FROM reports.incidents
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY incident_type
ORDER BY cantidad DESC;

-- Logs de auditoría recientes
SELECT
    u.username,
    al.action,
    al.resource_type,
    al.created_at
FROM reports.audit_logs al
LEFT JOIN reports.users u ON u.id = al.user_id
ORDER BY al.created_at DESC
LIMIT 50;
```

#### 5. Limpiar Datos Antiguos

```sql
-- Eliminar reportes más antiguos de 2 años (si es necesario)
DELETE FROM reports.reports
WHERE report_date < CURRENT_DATE - INTERVAL '2 years';

-- Eliminar logs de auditoría más antiguos de 6 meses
DELETE FROM reports.audit_logs
WHERE created_at < CURRENT_DATE - INTERVAL '6 months';

-- Limpiar reportes en estado 'draft' más antiguos de 7 días
DELETE FROM reports.reports
WHERE status = 'draft'
AND created_at < CURRENT_DATE - INTERVAL '7 days';
```

#### 6. Rebuild y Deploy

```bash
# Rebuild completo (después de cambios en código)
./deploy-tunnel.sh restart

# Solo rebuild backend
docker-compose -f docker-compose.tunnel.yml build backend
docker-compose -f docker-compose.tunnel.yml up -d backend

# Solo rebuild frontend
docker-compose -f docker-compose.tunnel.yml build frontend
docker-compose -f docker-compose.tunnel.yml up -d frontend

# Reload nginx sin rebuild
docker exec reportes-frontend nginx -s reload
```

### Consideraciones Importantes

#### ⚠️ Antes de Modificar Código

1. **Compatibilidad Dual-Write**: Cambios en modelos de datos deben aplicarse a PostgreSQL Y Excel
2. **Migraciones de BD**: Crear scripts SQL para cambios de schema
3. **Variables de entorno**: Actualizar en `.env` (dev) Y `.env.tunnel` (prod)
4. **Validaciones**: Mantener consistencia entre frontend y backend
5. **Testing**: Probar en local antes de deploy a producción

#### ⚠️ Seguridad

1. **Nunca commitear**: `.env`, `.env.tunnel`, archivos con contraseñas
2. **Rotar secretos**: JWT_SECRET, DATABASE_PASSWORD periódicamente
3. **Backup encriptado**: Backups de PostgreSQL deben estar encriptados
4. **Auditoría**: Revisar logs de auditoría regularmente
5. **Actualizaciones**: Mantener dependencias actualizadas

#### ⚠️ Performance

1. **Índices**: No eliminar índices existentes sin análisis
2. **Query optimization**: Usar EXPLAIN ANALYZE en queries complejos
3. **Caché**: Redis se usa para sessions, considerar para queries frecuentes
4. **Paginación**: No cargar todos los reportes sin filtros (implementado)
5. **Volúmenes Docker**: Monitorear espacio en disco

#### ⚠️ Disaster Recovery

1. **Backups automáticos**: Configurar cron para backups diarios
2. **Backup offsite**: Copiar backups fuera del servidor
3. **Plan de restauración**: Documentar y probar proceso de restore
4. **Dual-write**: Excel sirve como backup de emergencia
5. **Logs**: Mantener logs de aplicación por al menos 30 días

---

## 🔌 API Endpoints Principales

### Autenticación

```
POST   /api/v1/auth/login              Login con credenciales
POST   /api/v1/auth/logout             Logout (invalida tokens)
POST   /api/v1/auth/refresh            Renovar access token
POST   /api/v1/auth/register           Crear usuario (solo admin)
GET    /api/v1/auth/me                 Información del usuario actual
GET    /api/v1/auth/operations         Operaciones del usuario actual
```

### Reportes

```
POST   /api/v1/reportes                      Crear nuevo reporte
GET    /api/v1/reportes/admin/{admin}/today  Verificar reporte de hoy
GET    /api/v1/admin/reportes                Lista de reportes (filtrable)
GET    /api/v1/admin/reportes/{id}           Detalle de reporte
PUT    /api/v1/admin/reportes/{id}           Actualizar reporte
DELETE /api/v1/admin/reportes/{id}           Eliminar reporte (solo admin)
```

### Analytics

```
GET    /api/v1/admin/analytics         Métricas del dashboard
GET    /api/v1/admin/export            Exportar datos a Excel/CSV
```

### Sistema

```
GET    /health                         Health check
GET    /api/v1/config                  Configuración del sistema
```

---

## 🚀 Desarrollo Local

### Setup Inicial

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd Admin-daily-report

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Iniciar servicios
docker-compose up -d

# 4. Verificar que todo esté corriendo
docker-compose ps

# 5. Acceder a la aplicación
# Frontend: http://localhost:4501
# Backend: http://localhost:8001
# API Docs: http://localhost:8001/docs
```

### Variables de Entorno Importantes

```bash
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=reports
DATABASE_URL=postgresql://postgres:secure_password@postgres:5432/reports

# JWT
JWT_SECRET=tu_secret_muy_seguro_aqui_minimo_32_caracteres
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=7

# Redis
REDIS_URL=redis://redis:6379/0

# Encriptación
ENCRYPTION_KEY=tu_encryption_key_32_bytes_base64

# CORS (desarrollo)
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://localhost:4501"]

# App
DEBUG=True
TIMEZONE=America/Bogota
```

### Desarrollo Frontend

```bash
cd frontend
npm install
npm run dev          # Dev server en puerto 5173
npm run build        # Build para producción
npm run preview      # Preview del build
```

### Desarrollo Backend

```bash
cd backend
pip install -r requirements.txt
python main.py       # Dev server en puerto 8001
```

---

## 📈 Roadmap Futuro

### Próximas Mejoras
- [ ] Notificaciones por email automatizadas
- [ ] Dashboard avanzado con gráficos interactivos
- [ ] Exportación programada de reportes
- [ ] Integración con sistema de RRHH
- [ ] App móvil nativa (React Native)
- [ ] Reportes de predicción con ML
- [ ] API pública para integraciones

### Mejoras de Seguridad
- [ ] Two-Factor Authentication (2FA)
- [ ] SSO con Azure AD
- [ ] Encriptación de archivos Excel
- [ ] Alertas de seguridad automáticas
- [ ] Compliance reporting (SOC2, ISO27001)

---

## 📚 Documentación Adicional

- **API Documentation**: `https://reportediario2.inemec.com/api/docs` (Swagger)
- **Database Schema**: Ver sección "Base de Datos" de este README
- **CLAUDE.md**: Guía para desarrollo con Claude Code
- **CHANGELOG**: Ver `CHANGELOG_*.md` para cambios por fecha

---

## 🤝 Contribución

Este es un proyecto interno de INEMEC. Para contribuir:

1. Crear rama feature desde `main`
2. Hacer cambios con commits descriptivos
3. Probar localmente con `docker-compose`
4. Probar en producción con `deploy-tunnel.sh restart`
5. Solicitar code review
6. Merge a `main` después de aprobación

---

## 📞 Soporte

Para soporte técnico o reportar issues:
- **Email**: soporte@inemec.com
- **Issues**: Crear issue en repositorio interno

---

**Última actualización**: 2025-10-08
**Versión del sistema**: 2.0.0 (PostgreSQL + Dual-Write)
