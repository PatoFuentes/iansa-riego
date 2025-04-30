# 🧱 Frontend - Plataforma de Riego

## 📦 Estructura del Proyecto Angular

```bash
frontend/
├── src/
│   ├── app/
│   │   ├── core/              # Servicios, guards, interceptores
│   │   ├── features/          # Módulos funcionales (usuarios, zonas, regiones, etc.)
│   │   ├── shared/            # Componentes reutilizables (login, navbar, etc.)
│   │   ├── app.component.ts   # Componente principal
│   │   ├── app.routes.ts      # Configuración de rutas
│   ├── environments/          # Configuraciones de entorno
├── angular.json               # Configuración Angular CLI
├── tsconfig.*.json            # Configuración TypeScript
```

## 📁 Módulos Funcionales (`features/`)

Contienen cada parte principal de la app:

- `usuarios/`: vista y CRUD de usuarios
- `regiones/`: administración de regiones
- `zonas/`: zonas de riego y sus datos climáticos
- `conceptos/`: definición de conceptos de riego
- `temporadas/`: manejo de temporadas activas

## 🔄 Ruteo (`app.routes.ts`)

Se definen las rutas de cada módulo. Algunas rutas están protegidas con un `AuthGuard`:

```ts
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'conceptos', component: ConceptoViewComponent },
  { path: 'regiones', children: regionesRoutes }, // subrutas de Regiones
  { path: 'zonas', children: zonasRoutes },
  { path: 'usuarios', canActivate: [AuthGuard], children: usuariosRoutes },
  { path: 'temporadas', canActivate: [AuthGuard], children: temporadasRoutes },
];
```

## 🔐 Autenticación

- Se usa `AuthService` para manejar login/logout.
- El login se realiza mediante correo y contraseña.
- Los roles (`técnico`, `administrador`) determinan acceso en la navbar.

## 🔧 Servicios Importantes

- `CrawlerService`: obtiene datos de ETo y clima semanal desde el backend.
- `UsuarioService`: CRUD de usuarios.
- `ZonaService`: obtiene zonas, clima, consumo, recomendaciones.

## 🌐 Entornos

- `environment.ts`: para desarrollo (`localhost`)
- `environment.prod.ts`: producción (`Cloud Run`)