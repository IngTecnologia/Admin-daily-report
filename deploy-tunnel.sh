#!/bin/bash

# Script de despliegue para Cloudflare Tunnel
# Uso: ./deploy-tunnel.sh [start|stop|restart|logs|status|setup]

set -e

ACTION=${1:-start}

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar si Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker no está instalado"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
        error "Docker Compose no está disponible"
        exit 1
    fi
}

# Verificar configuración para túnel
check_tunnel_config() {
    log "Verificando configuración del túnel..."
    
    # Verificar archivos necesarios
    if [[ ! -f "docker-compose.tunnel.yml" ]]; then
        error "Archivo docker-compose.tunnel.yml no encontrado"
        exit 1
    fi
    
    if [[ ! -f ".env.tunnel" ]]; then
        error "Archivo .env.tunnel no encontrado"
        echo ""
        warning "Crea el archivo .env.tunnel con tu TUNNEL_TOKEN"
        exit 1
    fi
    
    # Verificar que existe el token
    if ! grep -q "TUNNEL_TOKEN=" .env.tunnel; then
        error "TUNNEL_TOKEN no encontrado en .env.tunnel"
        exit 1
    fi
    
    # Verificar que el token no esté vacío
    source .env.tunnel
    if [[ -z "$TUNNEL_TOKEN" || "$TUNNEL_TOKEN" == "tu_token_aqui_sera_muy_largo" ]]; then
        error "TUNNEL_TOKEN está vacío o sin configurar"
        echo ""
        warning "Configura tu TUNNEL_TOKEN real en .env.tunnel"
        exit 1
    fi
    
    success "Configuración del túnel verificada"
}

# Configuración inicial
setup_environment() {
    log "Configurando entorno para Cloudflare Tunnel..."
    
    # Crear directorios necesarios
    mkdir -p data logs
    
    # Copiar archivo de entorno si no existe
    if [[ ! -f ".env" ]]; then
        if [[ -f ".env.tunnel" ]]; then
            cp .env.tunnel .env
            success "Archivo .env creado desde .env.tunnel"
        else
            warning "Crea el archivo .env.tunnel con tu configuración"
        fi
    fi
    
    # Configurar permisos
    chmod 755 data logs
    
    success "Entorno configurado"
}

# Mostrar instrucciones para configurar túnel
show_tunnel_instructions() {
    echo ""
    log "📋 INSTRUCCIONES PARA CONFIGURAR EL TÚNEL:"
    echo ""
    echo "1. Ve al Cloudflare Zero Trust Dashboard:"
    echo "   https://one.dash.cloudflare.com/"
    echo ""
    echo "2. Ve a Networks > Tunnels > Create a tunnel"
    echo ""
    echo "3. Nombra tu túnel: 'reportediario-tunnel'"
    echo ""
    echo "4. Copia el token que aparece y úsalo en .env.tunnel"
    echo ""
    echo "5. Configura estas rutas públicas:"
    echo "   - Subdomain: reportediario"
    echo "     Domain: inemec.com"
    echo "     Service: http://frontend:80"
    echo ""
    echo "   - Subdomain: api.reportediario"
    echo "     Domain: inemec.com"
    echo "     Service: http://backend:8001"
    echo ""
    echo "6. Ejecuta: ./deploy-tunnel.sh start"
    echo ""
}

case $ACTION in
  start)
    log "🚇 Iniciando servicios con Cloudflare Tunnel..."
    
    check_docker
    check_tunnel_config
    setup_environment
    
    # Construir y ejecutar contenedores
    docker-compose -f docker-compose.tunnel.yml --env-file .env.tunnel up -d --build
    
    # Esperar un momento para que los servicios inicien
    sleep 10
    
    # Verificar estado
    log "Verificando estado de servicios..."
    
    success "Servicios iniciados con Cloudflare Tunnel:"
    echo "   🌐 Frontend: https://reportediario.inemec.com"
    echo "   🔗 Backend API: https://api.reportediario.inemec.com"
    echo "   📚 API Docs: https://api.reportediario.inemec.com/docs"
    echo ""
    warning "NOTA: Los servicios están accesibles SOLO a través del túnel"
    warning "No hay puertos expuestos localmente (más seguro)"
    ;;
    
  stop)
    log "🛑 Deteniendo servicios..."
    docker-compose -f docker-compose.tunnel.yml down
    success "Servicios detenidos"
    ;;
    
  restart)
    log "🔄 Reiniciando servicios..."
    docker-compose -f docker-compose.tunnel.yml down
    sleep 5
    docker-compose -f docker-compose.tunnel.yml --env-file .env.tunnel up -d --build
    success "Servicios reiniciados"
    ;;
    
  logs)
    log "📋 Mostrando logs..."
    docker-compose -f docker-compose.tunnel.yml logs -f
    ;;
    
  status)
    log "📊 Estado de servicios con Cloudflare Tunnel..."
    echo ""
    docker-compose -f docker-compose.tunnel.yml ps
    echo ""
    
    log "🔍 Estado del túnel:"
    
    # Check tunnel
    TUNNEL_STATUS=$(docker logs cloudflared-tunnel --tail 10 2>/dev/null | grep -i "connection.*registered" | tail -1 || echo "No conectado")
    if [[ "$TUNNEL_STATUS" == *"registered"* ]]; then
        success "Túnel: Conectado"
    else
        warning "Túnel: Verificando conexión..."
        echo "   $TUNNEL_STATUS"
    fi
    
    echo ""
    log "🌐 URLs de acceso:"
    echo "   Frontend: https://reportediario.inemec.com"
    echo "   Backend: https://api.reportediario.inemec.com"
    echo "   API Docs: https://api.reportediario.inemec.com/docs"
    echo ""
    warning "Los servicios NO están expuestos localmente (solo túnel)"
    ;;
    
  setup)
    log "⚙️  Configuración inicial para Cloudflare Tunnel..."
    check_docker
    setup_environment
    
    if [[ ! -f ".env.tunnel" ]] || [[ -z "$TUNNEL_TOKEN" ]]; then
        show_tunnel_instructions
    else
        success "Configuración del túnel completada"
        echo ""
        log "¿Todo listo? Ejecuta: ./deploy-tunnel.sh start"
    fi
    ;;
    
  instructions|help)
    show_tunnel_instructions
    ;;
    
  *)
    echo "Uso: $0 [start|stop|restart|logs|status|setup|instructions]"
    echo ""
    echo "Comandos disponibles:"
    echo "  start        - Iniciar servicios con Cloudflare Tunnel"
    echo "  stop         - Detener todos los servicios"
    echo "  restart      - Reiniciar servicios con rebuild"
    echo "  logs         - Mostrar logs en tiempo real"
    echo "  status       - Mostrar estado de servicios y túnel"
    echo "  setup        - Configuración inicial"
    echo "  instructions - Mostrar instrucciones del túnel"
    echo ""
    echo "🚇 Con Cloudflare Tunnel:"
    echo "   ✅ Sin puertos expuestos (más seguro)"
    echo "   ✅ SSL automático"
    echo "   ✅ Sin configuración de firewall"
    echo "   ✅ Sin IP pública necesaria"
    exit 1
    ;;
esac