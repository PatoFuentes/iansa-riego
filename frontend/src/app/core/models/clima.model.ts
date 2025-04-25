export interface ClimaZona {
  id?: number; // lo genera la BD
  id_zona: number;
  fecha: string;
  ta_min: number;
  ta_max: number;
  ta_prom: number;
  precipitacion: number;
  grados_dia?: number;
  id_temporada?: number | null;
}
