import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Zona } from '../models/zona.model';
import { ClimaZona } from '../models/clima.model';
import { EtoConsumoDia } from '../models/eto-consumo-dia.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ZonasService {
  private apiUrl = `${environment.apiUrl}/zonas`;

  constructor(private http: HttpClient) {}

  crearZona(zona: Zona): Observable<any> {
    return this.http.post(this.apiUrl, zona);
  }

  obtenerZonasPorRegion(region_id: number): Observable<Zona[]> {
    return this.http.get<Zona[]>(`${this.apiUrl}/region/${region_id}`);
  }

  desactivarZona(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/desactivar`, {});
  }

  getZonasInactivasPorRegion(region_id: number): Observable<Zona[]> {
    return this.http.get<Zona[]>(`${this.apiUrl}/inactivas/${region_id}`);
  }

  activarZona(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/activar`, {});
  }
  editarZona(id: number, zona: Zona): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, zona);
  }

  getZona(id: number): Observable<Zona> {
    return this.http.get<Zona>(`${this.apiUrl}/${id}`);
  }

  getClimaPorZona(zonaId: number): Observable<ClimaZona[]> {
    return this.http.get<ClimaZona[]>(`${this.apiUrl}/${zonaId}/clima-semanal`);
  }

  guardarClimaSemanal(zonaId: number, datos: ClimaZona): Observable<any> {
    return this.http.post(`${this.apiUrl}/${zonaId}/clima-semanal`, datos);
  }

  getEtoConsumoDia(zonaId: number): Observable<EtoConsumoDia[]> {
    return this.http.get<EtoConsumoDia[]>(
      `${this.apiUrl}/${zonaId}/eto-consumo-dia`
    );
  }
}
