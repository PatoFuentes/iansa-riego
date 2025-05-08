import { Component, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare var bootstrap: any;

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  menuOpen = false;

  loginData = {
    correo: '',
    contrasenia: '',
  };

  constructor(
    public authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  get usuarioLogueado(): any {
    return this.authService.getUsuario();
  }

  get esAdmin(): boolean {
    const usuario = this.usuarioLogueado;
    return usuario?.tipo === 'administrador';
  }

  iniciarSesion(): void {
    const { correo, contrasenia } = this.loginData;

    this.authService.login(correo, contrasenia).subscribe({
      next: (response) => {
        const { token, usuario } = response;

        this.authService.setUsuario(usuario);
        this.authService.setToken(token);

        this.toastr.success(`Bienvenido, ${usuario.nombre} 👋`);
        this.loginData = { correo: '', contrasenia: '' };

        const modal = document.getElementById('loginModal');
        if (modal) {
          const bsModal =
            bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
          bsModal.hide();
        }
      },
      error: () => {
        this.toastr.error('Credenciales inválidas ❌');
      },
    });
  }

  @HostListener('document:click', ['$event'])
  onClickFueraDelMenu(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (
      this.menuOpen &&
      !target.closest('.nav-menu') &&
      !target.closest('.btn-toggle-menu')
    ) {
      this.menuOpen = false;
    }
  }
}
