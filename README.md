# ============================================================================
# Script PowerShell para crear estructura del proyecto: Reporte Diario de Administradores
# Solo crea directorios y archivos vacíos
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CREANDO ESTRUCTURA DE ARCHIVOS" -ForegroundColor Green
Write-Host "  Reporte Diario de Administradores" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Crear directorio principal del proyecto
New-Item -ItemType Directory -Force -Path "admin-daily-report" | Out-Null
Set-Location "admin-daily-report"

Write-Host "[1/4] Creando archivos raiz..." -ForegroundColor Yellow

# ============================================================================
# ARCHIVOS RAIZ
# ============================================================================
New-Item -ItemType File -Force -Path "docker-compose.yml" | Out-Null
New-Item -ItemType File -Force -Path ".gitignore" | Out-Null
New-Item -ItemType File -Force -Path "README.md" | Out-Null
New-Item -ItemType File -Force -Path ".env.example" | Out-Null

Write-Host "[2/4] Creando estructura del frontend..." -ForegroundColor Yellow

# ============================================================================
# FRONTEND - Directorios
# ============================================================================
$frontendDirs = @(
    "frontend",
    "frontend/public",
    "frontend/public/assets",
    "frontend/src",
    "frontend/src/components",
    "frontend/src/components/common",
    "frontend/src/components/form",
    "frontend/src/components/admin",
    "frontend/src/pages",
    "frontend/src/services",
    "frontend/src/hooks",
    "frontend/src/utils",
    "frontend/src/styles"
)

