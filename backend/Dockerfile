# Backend Dockerfile para Admin Daily Report API
FROM python:3.11-slim

# Configurar variables de entorno
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Crear directorios necesarios
RUN mkdir -p /app/data /app/logs /app/data/backups

# Copiar código de la aplicación
COPY . .

# Crear usuario no-root para seguridad
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app

# Cambiar a usuario no-root
USER app

# Exponer puerto
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Comando por defecto
CMD ["python", "main.py"]