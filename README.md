# Sistema de Reporte Diario para Administradores

## 📋 Descripción del Proyecto

### Contexto del Negocio
Este sistema web está diseñado para digitalizar y optimizar el proceso de reporte diario de administradores en operaciones corporativas. Los administradores de diferentes campos operacionales (Barranca, Bogotá, CEDCO, PAREX, etc.) deben reportar diariamente información crítica sobre:

- **Personal operativo**: Horas trabajadas, cantidad de staff y base
- **Incidencias del personal**: Desde incapacidades médicas hasta vacaciones
- **Movimientos de personal**: Ingresos y retiros con sus respectivos detalles
- **Métricas operacionales**: Para análisis y toma de decisiones

### Problema que Resuelve
- **Eliminación del papel**: Reemplaza formularios físicos y hojas de cálculo manuales
- **Centralización de datos**: Todas las métricas en un solo lugar accesible
- **Análisis en tiempo real**: Dashboard administrativo con métricas y tendencias
- **Reducción de errores**: Validaciones automáticas y campos obligatorios
- **Histórico completo**: Mantenimiento de registros para auditorías y análisis

### Objetivo Principal
Crear una plataforma web robusta, intuitiva y escalable que permita a los administradores reportar información diaria de manera eficiente, y a los supervisores analizar estas métricas para tomar decisiones operacionales informadas.

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
```
Frontend: React 18 + Vite + React Router + Lucide Icons
Backend:  FastAPI + Python 3.11 + Pydantic + OpenPyXL
Database: Archivo Excel (.xlsx) con múltiples hojas
Deploy:   Docker + Docker Compose + Nginx
Styles:   CSS Puro (compatible con imagen corporativa existente)
```

### Arquitectura del Sistema
```
Internet → Nginx (Puerto 4501) → React App
                ↓
         FastAPI Backend (Puerto 8001)
                ↓
         Excel Database (Archivo local)
```

### Principios de Diseño
1. **Simplicidad**: Interfaz intuitiva que no requiere capacitación
2. **Consistencia**: Reutiliza patrones de InemecTest existente
3. **Escalabilidad**: Preparado para migrar a BD relacional en el futuro
4. **Mantenibilidad**: Código modular y bien documentado
5. **Responsividad**: Funcional en desktop, tablet y móvil

---

## 📊 Especificaciones Funcionales Detalladas

### SECCIÓN 1: Información del Administrador

#### 1.1 Campo "Administrador"
- **Tipo**: Lista desplegable (Select)
- **Opciones fijas**:
  - Adriana Robayo
  - Angela Ramirez
  - Floribe Correa
  - Julieth Rincon
  - Eddinson Javier Martinez
  - Kellis Minosca Morquera
  - Kenia Sanchez
  - Liliana Romero
  - Marcela Cusba Gomez
  - Mirledys García San Juan
  - Yolima Arenas Zarate

- **Validaciones**:
  - Campo obligatorio
  - Debe ser una opción de la lista
  - No se permiten valores personalizados

#### 1.2 Campo "Cliente (operación)"
- **Tipo**: Lista desplegable (Select)
- **Opciones fijas**:
  - Administrativo Barranca
  - Administrativo Bogota
  - CEDCO
  - PAREX
  - VRC
  - SIERRACOL
  - VPI ADMON
  - VPI CUSIANA
  - VPI FLOREÑA
  - VPI CUPIAGUA

- **Validaciones**:
  - Campo obligatorio
  - Debe ser una opción de la lista
  - No se permiten valores personalizados

### SECCIÓN 2: Información de Personal

#### 2.1 Campo "Horas diarias"
- **Tipo**: Input numérico
- **Formato**: Solo números enteros sin espacios ni caracteres especiales
- **Rango**: 1-24 horas
- **Validaciones**:
  - Campo obligatorio
  - Solo números enteros positivos
  - Sin espacios, puntos, comas o caracteres especiales
  - Valor mínimo: 1
  - Valor máximo: 24

