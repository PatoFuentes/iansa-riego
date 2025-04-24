import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Temporada } from '../models/temporada.model';
import { environment } from '../../../environments/enviroment';

@Injectable({
  providedIn: 'root',
})
export class TemporadasService {
  private apiUrl = `${environment.apiUrl}/temporadas`;

  constructor(private http: HttpClient) {}

  crearTemporada(temporada: Temporada): Observable<any> {
    return this.http.post(this.apiUrl, temporada);
  }

  getTemporadas(): Observable<Temporada[]> {
    return this.http.get<Temporada[]>(`${this.apiUrl}`);
  }

  desactivarEstado(id: number, estado: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/desactivar`, { estado });
  }

  activarEstado(id: number, estado: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/activar`, { estado });
  }

  getTemporadasActivas(): Observable<Temporada[]> {
    return this.http.get<Temporada[]>(`${this.apiUrl}/activas`);
  }
}
