# ⚙️ Backend - API y Procesamiento de Datos

El backend está desarrollado con **Node.js** y utiliza **Express** como framework principal. Proporciona una API REST para gestionar zonas, usuarios, datos climáticos y recomendaciones de riego.

---

## 🗂 Estructura del Backend

```bash
backend/
├── server.js           # Archivo principal del servidor Express
├── crawlerINIA.js      # Crawler para obtener ETo y clima semanal
├── routes/             # Rutas de la API (pendiente modularización)
├── controllers/        # Lógica (puede modularizarse)
├── .env                # Variables de entorno
├── Dockerfile          # Imagen para desplegar en Cloud Run
```

---

## 📡 Rutas Principales

| Método | Endpoint                     | Descripción                                |
|--------|------------------------------|--------------------------------------------|
| GET    | /api/zonas                   | Obtener zonas de riego                     |
| GET    | /api/usuarios                | Obtener usuarios                           |
| POST   | /api/recomendaciones         | Crear una nueva recomendación              |
| GET    | /api/eto                     | Ejecuta el crawler INIA para ETo semanal   |
| GET    | /api/clima-semanal           | Ejecuta el crawler para clima semanal      |

---

## 🔄 Crawler INIA

Archivo: `crawlerINIA.js`

- Usa `puppeteer` para automatizar la obtención de ETo y Precipitación desde agrometeorologia.cl.
- Se ejecuta cuando se accede a `/api/eto` o `/api/clima-semanal`.
- El archivo es importado en `server.js` y no tiene un endpoint separado.

---

## 🔐 Variables de Entorno (.env)

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=iansa_riego
PORT=3000
```

---

## 🐳 Dockerfile (Resumen)

```Dockerfile
FROM node:22
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["node", "server.js"]
```

> Además se crea la carpeta `/cloudsql` en tiempo de build para conexión con Cloud SQL en producción.

---

## ☁️ Despliegue en Cloud Run

- Expone el backend en el puerto `3000`, mapeado automáticamente a `8080` por Cloud Run.
- Usa variables de entorno definidas en el entorno de ejecución.
- Se construye y despliega desde `cloudbuild.yaml`.

---

¿Preguntas sobre el backend? Puedes revisarlo en `server.js` y `crawlerINIA.js`.