#### 2.2 Campo "Personal staff"
- **Tipo**: Input numérico
- **Formato**: Solo números enteros sin espacios
- **Validaciones**:
  - Campo obligatorio
  - Solo números enteros no negativos (incluyendo 0)
  - Sin espacios, puntos, comas o caracteres especiales

#### 2.3 Campo "Personal Base"
- **Tipo**: Input numérico
- **Formato**: Solo números enteros sin espacios
- **Validaciones**:
  - Campo obligatorio
  - Solo números enteros no negativos (incluyendo 0)
  - Sin espacios, puntos, comas o caracteres especiales

### SECCIÓN 3: Personal con Incidencias (LÓGICA DINÁMICA)

#### 3.1 Campo "Cantidad de personal con incidencias"
- **Tipo**: Input numérico
- **Funcionalidad**: **TRIGGER** que habilita campos dinámicos
- **Lógica crítica**:
  ```
  SI cantidad = 0:
    - No mostrar campos adicionales
    - Permitir envío del formulario
  
  SI cantidad > 0:
    - Generar dinámicamente [cantidad] grupos de campos
    - Cada grupo debe contener los 3 campos siguientes
    - Validar que TODOS los campos de TODOS los grupos estén completos
  ```

#### 3.2-3.4 Campos Dinámicos por Incidencia (Se repiten según 3.1)
Cada incidencia genera automáticamente estos 3 campos:

**3.2 Tipo de incidencia**
- **Tipo**: Lista desplegable
- **Opciones fijas**:
  - Incapacidad Médica Por Enfermedad Común
  - Incapacidad Médica por Enfermedad Laboral
  - Permiso por Cita Médica
  - Licencia de Maternidad
  - Licencia de paternidad
  - Permiso por Luto
  - Permiso por Calamidad Doméstica
  - Vacaciones
  - Compensatorios
  - Día de la Familia
  - Suspensiones de contrato
  - Permisos no remunerados

**3.3 Nombre y Apellido del Empleado**
- **Tipo**: Input de texto
- **Formato**: Texto libre
- **Validaciones**:
  - Campo obligatorio
  - Mínimo 3 caracteres
  - Máximo 100 caracteres
  - Solo letras, espacios y algunos caracteres especiales (acentos, ñ)

**3.4 Fecha de Fin de la Novedad**
- **Tipo**: Date picker (calendario)
- **Formato**: YYYY-MM-DD
- **Validaciones**:
  - Campo obligatorio
  - No puede ser fecha anterior a hoy
  - Máximo 1 año en el futuro

### SECCIÓN 4: Ingresos o Retiros (LÓGICA DINÁMICA IDÉNTICA)

#### 4.1 Campo "Cantidad de ingresos o retiros"
- **Tipo**: Input numérico
- **Funcionalidad**: **TRIGGER** idéntico al 3.1
- **Lógica crítica**: Misma que la sección 3

#### 4.2-4.4 Campos Dinámicos por Ingreso/Retiro
Cada movimiento genera automáticamente estos 3 campos:

**4.2 Nombre y Apellido del Empleado**
- **Tipo**: Input de texto
- **Validaciones**: Idénticas al campo 3.3

**4.3 Cargo**
- **Tipo**: Input de texto
- **Formato**: Texto libre
- **Validaciones**:
  - Campo obligatorio
  - Mínimo 2 caracteres
  - Máximo 50 caracteres

**4.4 Estado**
- **Tipo**: Lista desplegable
- **Opciones fijas**:
  - Ingreso
  - Retiro
- **Validaciones**:
  - Campo obligatorio
  - Solo opciones predefinidas

---

## 🔄 Flujo de Trabajo del Usuario

### Experiencia del Usuario Final (Administrador)

