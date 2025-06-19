# 🌿 Plataforma de Riego - Documentación Técnica

Bienvenido a la documentación oficial del proyecto **Plataforma de Riego**, una solución para la gestión de consumo de agua en zonas agrícolas utilizando datos meteorológicos.

---

## 📚 Índice

- [Introducción](#introduccion)
- [Requisitos](#requisitos)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Despliegue Local](#despliegue-local)
- [Despliegue en Producción (GCP)](#despliegue-en-produccion-gcp)
- [CI/CD con GitHub Actions](#cicd-con-github-actions)
- [Crawler Meteorológico](#crawler-meteorologico)
- [Frontend Angular](#frontend-angular)
- [Backend Node.js](#backend-nodejs)
- [Variables de Entorno](#variables-de-entorno)

---

## Introducción
La plataforma permite visualizar y generar recomendaciones de riego semanal con base en datos climáticos extraídos de estaciones meteorológicas de Chile.

---

## Requisitos
- Node.js v22
- Angular CLI 19+
- MySQL/MariaDB
- Cuenta en Google Cloud Platform
- Docker

---

## Estructura del Proyecto

```
├── backend/              # API REST y lógica del crawler
│   ├── crawlerINIA.js    # Crawler para ETo semanal
│   └── server.js         # Express server principal
│
├── frontend/             # Aplicación Angular SPA
│   └── src/
│       └── app/
│           ├── features/ # Componentes principales (zonas, regiones, usuarios, etc.)
│           └── core/     # Servicios, guards y helpers
│
├── cloudbuild.yaml       # Script de despliegue automático
├── .github/workflows/    # GitHub Actions para CI/CD y tests
└── docs/                 # Documentación Markdown (esta carpeta)
```

---

## Despliegue Local
### Backend
```bash
cd backend
npm install
node server.js
```

### Frontend
```bash
cd frontend
npm install
npm run start
```

### Acceso:
- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:8080`

---

## Despliegue en Producción (GCP)

1. Crear proyecto en Google Cloud.
2. Habilitar servicios:
   - Cloud Run
   - Cloud SQL
   - Cloud Build
3. Subir `credentials.json` como secreto `GCP_SA_KEY` en GitHub.
4. Configurar `cloudbuild.yaml` y `deploy.yaml`.
5. Push a `main` dispara el despliegue.

---

## CI/CD con GitHub Actions
- `test.yaml`: Lint y pruebas unitarias al hacer push/pull_request
- `deploy.yaml`: Despliegue completo solo en la rama `main`

---

## Crawler Meteorológico
- Archivo: `backend/crawlerINIA.js`
- Funciones:
  - Consulta a agrometeorología.cl
  - Extrae ETo diario
  - Promedia y formatea datos para recomendación

---

## Frontend Angular
- Carpeta `frontend/`
- Componentes clave:
  - `zona-view`: Visualización de clima, recomendaciones y consumo
  - `usuario-index`: Administración de usuarios
- Servicios importantes:
  - `CrawlerService`: Obtiene datos climáticos de backend

---

## Backend Node.js
- Archivo principal: `server.js`
- Rutas `/api/clima-semanal`, `/api/eto`, etc.
- Conexión a Cloud SQL por socket `/cloudsql/...`

---

## Variables de Entorno
Crear archivo `.env` en `backend/`:
```bash
DB_HOST=/cloudsql/id-pagina-riego:us-central1:id-bd-riego
DB_USER=root
DB_PASSWORD=tu_clave
DB_NAME=iansa_riego
PORT=8080
```

---

## 📌 Autor
**Patricio Fuentes** — Ingeniería Civil Informática, Universidad Adventista de Chile.

