# ⚙️ Documentación de Configuración del Proyecto

Esta sección detalla la configuración necesaria para el correcto funcionamiento y despliegue del sistema de riego desarrollado con Angular y Node.js.

---

## 🔧 Variables de Entorno (`.env`)

Ubicación: `/backend/.env`

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=*****
DB_NAME=iansa_riego
PORT=8080
JWT_SECRET=mi_clave_secreta_segura
ET_URL=https://agrometeorologia.cl/evapotranspiracion/
RESUMEN_URL=https://agrometeorologia.cl/
```

> ⚠️ Nunca subir este archivo a GitHub. Está en `.gitignore`.

---

## 🌐 Configuración de `environment.ts`

### Desarrollo (`frontend/environments/environment.ts`)
```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};
```

### Producción (`frontend/environments/environment.prod.ts`)
```ts
export const environment = {
  production: true,
  apiUrl: 'https://backend-riego-XXXXXX.a.run.app'
};
```

---

## 🐳 Docker

### `/backend/Dockerfile`
Define el backend Node.js con instalación de dependencias y configuración Express.

### `/frontend/Dockerfile`
Build de Angular y configuración con NGINX:

```dockerfile
FROM node:22 AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build -- --configuration production --base-href /

FROM nginx:alpine
COPY --from=build /app/dist/frontend-riego /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

---

## 🔁 Cloud Build y Deploy

### `/cloudbuild.yaml`
Ejecuta:
- Build de frontend y backend
- Push a Container Registry
- Deploy a Cloud Run

### `.github/workflows/deploy.yaml`
CI/CD automático para `main`:
- Test
- Build
- Deploy

---

## 🔐 Seguridad y JWT

### Middleware (`backend/authMiddleware.js`)
Protege endpoints usando token JWT.

### Token desde backend (`/login`)
```js
const token = jwt.sign({ rut: usuario.rut, tipo: usuario.tipo }, process.env.JWT_SECRET, { expiresIn: "8h" });
```

---

## 🌍 Dominio y VPS / GCP

- Configurar `hostname` con dominio (ej. `www.iansa-riego.cl`)
- Vincular DNS al backend y frontend
- Asegurar puertos abiertos 80 y 443
- Activar SSL Let’s Encrypt o certbot

---

## 📁 Otros Archivos Importantes

- `angular.json`: configuración build Angular
- `mkdocs.yml`: documentación del sistema
- `tsconfig.json`: compilador TypeScript
- `.gitignore`: excluye `.env`, `node_modules`, `dist/`, etc.

---

> ✅ Esta documentación ayuda a replicar y mantener la configuración del sistema en cualquier entorno.