import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  getUsuario(rut: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${rut}`);
  }

  addUsuario(usuario: Usuario): Observable<any> {
    return this.http.post(this.apiUrl, usuario);
  }

  editarUsuario(rut: string, usuario: Usuario): Observable<any> {
    return this.http.put(`${this.apiUrl}/${rut}`, usuario);
  }

  desactivarUsuario(rut: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${rut}/desactivar`, {});
  }
  getUsuariosInactivos(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/inactivos`);
  }

  reactivarUsuario(rut: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${rut}/activar`, {});
  }
}
