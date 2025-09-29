-- Script de inicialización para PostgreSQL
-- Crea la estructura inicial de la base de datos

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Crear esquema principal
CREATE SCHEMA IF NOT EXISTS reports;

-- Configurar search_path
SET search_path TO reports, public;

-- Crear tipos ENUM
CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'operator', 'viewer');
CREATE TYPE report_status AS ENUM ('draft', 'completed', 'reviewed', 'archived');
CREATE TYPE movement_type AS ENUM ('Ingreso', 'Retiro');

-- Crear tipo para incidentes (más flexible que ENUM para futuras adiciones)
CREATE TYPE incident_type AS ENUM (
    'Incapacidad Medica Por Enfermedad Comun',
    'Incapacidad Medica por Enfermedad Laboral',
    'Permiso por Cita Medica',
    'Licencia de Maternidad',
    'Licencia de paternidad',
    'Permiso por Luto',
    'Permiso por Calamidad Domestica',
    'Vacaciones',
    'Compensatorios',
    'Dia de la Familia',
    'Suspensiones de contrato',
    'Permisos no remunerados'
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'operator',
    administrator_name VARCHAR(255),
    client_operation VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para usuarios
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Trigger para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabla de reportes
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id VARCHAR(100) UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    administrator VARCHAR(255) NOT NULL,
    client_operation VARCHAR(255) NOT NULL,
    daily_hours DECIMAL(4,2) NOT NULL CHECK (daily_hours >= 0 AND daily_hours <= 24),
    staff_personnel INTEGER NOT NULL CHECK (staff_personnel >= 0),
    base_personnel INTEGER NOT NULL CHECK (base_personnel >= 0),
    relevant_facts TEXT,
    status report_status DEFAULT 'completed',
    report_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    client_ip VARCHAR(45),
    user_agent VARCHAR(500)
);

-- Índices para reportes
CREATE INDEX idx_reports_date ON reports(report_date DESC);
CREATE INDEX idx_reports_admin ON reports(administrator);
CREATE INDEX idx_reports_client ON reports(client_operation);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_reports_date_admin ON reports(report_date, administrator);
CREATE INDEX idx_reports_date_client ON reports(report_date, client_operation);

-- Trigger para updated_at
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabla de incidencias
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    incident_type incident_type NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    end_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para incidencias
CREATE INDEX idx_incidents_report ON incidents(report_id);
CREATE INDEX idx_incidents_type ON incidents(incident_type);
CREATE INDEX idx_incidents_employee ON incidents(employee_name);
CREATE INDEX idx_incidents_end_date ON incidents(end_date);

-- Trigger para updated_at
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabla de movimientos
CREATE TABLE IF NOT EXISTS movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    movement_type movement_type NOT NULL,
    effective_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para movimientos
CREATE INDEX idx_movements_report ON movements(report_id);
CREATE INDEX idx_movements_type ON movements(movement_type);
CREATE INDEX idx_movements_employee ON movements(employee_name);
CREATE INDEX idx_movements_date ON movements(effective_date);

-- Trigger para updated_at
CREATE TRIGGER update_movements_updated_at BEFORE UPDATE ON movements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabla de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(100),
    details TEXT,
    client_ip VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para auditoría
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at DESC);

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS system_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para updated_at
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar configuración inicial
INSERT INTO system_config (key, value, description) VALUES
    ('max_reports_per_admin_per_day', '10', 'Número máximo de reportes por administrador por día'),
    ('max_incidents_per_report', '50', 'Número máximo de incidencias por reporte'),
    ('max_movements_per_report', '50', 'Número máximo de movimientos por reporte'),
    ('system_version', '2.0.0', 'Versión del sistema'),
    ('backup_enabled', 'true', 'Habilitar backups automáticos'),
    ('backup_retention_days', '30', 'Días de retención de backups')
ON CONFLICT (key) DO NOTHING;

-- Crear usuarios iniciales (contraseña: Admin123!)
INSERT INTO users (username, email, password_hash, full_name, role, administrator_name, client_operation) VALUES
    ('admin', 'admin@inemec.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY3OeqKqEQQyYSC', 'Administrador Sistema', 'admin', NULL, NULL),
    ('supervisor', 'supervisor@inemec.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY3OeqKqEQQyYSC', 'Supervisor General', 'supervisor', NULL, NULL)
ON CONFLICT (username) DO NOTHING;

-- Vistas útiles para reportes
CREATE OR REPLACE VIEW daily_report_summary AS
SELECT
    r.report_date,
    r.administrator,
    r.client_operation,
    r.daily_hours,
    r.staff_personnel,
    r.base_personnel,
    COUNT(DISTINCT i.id) as incident_count,
    COUNT(DISTINCT m.id) as movement_count,
    r.status,
    r.created_at
FROM reports r
LEFT JOIN incidents i ON r.id = i.report_id
LEFT JOIN movements m ON r.id = m.report_id
GROUP BY r.id, r.report_date, r.administrator, r.client_operation,
         r.daily_hours, r.staff_personnel, r.base_personnel,
         r.status, r.created_at;

-- Vista para estadísticas por administrador
CREATE OR REPLACE VIEW admin_statistics AS
SELECT
    r.administrator,
    COUNT(DISTINCT r.id) as total_reports,
    AVG(r.daily_hours) as avg_daily_hours,
    SUM(r.staff_personnel) as total_staff,
    SUM(r.base_personnel) as total_base,
    COUNT(DISTINCT r.report_date) as days_reported,
    MAX(r.created_at) as last_report_date
FROM reports r
WHERE r.status = 'completed'
GROUP BY r.administrator;

-- Función para verificar duplicados de reportes
CREATE OR REPLACE FUNCTION check_duplicate_report()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM reports
        WHERE administrator = NEW.administrator
        AND report_date = NEW.report_date
        AND id != COALESCE(NEW.id, uuid_nil())
    ) THEN
        RAISE EXCEPTION 'Ya existe un reporte para este administrador en esta fecha';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para evitar duplicados
CREATE TRIGGER check_duplicate_report_trigger
BEFORE INSERT OR UPDATE ON reports
FOR EACH ROW EXECUTE FUNCTION check_duplicate_report();

-- Permisos (ajustar según necesidad)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA reports TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA reports TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA reports TO postgres;

-- Comentarios en tablas para documentación
COMMENT ON TABLE users IS 'Usuarios del sistema con roles y permisos';
COMMENT ON TABLE reports IS 'Reportes diarios de operaciones';
COMMENT ON TABLE incidents IS 'Incidencias de personal reportadas';
COMMENT ON TABLE movements IS 'Movimientos de personal (ingresos/retiros)';
COMMENT ON TABLE audit_logs IS 'Registro de auditoría de todas las acciones del sistema';
COMMENT ON TABLE system_config IS 'Configuración global del sistema';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully';
END $$;