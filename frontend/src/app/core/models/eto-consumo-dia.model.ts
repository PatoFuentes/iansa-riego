export interface EtoConsumoDia {
  id_eto_dia?: number;
  id_zona: number;
  id_temporada: number;
  fecha: string;
  eto: number;
  kc: number;
  consumo_goteo: number;
  consumo_pivote: number;
  consumo_cobertura: number;
  consumo_carrete: number;
  consumo_aspersor?: number;
}
