import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConsumoAgua } from '../models/consumo-agua.model';
import { environment } from '../../../environments/enviroment';

@Injectable({ providedIn: 'root' })
export class AguaService {
  private apiUrl = `${environment.apiUrl}/zonas`;

  constructor(private http: HttpClient) {}

  // Obtener todos los consumos por zona
  getConsumoAguaPorZona(zonaId: number): Observable<ConsumoAgua[]> {
    return this.http.get<ConsumoAgua[]>(
      `${this.apiUrl}/${zonaId}/consumo-agua`
    );
  }

  // Obtener un consumo por ID
  getConsumoAgua(id: number): Observable<ConsumoAgua> {
    return this.http.get<ConsumoAgua>(`${this.apiUrl}/consumo-agua/${id}`);
  }

  // Guardar nuevo consumo de agua
  guardarConsumoAgua(zonaId: number, datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${zonaId}/consumo-agua`, datos);
  }

  // Editar consumo de agua existente
  editarConsumoAgua(id: number, datos: any, zonaId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${zonaId}/consumo-agua/${id}`, datos);
  }

  // Eliminar consumo de agua
  eliminarConsumoAgua(id: number, zonaId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${zonaId}/consumo-agua/${id}`);
  }
}
