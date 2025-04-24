import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/enviroment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private usuarioActual: any = null;

  constructor(private http: HttpClient) {}

  login(correo: string, contrasenia: string) {
    return this.http.post<any>(`${environment.apiUrl}/login`, {
      correo,
      contrasenia,
    });
  }

  setUsuario(usuario: any) {
    this.usuarioActual = usuario;
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  getUsuario() {
    return (
      this.usuarioActual ||
      JSON.parse(localStorage.getItem('usuario') || 'null')
    );
  }

  estaAutenticado(): boolean {
    return !!this.getUsuario();
  }

  logout() {
    this.usuarioActual = null;
    localStorage.removeItem('usuario');
  }
}
