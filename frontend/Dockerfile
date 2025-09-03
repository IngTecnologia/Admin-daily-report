# Etapa de construcci�n
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de configuraci�n
COPY package*.json ./
COPY vite.config.js ./

# Instalar dependencias
RUN npm ci 

# Copiar c�digo fuente
COPY . .

# Construir la aplicaci�n
RUN npm run build

# Etapa de producci�n
FROM nginx:alpine

# Copiar configuraci�n personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos construidos desde la etapa de construcci�n
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer puerto
EXPOSE 80

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]