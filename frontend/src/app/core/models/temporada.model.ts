export interface Temporada {
  id?: number;
  nombre: string; // Ej: '2024-2025'
  fecha_inicio: string; // formato ISO: '2024-08-01'
  fecha_fin: string; // formato ISO: '2025-07-31'
  estado: string;
}
