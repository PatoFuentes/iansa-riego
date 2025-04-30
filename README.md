# 🌱 Plataforma de Riego - Proyecto de Gestión de Consumo de Agua

Bienvenido a la plataforma de riego, una aplicación web diseñada para gestionar, analizar y recomendar el consumo de agua de zonas de riego basadas en datos meteorológicos reales.

---

## 🔄 Tecnologías Utilizadas

| Tecnología | Propósito |
|:-----------|:----------|
| Angular 19  | Frontend SPA |
| Node.js + Express  | Backend API REST |
| MySQL/MariaDB | Base de datos |
| Puppeteer  | Crawler automático de estaciones meteorológicas |
| Nginx | Servidor para Angular en producción |
| Google Cloud Platform (GCP) | Infraestructura cloud (Cloud Run, Cloud SQL, Cloud Build) |
| GitHub Actions | Automatización CI/CD |

---

## 🚀 Despliegue Automático

- **CI/CD:** Cada `git push` a `main` ejecuta:
  - Lint + Pruebas Unitarias.
  - Build de Backend (Node.js) y Frontend (Angular).
  - Deploy automático a **Cloud Run**.
- **Docker:** Backend y frontend se empaquetan como contenedores independientes.
- **Cloud Build:** Builda y despliega automáticamente.

---

## 🔧 Levantamiento en Local

### 1. Clonar el proyecto
```bash
git clone https://github.com/tu-usuario/proyecto-riego.git
cd proyecto-riego
```

### 2. Frontend
```bash
cd frontend
npm install
npm run start
```
Acceder a `http://localhost:4200`

### 3. Backend
```bash
cd backend
npm install
node server.js
```
Acceder a `http://localhost:3000`

### 4. Base de Datos
- Crear base de datos `iansa_riego`.
- Importar el esquema necesario.

### Variables de entorno necesarias (.env en backend)
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD= (según configuración local)
DB_NAME=iansa_riego
PORT=3000
```

---

## 📂 Estructura de Carpetas

```bash
/
|- frontend/          # Proyecto Angular 19
|- backend/           # Proyecto Node.js Express + Crawler
|- cloudbuild.yaml    # Pipeline para GCP
|- .github/workflows/ # Workflows GitHub Actions (tests + deploy)
|- README.md
|- .gitignore
```

---

## 🔑 Secrets en GitHub

| Secret | Descripción |
|:-------|:------------|
| GCP_SA_KEY | JSON de la cuenta de servicio de GCP para deploy |

---

## 💎 Características Principales

- 📊 **Consumo de Agua Semanal:** Visualización de datos desde estaciones meteorológicas.
- 🔗 **Crawler Automático:** Obtención de ETo semanal.
- 📈 **Gráficos y Exportación:** Tablas exportables en Excel.
- 🌧️ **Recomendaciones Dinámicas:** Cálculo automático de necesidades de riego.
- 📅 **Gestor de Usuarios:** Administradores y Técnicos.

---

## 🚫 No Deben Subirse a GitHub

- `node_modules/`
- `.env`
- `.angular/`
- `dist/`
- `.vscode/`, `.idea/`, otros de entorno local

---

## 🏁 Estado del Proyecto

- 📅 Despliegue activo con CI/CD
- 🔄 Backend y Frontend corriendo en Cloud Run
- 📊 Mejoras futuras: optimización crawler

---

## 📚 Cómo Contribuir

✍️ Si deseas colaborar en este proyecto:

1. Realiza un fork de este repositorio.
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios.
4. Asegúrate de pasar los tests y el linting (`npm run lint`, `npm run test`).
5. Haz commit de tus cambios (`git commit -m 'feat: describe tu funcionalidad'`).
6. Envía un Pull Request a la rama `main`.

**Notas:**
- Sigue las buenas prácticas de programación y estilo definido en el proyecto.
- Cualquier duda o sugerencia, puedes abrir una "Issue".

---

📚 Documentación
La documentación completa del sistema está disponible en:

👉 https://PatoFuentes.github.io/iansa-riego/




