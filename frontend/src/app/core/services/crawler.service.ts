import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CrawlerService {
  private baseUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  /**
   * Ejecuta el crawler ETo desde el backend
   * @param estacion_id ID de la estación
   * @param estacion_api API a usar ("INIA", "DMC", etc.)
   */
  obtenerETo(estacion_id: string, estacion_api: string): Observable<any> {
    const params = new HttpParams()
      .set('estacion_id', estacion_id)
      .set('estacion_api', estacion_api);

    return this.http.get(`${this.baseUrl}/eto`, { params });
  }

  /**
   * Ejecuta el crawler para clima semanal desde el backend
   * @param estacion_id ID de la estación
   * @param estacion_api API a usar
   */
  obtenerClimaSemanal(
    estacion_id: string,
    estacion_api: string
  ): Observable<any> {
    const params = new HttpParams()
      .set('estacion_id', estacion_id)
      .set('estacion_api', estacion_api);

    return this.http.get(`${this.baseUrl}/clima-semanal`, { params });
  }
}
