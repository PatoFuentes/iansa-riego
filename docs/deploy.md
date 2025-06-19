# 🚀 Despliegue del Proyecto en Google Cloud Platform (GCP)

Esta sección describe el proceso de despliegue automático del sistema de riego usando Docker, GitHub Actions y Google Cloud Platform, específicamente con Cloud Run.

---

## 🌐 Servicios Utilizados en GCP

| Servicio             | Uso principal                                   |
|----------------------|--------------------------------------------------|
| Cloud Run            | Hospedaje de contenedores para frontend/backend |
| Cloud Build          | Automatiza los builds de Docker                 |
| Cloud SQL            | Base de datos MySQL                             |
| Artifact Registry    | Almacén de imágenes Docker                      |
| IAM                  | Permisos y cuentas de servicio                  |
| Cloud Logging        | Logs de ejecución de los servicios              |

---

## 🧱 Estructura del Despliegue

```bash
.github/workflows/
├── deploy.yaml       # CI/CD para build + deploy
├── test.yaml         # Lint y pruebas automáticas

cloudbuild.yaml        # Build y despliegue en Cloud Run
frontend/Dockerfile    # Imagen frontend Angular
backend/Dockerfile     # Imagen backend Express
```

---

## ⚙️ Archivos Clave

### 📁 `cloudbuild.yaml`

Define los pasos para:

- Build backend y frontend (Docker)
- Push a Artifact Registry
- Deploy en Cloud Run

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/PROYECTO/backend-riego', '.']
    dir: 'backend'
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/PROYECTO/frontend-riego', '.']
    dir: 'frontend'
  ...
```

### 📁 `.github/workflows/deploy.yaml`

Se ejecuta en cada `push` a `main`. Autentica con GCP y lanza `cloudbuild.yaml`.

```yaml
on:
  push:
    branches:
      - main
```

---

## 🔐 Secrets en GitHub

| Nombre         | Descripción                           |
|----------------|----------------------------------------|
| `GCP_SA_KEY`   | JSON de la cuenta de servicio con permisos a Cloud Run, Build y Storage |

---

## ☁️ Configuraciones Relevantes

- Cada microservicio (frontend y backend) tiene su propia imagen Docker.
- El contenedor debe escuchar en el puerto especificado por la variable `PORT` (por defecto 8080).
- Las variables de entorno del backend se configuran directamente en la consola de Cloud Run.

## 🔗 Conectar Cloud Run a Cloud SQL

Para que el backend se comunique con la base de datos es necesario habilitar
la conexión de **Cloud SQL** en el servicio de Cloud Run. Esto puede hacerse en
la consola marcando la opción correspondiente o ejecutando:

```bash
gcloud run deploy --add-cloudsql-instances=INSTANCIA
```

Sin esta configuración no se creará el directorio de sockets
`/cloudsql/...` dentro del contenedor y la aplicación se cerrará antes de
escuchar peticiones.

---

## 🧪 Pruebas Automatizadas

Se ejecutan antes del despliegue en el workflow `test.yaml`:

```yaml
on:
  push:
    branches:
      - main
  pull_request:
```

---

## ✅ Requisitos Previos

1. Activar APIs en GCP:
   - Cloud Run
   - Cloud Build
   - Artifact Registry
   - Cloud SQL Admin

2. Crear cuenta de servicio y otorgar permisos:
   - Cloud Run Admin
   - Cloud Build Editor
   - Storage Admin (para logs y fuentes)

3. Agregar JSON de cuenta como secret en GitHub.

---

## 📦 Resultado

- Producción disponible en:
  - Frontend: `https://frontend-riego-xxx.run.app`
  - Backend: `https://backend-riego-xxx.run.app`