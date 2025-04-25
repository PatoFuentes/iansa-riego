import { Routes } from '@angular/router';
import { RegionIndexComponent } from './region-index/region-index.component';
import { RegionViewComponent } from './region-view/region-view.component';

export const regionesRoutes: Routes = [
  { path: '', component: RegionIndexComponent }, // Ruta /regiones (lista de regiones)
  { path: ':id', component: RegionViewComponent }, // Ruta /regiones/:id (ver una region específica)
];
