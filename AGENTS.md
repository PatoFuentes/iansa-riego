# 📑 AGENTES del Sistema de Riego

Este documento describe todos los **agentes** que participan en la plataforma de riego basada en Angular y Node.js. Su objetivo es centralizar la información sobre procesos automáticos, scripts y servicios para facilitar el mantenimiento y futuras ampliaciones.

## ¿Qué es un agente?

En el contexto de este proyecto, un *agente* es cualquier componente que se ejecuta de forma automática o semiautomática para realizar tareas específicas. Esto incluye servicios en segundo plano, scripts de automatización, crawlers, pipelines de CI/CD y contenedores desplegados en Cloud Run.

## Referencias de la estructura del proyecto

Para detalles de la organizacion de carpetas revisa [docs/frontend.md](docs/frontend.md). En `frontend/src/app` existen:

- `core/` - servicios, guards e interceptores.
- `features/` - modulos funcionales (usuarios, zonas, regiones, etc.).
- `shared/` - componentes reutilizables.

El backend se encuentra en `backend/` y su distribucion se explica en [docs/backend.md](docs/backend.md).

## Estructura general de la base de datos

La base de datos MySQL/MariaDB se describe en [docs/database.md](docs/database.md). Alli se listan tablas como `usuarios`, `regiones`, `zonas`, `temporadas` y `recomendaciones`, utiles para planificar nuevas entidades.

## Agentes registrados

### Backend - API Express
- **Tecnología:** Node.js + Express
- **Punto de entrada:** `backend/server.js`
- **Frecuencia:** Activo mientras el contenedor de Cloud Run esté en ejecución
- **Descripción:** Expone la API REST, maneja autenticación JWT y conecta con la base de datos MySQL.
- **Dependencias:** MySQL/MariaDB, variables de entorno (`DB_HOST`, `JWT_SECRET`, etc.)

### Crawler INIA
- **Tecnología:** Node.js + Puppeteer
- **Punto de entrada:** `backend/crawlerINIA.js` (invocado desde el backend)
- **Frecuencia:** Bajo demanda a través de los endpoints `/api/eto` y `/api/clima-semanal`
- **Descripción:** Obtiene datos de ETo y clima semanal desde agrometeorologia.cl para generar recomendaciones de riego.
- **Dependencias:** Acceso HTTP a estaciones INIA/DMC, librería `puppeteer`

### Frontend Angular
- **Tecnología:** Angular 19 + Nginx (para servir la SPA)
- **Punto de entrada:** `frontend/src/main.ts` (build) / `nginx.conf` (runtime)
- **Frecuencia:** Atiende solicitudes de usuario en Cloud Run
- **Descripción:** Interfaz web que consume la API y dispara la ejecución del crawler.
- **Dependencias:** Servicios del backend, librerías Angular

### Cloud Build Pipeline
- **Tecnología:** Google Cloud Build
- **Punto de entrada:** `cloudbuild.yaml`
- **Frecuencia:** Cada despliegue iniciado por GitHub Actions
- **Descripción:** Construye imágenes Docker de frontend y backend y las despliega en Cloud Run.
- **Dependencias:** Cuenta de servicio con permisos a Cloud Run y Artifact Registry

### GitHub Actions
- **Tecnología:** GitHub Actions
- **Punto de entrada:** `.github/workflows/test.yaml` y `.github/workflows/deploy.yaml`
- **Frecuencia:**
  - `test.yaml`: en cada push o pull request a `main`
  - `deploy.yaml`: en cada push a `main`
- **Descripción:** Ejecuta lint y pruebas del frontend; luego dispara Cloud Build para desplegar.
- **Dependencias:** Secret `GCP_SA_KEY`, Node.js 22, permisos en el repositorio

## Ejemplos de flujo de trabajo

1. **Generación de recomendación de riego**
   1. El usuario en el frontend presiona "Generar recomendación".
   2. El frontend invoca `/api/eto` en el backend.
   3. El backend ejecuta `crawlerINIA.js`, obtiene datos de la estación y responde con la información.
   4. El usuario revisa la previsualización y guarda la recomendación.

2. **Despliegue continuo**
   1. Un desarrollador hace push a `main`.
   2. `test.yaml` corre lint y unit tests del frontend.
   3. Si todo es exitoso, `deploy.yaml` autentica con GCP y ejecuta `cloudbuild.yaml`.
   4. Cloud Build construye las imágenes Docker y actualiza ambos servicios en Cloud Run.

## Cómo crear un nuevo agente

1. Ubique la carpeta correspondiente (`backend/`, `frontend/` u otra).
2. Cree el archivo inicial del agente siguiendo la estructura del proyecto.
3. Añada cualquier dependencia en el `package.json` respectivo y ejecute `npm install`.
4. Documente el nuevo agente en este archivo (`AGENTS.md`) con nombre, descripción, tecnología y punto de entrada.
5. Si el agente requiere despliegue en Cloud Run, actualice `cloudbuild.yaml` y, de ser necesario, los workflows de GitHub Actions.
6. Realice pruebas locales antes de hacer commit y abra un Pull Request siguiendo las buenas prácticas del README.
7. Respete las convenciones de nombre y la estructura de carpetas descritas en la documentacion del proyecto.

## Pautas para generar componentes Angular

Utiliza `ng generate component <ruta>` para crear nuevos componentes. Ubica el codigo en `features/<modulo>` si el componente es especifico de un modulo, o en `shared/` cuando sea reutilizable.

## Como agregar nuevos modelos o tablas

Las tablas se gestionan en MySQL/MariaDB y cualquier modificacion debe quedar registrada en [docs/database.md](docs/database.md). Puedes enlazar scripts de migracion o usar un ORM si se integra en el futuro.

## Mantenimiento y monitoreo

- Revisar los logs de Cloud Run y Cloud Build desde la consola de Google Cloud para detectar errores.
- Mantener actualizadas las dependencias en `package.json` mediante `npm audit` y `npm update` periódicamente.
- Habilitar alertas en Cloud Monitoring para detectar fallos repetidos de los contenedores.
- Para el crawler, validar que las páginas de origen no hayan cambiado su estructura.

## Consideraciones de seguridad

- El backend utiliza tokens JWT firmados con `JWT_SECRET` (definido en `.env`).
- GitHub Actions accede a GCP mediante la credencial `GCP_SA_KEY` almacenada como secreto.
- Las variables de entorno sensibles nunca deben subirse al repositorio.
- Se recomienda limitar las reglas de firewall en Cloud Run y rotar las claves periódicamente.

## Tabla resumen de agentes

| Agente            | Tipo                 | Frecuencia                 | Estado |
|-------------------|----------------------|----------------------------|--------|
| Backend API       | Servicio Node.js     | Siempre activo en Cloud Run| ✅ |
| Crawler INIA      | Script Puppeteer     | Bajo demanda vía API       | ✅ |
| Frontend Angular  | SPA + Nginx         | Activo en Cloud Run        | ✅ |
| Cloud Build       | Pipeline CI/CD       | En cada despliegue         | ✅ |
| GitHub Actions    | Pipeline CI y Deploy | Push/Pull Request a `main` | ✅ |

