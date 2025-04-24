import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Region } from '../models/region.model';
import { environment } from '../../../environments/enviroment';

@Injectable({
  providedIn: 'root',
})
export class RegionesService {
  private apiUrl = `${environment.apiUrl}/regiones`;

  constructor(private http: HttpClient) {}

  getRegiones(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  getRegion(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  addRegion(nombre: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { nombre });
  }

  desactivarRegion(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/desactivar`, {});
  }

  getRegionesInactivas(): Observable<Region[]> {
    return this.http.get<Region[]>(`${this.apiUrl}/inactivas`);
  }

  activarRegion(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/activar`, {});
  }
}
