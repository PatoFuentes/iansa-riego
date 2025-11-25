# 1. Usa una imagen base oficial de Node.js
FROM node:22

# Dependencias del sistema requeridas por Chromium (usado por Puppeteer)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libu2f-udev \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxcomposite1 \
    libxdamage1 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*

# 2. Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copia los archivos del backend al contenedor
COPY . .

# 4. Instala las dependencias
RUN npm install

# ✅ 5. Crea la carpeta para el socket de Cloud SQL
RUN mkdir -p /cloudsql

# 6. Expone el puerto que usará tu backend (usa el mismo que en tu server.js)
EXPOSE 8080

# 7. Comando para arrancar la app
CMD ["node", "server.js"]
