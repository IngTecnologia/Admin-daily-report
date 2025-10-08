# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### ⚠️ IMPORTANTE: Dos Entornos de Deployment

Este proyecto tiene DOS configuraciones de deployment separadas:

1. **Desarrollo Local** (`docker-compose.yml`) - Con puertos expuestos
2. **Producción con Tunnel** (`docker-compose.tunnel.yml`) - Sin puertos expuestos, solo Cloudflare Tunnel

**REGLA CRÍTICA:** Todos los cambios deben ser replicables en ambos entornos. Si modificas código backend o frontend, esos cambios se aplicarán automáticamente al hacer rebuild. Sin embargo:
- **Cambios en base de datos:** Requieren scripts SQL o scripts Python que se puedan ejecutar en ambos entornos
- **Cambios en variables de entorno:** Deben actualizarse en `.env` (dev) y `.env.tunnel` (prod)
- **Cambios en configuración:** Deben documentarse para poder replicarse

### Production Deployment (Cloudflare Tunnel)
```bash
# Iniciar servicios en producción con Cloudflare Tunnel
./deploy-tunnel.sh start

# Reiniciar servicios (rebuild + restart)
./deploy-tunnel.sh restart

# Ver estado de servicios y túnel
./deploy-tunnel.sh status

# Ver logs en tiempo real
./deploy-tunnel.sh logs

# Detener servicios
./deploy-tunnel.sh stop
```

**URLs de Producción:**
- Frontend: https://reportediario2.inemec.com
- Backend API: https://reportediario2.inemec.com/api/v1/
- API Docs: https://reportediario2.inemec.com/api/docs

**IMPORTANTE:** El deployment de producción NO expone puertos localmente (más seguro). Todo el tráfico va a través del túnel de Cloudflare.

### Local Development
```bash
# Start full application stack
docker-compose up -d

# Rebuild after code changes
docker-compose build
docker-compose up -d

# View logs
docker logs reportes-backend
docker logs reportes-frontend

# Stop all services
docker-compose down
```

### Frontend (React + Vite)
```bash
cd frontend
npm install              # Install dependencies
npm run dev             # Start development server (port 5173)
npm run build           # Build for production
npm run preview         # Preview production build
```

### Backend (FastAPI + Python)
```bash
cd backend
pip install -r requirements.txt  # Install dependencies
python main.py                    # Start development server
pytest                           # Run tests (when implemented)
```

### Health Checks
- Frontend: http://localhost:4501/health
- Backend: http://localhost:8001/health
- API Documentation: http://localhost:8001/docs

## Architecture Overview

This is a **daily report management system** for corporate administrators built with a **React frontend** and **FastAPI backend**, using **Excel files as database**.

### Key Architectural Decisions

1. **Excel as Database**: Uses `openpyxl` to manage structured Excel files with multiple sheets (Reportes, Incidencias, Ingresos_Retiros, Configuracion)

2. **Dynamic Form Fields**: Core feature where form sections expand/contract based on user input (e.g., entering "3 incidents" generates 3 incident sub-forms)

3. **Modular Component Structure**: 
   - `components/form/` - Dynamic form sections
   - `components/admin/` - Administrative dashboard components  
   - `components/common/` - Shared UI components

4. **Service Layer Pattern**: Backend uses services (`report_service.py`, `validation_service.py`) and utilities (`excel_handler.py`) for separation of concerns

### Critical Business Logic

**Dynamic Field Generation**: The system's core feature is generating form fields dynamically:
- User enters "cantidad_incidencias" → System generates that many incident sub-forms
- Each sub-form has 3 required fields (type, employee name, end date)
- Same pattern for "cantidad_ingresos_retiros" → hiring/retirement forms

**Data Validation Rules**:
- One report per administrator per day (enforced in backend)
- Numeric fields have strict min/max ranges (hours: 1-24, personnel: ≥0)
- Date validations prevent past dates for incident end dates

## Project Structure

### Backend (`/backend/src/`)
```
├── api.py              # Main FastAPI routes and middleware
├── models.py           # Pydantic models for validation
├── config.py           # Application configuration and constants
├── excel_handler.py    # Core Excel file operations
├── admin/              # Admin-specific endpoints
├── services/           # Business logic layer
└── utils/              # Helper functions
```

### Frontend (`/frontend/src/`)
```
├── components/
│   ├── form/           # Dynamic form components
│   ├── admin/          # Dashboard and admin components
│   └── common/         # Shared UI components
├── pages/              # Route components (Home, Admin, Success)
├── services/           # API calls and constants
└── styles/             # CSS files
```

### Data Flow
1. **User Input** → Dynamic form validation → API call
2. **Backend Processing** → Excel file operations → Response
3. **Admin Dashboard** → Excel data reading → Analytics display

## Important Implementation Details

### UTF-8 Encoding
**Critical**: This project had extensive UTF-8 encoding issues that were resolved by:
- Replacing accented characters (á,é,í,ó,ú,ñ) with ASCII equivalents
- Converting malformed emoji sequences to proper Unicode emojis
- If you encounter `SyntaxError: (unicode error) 'utf-8' codec can't decode`, search for and replace problematic characters

### Excel File Structure
The system uses a multi-sheet Excel file (`/data/reportes_diarios.xlsx`):
- **Reportes**: Main report data with foreign key relationships
- **Incidencias**: Linked incident details 
- **Ingresos_Retiros**: Employee movement details
- **Configuracion**: System metadata and settings

### Constants and Configuration
All dropdown options and validation rules are centralized in:
- Backend: `src/config.py` (ADMINISTRATORS, CLIENT_OPERATIONS, INCIDENT_TYPES)
- Frontend: `src/services/constants.js` (VALIDATION_RULES, API endpoints)

### Docker Configuration
- Frontend runs on port 4501 (Nginx + built React app)
- Backend runs on port 8001 (FastAPI + Uvicorn)
- Data persistence through Docker volumes (`./data:/app/data`, `./logs:/app/logs`)

## Development Workflow

### Adding New Form Fields
1. Update constants in both `backend/src/config.py` and `frontend/src/services/constants.js`
2. Update Pydantic models in `backend/src/models.py`
3. Modify Excel schema in `backend/src/excel_handler.py`
4. Update React form components in `frontend/src/components/form/`

### Adding New API Endpoints
1. Define route in `backend/src/api.py` or relevant admin module
2. Create/update service layer in `backend/src/services/`
3. Update frontend API calls in `frontend/src/services/`
4. Test with FastAPI automatic documentation at `/docs`

### Troubleshooting Common Issues
- **Container won't start**: Check for UTF-8 encoding issues in Python files
- **Form validation errors**: Verify constants match between frontend/backend
- **Excel file errors**: Ensure all required sheets exist with correct column headers
- **Missing dependencies**: Check `requirements.txt` includes `numpy` and `pandas` for Excel operations

## Testing Strategy

- **Manual Testing**: Use form at http://localhost:4501 to test full workflows
- **API Testing**: Use FastAPI docs at http://localhost:8001/docs for endpoint testing
- **Data Validation**: Check Excel file integrity after operations
- **Dynamic Fields**: Test edge cases like 0 incidents, maximum incidents (50), required field validation