1. **Acceso**: `https://reportes.inemec.com/` (o puerto local 4501)
2. **Formulario Único**: Una sola página con todas las secciones visibles
3. **Progreso Visual**: Indicador de campos completados
4. **Validación Tiempo Real**: Errores mostrados inmediatamente
5. **Campos Dinámicos**: Se generan/eliminan al cambiar cantidades
6. **Envío**: Botón "Enviar Reporte" al final
7. **Confirmación**: Página de éxito con resumen enviado

### Experiencia del Administrador del Sistema

1. **Acceso**: `https://reportes.inemec.com/admin` (o puerto local 4501/admin)
2. **Dashboard**: Métricas generales y gráficos
3. **Tabla de Reportes**: Lista filtrable de todos los reportes
4. **Detalles**: Vista completa de cada reporte individual
5. **Exportación**: Descargar datos en Excel/CSV
6. **Analytics**: Gráficos de tendencias y análisis

---

## 💾 Estructura de Base de Datos (Excel)

### Archivo: `reportes_diarios.xlsx`

#### Hoja 1: "Reportes" (Datos Principales)
```
Columna A: ID (Auto-generado, único)
Columna B: Fecha_Creacion (DateTime)
Columna C: Administrador (String)
Columna D: Cliente_Operacion (String)
Columna E: Horas_Diarias (Integer)
Columna F: Personal_Staff (Integer)
Columna G: Personal_Base (Integer)
Columna H: Cantidad_Incidencias (Integer)
Columna I: Cantidad_Ingresos_Retiros (Integer)
Columna J: Estado (String: "Completado", "Borrador")
Columna K: IP_Origen (String)
Columna L: User_Agent (String)
```

#### Hoja 2: "Incidencias" (Datos Relacionados)
```
Columna A: ID_Reporte (Foreign Key hacia Reportes.ID)
Columna B: Numero_Incidencia (Integer: 1, 2, 3...)
Columna C: Tipo_Incidencia (String)
Columna D: Nombre_Empleado (String)
Columna E: Fecha_Fin_Novedad (Date)
Columna F: Fecha_Registro (DateTime)
```

#### Hoja 3: "Ingresos_Retiros" (Datos Relacionados)
```
Columna A: ID_Reporte (Foreign Key hacia Reportes.ID)
Columna B: Numero_Movimiento (Integer: 1, 2, 3...)
Columna C: Nombre_Empleado (String)
Columna D: Cargo (String)
Columna E: Estado (String: "Ingreso" o "Retiro")
Columna F: Fecha_Registro (DateTime)
```

#### Hoja 4: "Configuracion" (Metadatos)
```
Lista de valores permitidos para validaciones
Configuraciones del sistema
Logs de cambios importantes
```

---

## 🔌 Especificación de APIs

### Endpoints del Frontend

#### POST `/api/v1/reportes`
**Propósito**: Crear nuevo reporte diario
```json
{
  "administrador": "Adriana Robayo",
  "cliente_operacion": "PAREX",
  "horas_diarias": 8,
  "personal_staff": 15,
  "personal_base": 45,
  "incidencias": [
    {
      "tipo": "Vacaciones",
      "nombre_empleado": "Juan Pérez García",
      "fecha_fin": "2025-09-15"
    }
  ],
  "ingresos_retiros": [
    {
      "nombre_empleado": "María López",
      "cargo": "Técnico de Campo",
      "estado": "Ingreso"
    }
  ]
}
```

**Respuesta Exitosa (201)**:
```json
{
  "success": true,
  "message": "Reporte creado exitosamente",
  "data": {
    "id": "RPT-20250903-001",
    "fecha_creacion": "2025-09-03T14:30:00Z"
  }
}
```

#### GET `/api/v1/admin/reportes`
**Propósito**: Obtener lista de reportes (área admin)
**Parámetros de consulta**:
- `administrador`: Filtrar por administrador
- `cliente`: Filtrar por cliente/operación
- `fecha_inicio`: Fecha inicial (YYYY-MM-DD)
- `fecha_fin`: Fecha final (YYYY-MM-DD)
- `page`: Número de página (paginación)
- `limit`: Registros por página