foreach ($dir in $frontendDirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

# FRONTEND - Archivos raiz
$frontendRootFiles = @(
    "frontend/Dockerfile",
    "frontend/nginx.conf",
    "frontend/package.json",
    "frontend/vite.config.js",
    "frontend/index.html"
)

foreach ($file in $frontendRootFiles) {
    New-Item -ItemType File -Force -Path $file | Out-Null
}

# FRONTEND - Public
$frontendPublicFiles = @(
    "frontend/public/index.html",
    "frontend/public/favicon.ico",
    "frontend/public/assets/inemec-logo.png"
)

foreach ($file in $frontendPublicFiles) {
    New-Item -ItemType File -Force -Path $file | Out-Null
}

# FRONTEND - Components Common
$frontendCommonFiles = @(
    "frontend/src/components/common/Header.jsx",
    "frontend/src/components/common/Footer.jsx",
    "frontend/src/components/common/Loading.jsx",
    "frontend/src/components/common/Alert.jsx"
)

foreach ($file in $frontendCommonFiles) {
    New-Item -ItemType File -Force -Path $file | Out-Null
}

# FRONTEND - Components Form
$frontendFormFiles = @(
    "frontend/src/components/form/DailyReportForm.jsx",
    "frontend/src/components/form/AdministratorSection.jsx",
    "frontend/src/components/form/PersonnelInfoSection.jsx",
    "frontend/src/components/form/IncidentsSection.jsx",
    "frontend/src/components/form/HiringRetirementsSection.jsx",
    "frontend/src/components/form/DynamicIncidentFields.jsx",
    "frontend/src/components/form/DynamicHiringFields.jsx",
    "frontend/src/components/form/FormNavigation.jsx"
)

foreach ($file in $frontendFormFiles) {
    New-Item -ItemType File -Force -Path $file | Out-Null
}

# FRONTEND - Components Admin
$frontendAdminFiles = @(
    "frontend/src/components/admin/AdminLayout.jsx",
    "frontend/src/components/admin/Dashboard.jsx",
    "frontend/src/components/admin/ReportsTable.jsx",
    "frontend/src/components/admin/ReportsFilter.jsx",
    "frontend/src/components/admin/ReportDetail.jsx",
    "frontend/src/components/admin/ExportTools.jsx",
    "frontend/src/components/admin/Analytics.jsx"
)

foreach ($file in $frontendAdminFiles) {
    New-Item -ItemType File -Force -Path $file | Out-Null
}

# FRONTEND - Pages
$frontendPageFiles = @(
    "frontend/src/pages/Home.jsx",
    "frontend/src/pages/Admin.jsx",
    "frontend/src/pages/Success.jsx",
    "frontend/src/pages/NotFound.jsx"
)

foreach ($file in $frontendPageFiles) {
    New-Item -ItemType File -Force -Path $file | Out-Null
}

# FRONTEND - Services
$frontendServiceFiles = @(
    "frontend/src/services/api.js",
    "frontend/src/services/reportService.js",
    "frontend/src/services/constants.js"
)

foreach ($file in $frontendServiceFiles) {
    New-Item -ItemType File -Force -Path $file | Out-Null
}

# FRONTEND - Hooks
$frontendHookFiles = @(
    "frontend/src/hooks/useForm.js",
    "frontend/src/hooks/useReports.js",
    "frontend/src/hooks/useAnalytics.js"
)

foreach ($file in $frontendHookFiles) {
    New-Item -ItemType File -Force -Path $file | Out-Null
}

# FRONTEND - Utils
$frontendUtilFiles = @(
    "frontend/src/utils/validation.js",
    "frontend/src/utils/formatters.js",
    "frontend/src/utils/dateUtils.js"
)

foreach ($file in $frontendUtilFiles) {
    New-Item -ItemType File -Force -Path $file | Out-Null
}

# FRONTEND - Styles
$frontendStyleFiles = @(
    "frontend/src/styles/globals.css",
    "frontend/src/styles/components.css",
    "frontend/src/styles/admin.css",
    "frontend/src/styles/form.css"
)

foreach ($file in $frontendStyleFiles) {
    New-Item -ItemType File -Force -Path $file | Out-Null
}

# FRONTEND - Archivos principales
$frontendMainFiles = @(
    "frontend/src/App.jsx",
    "frontend/src/main.jsx",
    "frontend/src/router.jsx"
)

foreach ($file in $frontendMainFiles) {
    New-Item -ItemType File -Force -Path $file | Out-Null
}

Write-Host "[3/4] Creando estructura del backend..." -ForegroundColor Yellow

# ============================================================================
# BACKEND - Directorios
# ============================================================================
$backendDirs = @(
    "backend",
    "backend/src",
    "backend/src/admin",
    "backend/src/services",
    "backend/src/utils",
    "backend/data",
    "backend/data/backup",
    "backend/data/exports"
)

foreach ($dir in $backendDirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

# BACKEND - Archivos raiz
$backendRootFiles = @(
    "backend/main.py",
    "backend/requirements.txt",
    "backend/Dockerfile"
)

foreach ($file in $backendRootFiles) {
    New-Item -ItemType File -Force -Path $file | Out-Null
}

# BACKEND - Src
$backendSrcFiles = @(
    "backend/src/config.py",
    "backend/src/models.py",
    "backend/src/api.py",
    "backend/src/excel_handler.py"
)

foreach ($file in $backendSrcFiles) {
    New-Item -ItemType File -Force -Path $file | Out-Null
}

# BACKEND - Admin
$backendAdminFiles = @(
    "backend/src/admin/__init__.py",
    "backend/src/admin/api.py",
    "backend/src/admin/config.py",
    "backend/src/admin/analytics.py",
    "backend/src/admin/export.py"
)

foreach ($file in $backendAdminFiles) {
    New-Item -ItemType File -Force -Path $file | Out-Null
}

# BACKEND - Services
$backendServiceFiles = @(
    "backend/src/services/__init__.py",
    "backend/src/services/report_service.py",
    "backend/src/services/validation_service.py",
    "backend/src/services/notification_service.py"
)

foreach ($file in $backendServiceFiles) {
    New-Item -ItemType File -Force -Path $file | Out-Null
}

# BACKEND - Utils
$backendUtilFiles = @(
    "backend/src/utils/__init__.py",
    "backend/src/utils/date_utils.py",
    "backend/src/utils/excel_utils.py",
    "backend/src/utils/validators.py"
)

foreach ($file in $backendUtilFiles) {
    New-Item -ItemType File -Force -Path $file | Out-Null
}

# BACKEND - Data
New-Item -ItemType File -Force -Path "backend/data/reportes_diarios.xlsx" | Out-Null

Write-Host "[4/4] Finalizando..." -ForegroundColor Yellow

# ============================================================================
# RESUMEN
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ESTRUCTURA CREADA EXITOSAMENTE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Proyecto creado en: $PWD" -ForegroundColor Cyan
Write-Host ""
Write-Host "DIRECTORIOS PRINCIPALES:" -ForegroundColor White
Write-Host "   📁 frontend/          - Aplicacion React" -ForegroundColor Gray
Write-Host "   📁 backend/           - API FastAPI" -ForegroundColor Gray
Write-Host "   📁 backend/data/      - Archivos Excel" -ForegroundColor Gray
Write-Host ""
Write-Host "ARCHIVOS CLAVE:" -ForegroundColor White
Write-Host "   📄 docker-compose.yml - Configuracion Docker" -ForegroundColor Gray
Write-Host "   📄 .gitignore         - Archivos ignorados" -ForegroundColor Gray
Write-Host "   📄 README.md          - Documentacion" -ForegroundColor Gray
Write-Host "   📄 .env.example       - Variables de entorno" -ForegroundColor Gray
Write-Host ""
Write-Host "PRÓXIMOS PASOS:" -ForegroundColor White
Write-Host "   1. cd admin-daily-report" -ForegroundColor Gray
Write-Host "   2. Copiar .env.example a .env" -ForegroundColor Gray
Write-Host "   3. Editar archivos según necesidades" -ForegroundColor Gray
Write-Host "   4. docker-compose up -d" -ForegroundColor Gray
Write-Host ""

# Contar archivos creados
$totalFiles = (Get-ChildItem -Recurse -File | Measure-Object).Count
$totalDirs = (Get-ChildItem -Recurse -Directory | Measure-Object).Count

Write-Host "ESTADÍSTICAS:" -ForegroundColor White
Write-Host "   ✅ $totalFiles archivos creados" -ForegroundColor Green
Write-Host "   ✅ $totalDirs directorios creados" -ForegroundColor Green
Write-Host ""

Read-Host "Presiona Enter para continuar"