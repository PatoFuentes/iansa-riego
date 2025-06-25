# 1. Usa una imagen base oficial de Node.js
FROM node:22

# 2. Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copia los archivos del backend al contenedor
COPY . .

# 4. Instala las dependencias
RUN npm install

# ✅ 5. Crea la carpeta para el socket de Cloud SQL
RUN mkdir -p /cloudsql

# 6. Expone el puerto que usará tu backend (usa el mismo que en tu server.js)
EXPOSE 3306

# 7. Comando para arrancar la app
CMD ["node", "server.js"]