#### GET `/api/v1/admin/reportes/{id}`
**Propósito**: Obtener detalles completos de un reporte específico

#### GET `/api/v1/admin/analytics`
**Propósito**: Obtener métricas para dashboard
```json
{
  "total_reportes": 1247,
  "reportes_hoy": 23,
  "promedio_horas_diarias": 8.2,
  "total_incidencias_mes": 89,
  "administradores_activos": 8,
  "graficos": {
    "reportes_por_dia": [...],
    "incidencias_por_tipo": [...],
    "personal_por_operacion": [...]
  }
}
```

#### GET `/api/v1/admin/export`
**Propósito**: Exportar datos filtrados en Excel/CSV
**Parámetros**: Mismos filtros que `/reportes`

---

## 🎨 Especificaciones de UI/UX

### Paleta de Colores (Idéntica a InemecTest)
```css
:root {
  --primary-blue: #1e40af;
  --secondary-blue: #3b82f6;
  --accent-orange: #f97316;
  --success-green: #059669;
  --warning-yellow: #d97706;
  --error-red: #dc2626;
  --neutral-gray: #6b7280;
  --light-gray: #f3f4f6;
  --white: #ffffff;
  --dark-text: #1f2937;
}
```

### Componentes Reutilizables
1. **Header**: Logo corporativo + título + navegación
2. **FormSection**: Container para cada sección con título
3. **DynamicFieldGroup**: Contenedor para campos generados dinámicamente
4. **LoadingSpinner**: Indicador de carga consistente
5. **AlertMessage**: Alertas de éxito, error, warning
6. **DataTable**: Tabla con filtros y paginación (área admin)

### Responsive Design
- **Desktop**: Layout en 2 columnas para formulario
- **Tablet**: Layout en 1 columna con campos amplios
- **Mobile**: Layout vertical con navegación simplificada

### Estados de Interacción
1. **Loading**: Spinner durante envío de formulario
2. **Validation**: Errores en tiempo real bajo cada campo
3. **Success**: Modal o página de confirmación tras envío exitoso
4. **Error**: Manejo de errores de red/servidor

---

## ⚙️ Validaciones y Reglas de Negocio

### Validaciones Frontend (Tiempo Real)
```javascript
const validationRules = {
  administrador: { required: true, type: 'select' },
  cliente_operacion: { required: true, type: 'select' },
  horas_diarias: { 
    required: true, 
    type: 'number', 
    min: 1, 
    max: 24, 
    integer: true 
  },
  personal_staff: { 
    required: true, 
    type: 'number', 
    min: 0, 
    integer: true 
  },
  personal_base: { 
    required: true, 
    type: 'number', 
    min: 0, 
    integer: true 
  },
  // Validaciones dinámicas se aplican según cantidad
}
```

### Validaciones Backend (Seguridad)
- **Sanitización**: Limpieza de inputs antes de procesamiento
- **Validación de tipos**: Pydantic models para validación estricta
- **Límites de datos**: Máximo 50 incidencias, 50 movimientos por reporte
- **Rate limiting**: Máximo 10 reportes por IP por día
- **Validación de fechas**: No fechas futuras irreales

### Reglas de Negocio Críticas
1. **Un reporte por administrador por día**: Validar unicidad
2. **Campos dinámicos obligatorios**: Si cantidad > 0, todos los subcampos requeridos
3. **Integridad referencial**: Verificar existencia de administrador/cliente
4. **Auditoría completa**: Log de todos los cambios y accesos

---

## 📈 Métricas y Analytics del Sistema

### Dashboard Principal
1. **KPIs Principales**:
   - Total de reportes del día/semana/mes
   - Promedio de horas trabajadas
   - Total de personal activo (staff + base)
   - Número de incidencias por tipo

