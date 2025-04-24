import { Routes } from '@angular/router';
import { ZonaViewComponent } from './zona-view.component';

export const zonasRoutes: Routes = [
  { path: ':id', component: ZonaViewComponent },
];
