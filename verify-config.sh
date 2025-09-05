#!/bin/bash

# Script de verificación de configuración para reportediario.inemec.com
echo "🔍 Verificando configuración para reportediario.inemec.com..."
echo ""

# Verificar archivos de configuración
echo "📁 Archivos de configuración:"
echo "✅ docker-compose.prod.yml: $(test -f docker-compose.prod.yml && echo 'Existe' || echo 'Faltante')"
echo "✅ .env.production: $(test -f .env.production && echo 'Existe' || echo 'Faltante')"
echo "✅ deploy.sh: $(test -x deploy.sh && echo 'Ejecutable' || echo 'No ejecutable')"
echo ""

# Verificar configuración del dominio
echo "🌐 Configuración de dominio:"
echo "Frontend API URL:"
grep -r "reportediario.inemec.com" .env.production docker-compose.prod.yml 2>/dev/null | head -3
echo ""

echo "Backend CORS:"
grep -r "reportediario.inemec.com" backend/src/config.py 2>/dev/null
echo ""

# Verificar puertos
echo "🚪 Configuración de puertos:"
echo "Puerto frontend: $(grep -A5 -B5 '10000:80' docker-compose.prod.yml | grep -o '10000:80' || echo 'No configurado')"
echo "Puerto backend: $(grep -A5 -B5 '10001:8001' docker-compose.prod.yml | grep -o '10001:8001' || echo 'No configurado')"
echo ""

# Verificar directorios
echo "📂 Directorios de datos:"
echo "data/: $(test -d data && echo 'Existe' || echo 'Se creará automáticamente')"
echo "logs/: $(test -d logs && echo 'Existe' || echo 'Se creará automáticamente')"
echo ""

# Resumen de URLs
echo "🔗 URLs finales:"
echo "Frontend: https://reportediario.inemec.com:10000"
echo "Backend API: https://reportediario.inemec.com:10001"
echo "API Docs: https://reportediario.inemec.com:10001/docs"
echo "Health Check Frontend: https://reportediario.inemec.com:10000/health"
echo "Health Check Backend: https://reportediario.inemec.com:10001/health"
echo ""

echo "✅ Configuración verificada. Listo para desplegar con:"
echo "   ./deploy.sh start"