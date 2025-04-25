import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Usuario } from '../../../core/models/usuario.model';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { FormsModule } from '@angular/forms';
import { ValidadorService } from '../../../core/services/validador.service';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-usuario-index',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './usuario-index.component.html',
  styleUrls: ['./usuario-index.component.scss'],
})
export class UsuarioIndexComponent implements OnInit {
  usuarios: Usuario[] = [];
  nuevoUsuario: Usuario = {
    rut: '',
    nombre: '',
    telefono: '+569',
    correo: '',
    tipo: 'tecnico', // valor por defecto
    estado: 'activo', // se asignará automáticamente en el backend
    contrasenia: '',
  };
  usuarioSeleccionado: Usuario = {
    rut: '',
    nombre: '',
    correo: '',
    telefono: '',
    tipo: 'tecnico',
    estado: 'activo',
    contrasenia: '',
  };
  usuariosInactivos: Usuario[] = [];
  filtroNombreUsuario: string = '';

  errorRut = false;
  errorContrasenia = false;
  errorTelefono = false;
  errorCorreo = false;
  resetErrores(): void {
    this.errorRut = false;
    this.errorContrasenia = false;
    this.errorTelefono = false;
    this.errorCorreo = false;
  }

  constructor(
    private usuariosService: UsuariosService,
    private toastr: ToastrService,
    private validador: ValidadorService
  ) {}

  ngOnInit(): void {
    this.obtenerUsuarios();
    this.cargarUsuariosInactivos();
  }

  obtenerUsuarios(): void {
    this.usuariosService.getUsuarios().subscribe((data) => {
      this.usuarios = data;
    });
  }

  desactivarUsuario(rut: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción desactivará al usuario.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuariosService.desactivarUsuario(rut).subscribe(() => {
          this.toastr.info('Usuario desactivado correctamente ✅');
          this.obtenerUsuarios();
          this.cargarUsuariosInactivos();
        });
      }
    });
  }

  agregarUsuario(): void {
    this.resetErrores();
    const u = this.nuevoUsuario;

    // Validaciones
    if (!this.validador.validarRut(u.rut)) {
      this.errorRut = true;
      this.toastr.warning('RUT inválido ❌');
      return;
    }

    if (!this.validador.validarContrasenia(u.contrasenia)) {
      this.errorContrasenia = true;
      this.toastr.warning('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!this.validador.validarTelefono(u.telefono)) {
      this.errorTelefono = true;
      this.toastr.warning('El teléfono debe tener formato +569XXXXXXXX');
      return;
    }

    if (!this.validador.validarCorreo(u.correo)) {
      this.errorCorreo = true;
      this.toastr.warning('Correo inválido ❌');
      return;
    }

    // Envío al backend
    this.usuariosService.addUsuario(u).subscribe({
      next: () => {
        this.toastr.success('Usuario agregado correctamente ✅');
        this.nuevoUsuario = {
          rut: '',
          nombre: '',
          telefono: '+569',
          correo: '',
          tipo: 'tecnico',
          estado: 'activo',
          contrasenia: '',
        };
        this.obtenerUsuarios();

        // Cerrar modal
        const modal = document.getElementById('nuevoUsuarioModal');
        if (modal) {
          const bsModal =
            bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
          bsModal.hide();
        }
      },
      error: (error) => {
        if (error.status === 409 && error.error?.error) {
          this.toastr.warning(error.error.error); // Mensaje detallado del backend
        } else {
          this.toastr.error('Hubo un error al agregar el usuario ❌');
        }
      },
    });
  }

  abrirModalEditar(usuario: Usuario): void {
    this.usuarioSeleccionado = { ...usuario }; // Copia segura
    const modal = document.getElementById('editarUsuarioModal');
    if (modal) {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    }
  }

  guardarCambiosUsuario(): void {
    this.resetErrores();
    const u = this.usuarioSeleccionado;

    if (!this.validador.validarRut(u.rut)) {
      this.errorRut = true;
      this.toastr.warning('RUT inválido ❌');
      return;
    }

    if (!this.validador.validarContrasenia(u.contrasenia)) {
      this.errorContrasenia = true;
      this.toastr.warning('Contraseña demasiado corta');
      return;
    }

    if (!this.validador.validarTelefono(u.telefono)) {
      this.errorTelefono = true;
      this.toastr.warning('Formato de teléfono incorrecto');
      return;
    }

    if (!this.validador.validarCorreo(u.correo)) {
      this.errorCorreo = true;
      this.toastr.warning('Correo inválido');
      return;
    }

    const rut = u.rut;

    this.usuariosService.editarUsuario(rut, u).subscribe({
      next: () => {
        this.toastr.success('Usuario actualizado correctamente ✅');
        this.obtenerUsuarios();
        const modal = document.getElementById('editarUsuarioModal');
        if (modal) {
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal.hide();
        }
      },
      error: (error) => {
        if (error.status === 409 && error.error?.error) {
          // Mensaje específico desde el backend
          this.toastr.warning(error.error.error);
        } else if (error.status === 404) {
          this.toastr.warning('Usuario no encontrado ❌');
        } else {
          this.toastr.error('Hubo un error al guardar los cambios ❌');
        }
      },
    });
  }

  cargarUsuariosInactivos(): void {
    this.usuariosService.getUsuariosInactivos().subscribe({
      next: (data) => {
        this.usuariosInactivos = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.error('Error al cargar usuarios inactivos:', err);
      },
    });
  }

  usuariosInactivosFiltrados(): Usuario[] {
    const filtro = this.filtroNombreUsuario.toLowerCase();
    return this.usuariosInactivos.filter((u) =>
      u.nombre.toLowerCase().includes(filtro)
    );
  }

  reactivarUsuario(rut: string): void {
    this.usuariosService.reactivarUsuario(rut).subscribe(() => {
      this.toastr.success('Usuario reactivado correctamente ✅');
      this.obtenerUsuarios();
      this.cargarUsuariosInactivos();
    });
  }

  usuariosFiltrados() {
    if (!this.filtroNombreUsuario) return this.usuarios;
    const filtro = this.filtroNombreUsuario.toLowerCase();
    return this.usuarios.filter((u) => u.nombre.toLowerCase().includes(filtro));
  }
}
