# Guía de Despliegue - Cloudflare

## Configuración para reportediario.inemec.com en Puerto 10000

### Configuración ya aplicada:
✅ Dominio configurado: `reportediario.inemec.com`
✅ Puerto frontend: `10000`
✅ Puerto backend: `10001`
✅ CORS configurado para el dominio
✅ Variables de entorno actualizadas

2. **Iniciar servicios en producción:**
   ```bash
   ./deploy.sh start
   ```

3. **Verificar servicios:**
   ```bash
   ./deploy.sh status
   ```

## Puertos configurados:

- **Frontend (Nginx)**: Puerto `10000` → Cloudflare DNS
- **Backend (FastAPI)**: Puerto `10001` → API interna
- **Health checks**: Automáticos cada 30s

## Configuración de Cloudflare:

1. **DNS Record:**
   - Tipo: A
   - Name: reportediario
   - IPv4 address: IP_DE_TU_SERVIDOR
   - Proxy status: Orange cloud (Proxied) ✅

2. **Page Rules (recomendadas):**
   - `reportediario.inemec.com/api/*` → SSL: Full
   - `reportediario.inemec.com/*` → Always Use HTTPS

3. **URLs finales:**
   - Frontend: `https://reportediario.inemec.com:10000`
   - API: `https://reportediario.inemec.com:10001`

## Comandos útiles:

```bash
# Iniciar servicios
./deploy.sh start

# Ver logs
./deploy.sh logs

# Reiniciar (con rebuild)
./deploy.sh restart

# Estado de servicios
./deploy.sh status

# Detener servicios
./deploy.sh stop
```

## Estructura de archivos de datos:

```
Admin-daily-report/
├── data/              # Archivos Excel persistentes
│   └── reportes_diarios.xlsx
├── logs/              # Logs de aplicación
│   └── admin_daily_report.log
└── docker-compose.prod.yml
```

## Troubleshooting:

1. **Puerto ya en uso:**
   ```bash
   sudo lsof -i :10000
   sudo lsof -i :10001
   ```

2. **Verificar containers:**
   ```bash
   docker ps
   docker logs admin-daily-report-frontend-1
   docker logs admin-daily-report-backend-1
   ```

3. **Rebuilds completos:**
   ```bash
   docker system prune -f
   ./deploy.sh restart
   ```

## Monitoreo:

- **Health check frontend**: `https://reportediario.inemec.com:10000/health`
- **Health check backend**: `https://reportediario.inemec.com:10001/health`  
- **API docs**: `https://reportediario.inemec.com:10001/docs`

## Verificación de despliegue:

```bash
# Verificar que los puertos estén abiertos
curl -I https://reportediario.inemec.com:10000/health
curl -I https://reportediario.inemec.com:10001/health

# Verificar contenedores
./deploy.sh status
```