// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const usuario = this.authService.getUsuario();

    if (usuario && usuario.tipo === 'administrador') {
      return true;
    }

    // Opcional: redirigir o mostrar alerta
    this.router.navigate(['/login']);
    return false;
  }
}
