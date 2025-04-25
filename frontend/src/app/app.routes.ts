import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './shared/login/login.component';
import { ConceptoViewComponent } from './features/conceptos/concepto-view/concepto-view.component';
import { regionesRoutes } from './features/regiones/regiones.routes';
import { zonasRoutes } from './features/zonas/zona-view/zonas.routes';
import { AuthGuard } from './core/guards/auth.guard';
import { usuariosRoutes } from './features/usuarios/usuario-index/usuario.routes';
import { temporadasRoutes } from './features/temporadas/temporada.routes';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'conceptos', component: ConceptoViewComponent },
  { path: 'regiones', children: regionesRoutes }, // subrutas de Regiones
  { path: 'zonas', children: zonasRoutes },
  { path: 'usuarios', canActivate: [AuthGuard], children: usuariosRoutes },
  { path: 'temporadas', canActivate: [AuthGuard], children: temporadasRoutes },
];
