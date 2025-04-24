export interface ConsumoAgua {
  id?: number;
  zona_id: number;
  semana_inicio: string; // ISO string 'YYYY-MM-DD'
  semana_fin: string;
  eto: number;
  precipitacion: number;
  kc: number;
  etc: number;
  consumo_pivote: number;
  consumo_cobertura: number;
  consumo_carrete: number;
  consumo_aspersor: number;
  fecha_generacion: string;
  id_temporada?: number;
}
