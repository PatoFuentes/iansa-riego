import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Region } from '../models/region.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RegionesService {
  private apiUrl = `${environment.apiUrl}/regiones`;

  constructor(private http: HttpClient) {}

  getRegiones(): Observable<any> {
    console.log(
      '[RegionesService] Solicitando listado de regiones hacia',
      this.apiUrl
    );
    return this.http.get<any>(this.apiUrl).pipe(
      tap({
        next: (response) =>
          console.log('[RegionesService] Respuesta de getRegiones', response),
        error: (error) =>
          console.error('[RegionesService] Error en getRegiones', error),
      })
    );
  }

  getRegion(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    console.log('[RegionesService] Solicitando detalle de región', url);
    return this.http.get<any>(url).pipe(
      tap({
        next: (response) =>
          console.log('[RegionesService] Respuesta de getRegion', response),
        error: (error) =>
          console.error('[RegionesService] Error en getRegion', error),
      })
    );
  }

  addRegion(nombre: string): Observable<any> {
    console.log('[RegionesService] Enviando nueva región', nombre);
    return this.http.post<any>(this.apiUrl, { nombre }).pipe(
      tap({
        next: (response) =>
          console.log('[RegionesService] Región creada con éxito', response),
        error: (error) =>
          console.error('[RegionesService] Error en addRegion', error),
      })
    );
  }

  desactivarRegion(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}/desactivar`;
    console.log('[RegionesService] Desactivando región', url);
    return this.http.put<any>(url, {}).pipe(
      tap({
        next: (response) =>
          console.log('[RegionesService] Región desactivada', response),
        error: (error) =>
          console.error('[RegionesService] Error en desactivarRegion', error),
      })
    );
  }

  getRegionesInactivas(): Observable<Region[]> {
    const url = `${this.apiUrl}/inactivas`;
    console.log('[RegionesService] Solicitando regiones inactivas', url);
    return this.http.get<Region[]>(url).pipe(
      tap({
        next: (response) =>
          console.log('[RegionesService] Respuesta de inactivas', response),
        error: (error) =>
          console.error('[RegionesService] Error en getRegionesInactivas', error),
      })
    );
  }

  activarRegion(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}/activar`;
    console.log('[RegionesService] Activando región', url);
    return this.http.put(url, {}).pipe(
      tap({
        next: (response) =>
          console.log('[RegionesService] Región activada', response),
        error: (error) =>
          console.error('[RegionesService] Error en activarRegion', error),
      })
    );
  }
}
