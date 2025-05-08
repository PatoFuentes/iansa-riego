import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private usuarioActual: Usuario |null = null;

  constructor(private http: HttpClient) {}

  login(correo: string, contrasenia: string) {
    return this.http.post<any>(`${environment.apiUrl}/login`, {
      correo,
      contrasenia,
    });
  }

  setUsuario(usuario: Usuario) {
    this.usuarioActual = usuario;
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  getUsuario(): Usuario | null {
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
    this.clearToken();
    localStorage.removeItem('usuario');
  }

  setToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  clearToken() {
    localStorage.removeItem('token');
  }
}