2. **Gráficos Requeridos**:
   - Línea temporal: Reportes por día (últimos 30 días)
   - Barras: Incidencias por tipo (mes actual)
   - Pie chart: Distribución de personal por operación
   - Barras horizontales: Reportes por administrador

3. **Filtros Avanzados**:
   - Rango de fechas personalizable
   - Múltiples administradores seleccionables
   - Múltiples operaciones seleccionables
   - Tipo de incidencia específico

### Reportes Exportables
1. **Reporte General**: Todos los datos con filtros aplicados
2. **Reporte de Incidencias**: Solo datos de incidencias con análisis
3. **Reporte de Personal**: Métricas de personal por operación
4. **Reporte de Tendencias**: Análisis histórico con proyecciones

---

## 🔐 Consideraciones de Seguridad

### Seguridad Frontend
- **Validación de inputs**: Sanitización antes de envío
- **Rate limiting visual**: Prevenir spam de envíos
- **Manejo de errores**: No exponer información sensible
- **HTTPS obligatorio**: Certificados SSL en producción

### Seguridad Backend
- **CORS restrictivo**: Solo dominios autorizados
- **Validación exhaustiva**: Pydantic + validaciones custom
- **Logs de auditoría**: Registro completo de acciones
- **Backup automático**: Respaldo diario de datos Excel

### Privacidad de Datos
- **Datos mínimos**: Solo recopilar información necesaria
- **Anonimización**: IP hasheada en logs
- **Retención**: Política de eliminación de datos antiguos
- **Acceso controlado**: Área admin con autenticación básica

---

## 🚀 Criterios de Éxito

### Funcionalidad Core
- [ ] Formulario funciona correctamente en 100% de casos de prueba
- [ ] Campos dinámicos se generan/eliminan sin errores
- [ ] Validaciones funcionan en tiempo real
- [ ] Datos se guardan correctamente en Excel
- [ ] Área admin muestra métricas precisas

### Performance
- [ ] Carga inicial < 3 segundos
- [ ] Envío de formulario < 2 segundos
- [ ] Área admin carga < 5 segundos
- [ ] Responsive en móviles sin lag

### Usabilidad
- [ ] Interfaz intuitiva sin capacitación requerida
- [ ] Formulario completable en < 5 minutos
- [ ] Área admin navegable y clara
- [ ] Mensajes de error comprensibles

### Compatibilidad
- [ ] Chrome, Firefox, Safari, Edge (últimas 2 versiones)
- [ ] Dispositivos móviles iOS/Android
- [ ] Resoluciones desde 320px hasta 1920px
- [ ] Funciona sin JavaScript habilitado (básico)

---

## 🔧 Instrucciones para Desarrollo

### Setup Inicial
1. **Clonar estructura de archivos** usando el script PowerShell
2. **Copiar estilos base** desde proyecto InemecTest existente
3. **Configurar Docker** para desarrollo local
4. **Crear modelos Pydantic** basados en especificaciones
5. **Implementar componentes React** siguiendo arquitectura modular

### Orden de Desarrollo Recomendado
1. **Backend básico**: Models + API endpoints + Excel handler
2. **Frontend base**: Routing + Layout + Formulario básico
3. **Lógica dinámica**: Campos que se generan según cantidad
4. **Validaciones**: Frontend + Backend completas
5. **Área admin**: Dashboard + Filtros + Exportación
6. **Pulimiento**: Estilos + UX + Optimizaciones

### Testing Strategy
- **Unit tests**: Funciones críticas de validación
- **Integration tests**: APIs completas
- **E2E tests**: Flujos completos de usuario
- **Manual testing**: Casos edge y validación UX

### Consideraciones Especiales para Claude Code
- **Documentación inline**: Cada función bien documentada
- **Patrones consistentes**: Seguir estructura de InemecTest
- **Error handling robusto**: Manejar todos los casos edge
- **Configuración flexible**: Variables de entorno para personalización