import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  correo: string = '';
  contrasenia: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  login() {
    this.authService.login(this.correo, this.contrasenia).subscribe({
      next: (response) => {
        const { token, usuario } = response;

        this.authService.setUsuario(usuario);
        this.authService.setToken(token);
        
        this.toastr.success('Bienvenido ' + usuario.nombre);
        this.router.navigate(['']);
      },
      error: () => {
        this.toastr.error('Correo o contraseña incorrectos');
      },
    });
  }
}
