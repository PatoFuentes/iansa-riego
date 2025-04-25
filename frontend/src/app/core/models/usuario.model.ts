export interface Usuario {
  rut: string;
  nombre: string;
  telefono: string;
  correo: string;
  tipo: 'administrador' | 'tecnico';
  estado: 'activo' | 'inactivo';
  contrasenia: string;
}
