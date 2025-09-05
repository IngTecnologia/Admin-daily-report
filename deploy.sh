#!/bin/bash

# Script de despliegue para Cloudflare
# Uso: ./deploy.sh [start|stop|restart|logs|status]

set -e

ACTION=${1:-start}

case $ACTION in
  start)
    echo "🚀 Iniciando servicios en modo producción..."
    
    # Crear directorios necesarios
    mkdir -p data logs
    
    # Construir y ejecutar contenedores
    docker-compose -f docker-compose.prod.yml up -d --build
    
    echo "✅ Servicios iniciados:"
    echo "   - Frontend: http://localhost:10000"
    echo "   - Backend API: http://localhost:10001"
    echo "   - Health checks: Ejecutándose cada 30s"
    ;;
    
  stop)
    echo "🛑 Deteniendo servicios..."
    docker-compose -f docker-compose.prod.yml down
    echo "✅ Servicios detenidos"
    ;;
    
  restart)
    echo "🔄 Reiniciando servicios..."
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml up -d --build
    echo "✅ Servicios reiniciados"
    ;;
    
  logs)
    echo "📋 Mostrando logs..."
    docker-compose -f docker-compose.prod.yml logs -f
    ;;
    
  status)
    echo "📊 Estado de servicios..."
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    echo "🔍 Health checks:"
    docker inspect admin-daily-report-frontend-1 --format='{{.State.Health.Status}}' 2>/dev/null && echo "Frontend: OK" || echo "Frontend: No disponible"
    docker inspect admin-daily-report-backend-1 --format='{{.State.Health.Status}}' 2>/dev/null && echo "Backend: OK" || echo "Backend: No disponible"
    ;;
    
  *)
    echo "Uso: $0 [start|stop|restart|logs|status]"
    echo ""
    echo "Comandos disponibles:"
    echo "  start   - Iniciar servicios en modo producción"
    echo "  stop    - Detener todos los servicios"
    echo "  restart - Reiniciar servicios con rebuild"
    echo "  logs    - Mostrar logs en tiempo real"
    echo "  status  - Mostrar estado de servicios"
    exit 1
    ;;
esac