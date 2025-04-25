import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TemporadasService } from '../../../core/services/temporadas.service';
import { Temporada } from '../../../core/models/temporada.model';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';

declare var bootstrap: any;

@Component({
  selector: 'app-temporada-index',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './temporada-index.component.html',
  styleUrls: ['./temporada-index.component.scss'],
})
export class TemporadaIndexComponent implements OnInit {
  temporadas: Temporada[] = [];
  nuevaTemporada: Temporada = {
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: '',
  };

  constructor(
    private temporadasService: TemporadasService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarTemporadas();
  }

  cargarTemporadas(): void {
    this.temporadasService.getTemporadas().subscribe({
      next: (data) => (this.temporadas = data),
      error: () => this.toastr.error('Error al cargar temporadas'),
    });
  }

  cambiarEstado(temporada: Temporada): void {
    const nuevoEstado = temporada.estado === 'activa' ? 'inactiva' : 'activa';

    const servicio =
      nuevoEstado === 'activa'
        ? this.temporadasService.activarEstado(temporada.id!, nuevoEstado)
        : this.temporadasService.desactivarEstado(temporada.id!, nuevoEstado);

    servicio.subscribe({
      next: () => {
        this.toastr.success(`Temporada ${nuevoEstado}`);
        this.cargarTemporadas();
      },
      error: () => this.toastr.error('Error al cambiar estado'),
    });
  }

  crearTemporada(): void {
    if (
      !this.nuevaTemporada.nombre ||
      !this.nuevaTemporada.fecha_inicio ||
      !this.nuevaTemporada.fecha_fin
    ) {
      this.toastr.warning('Completa todos los campos');
      return;
    }

    // Establecer el estado por defecto si no se asignó (opcional)
    if (!this.nuevaTemporada.estado) {
      this.nuevaTemporada.estado = 'activa';
    }

    this.temporadasService.crearTemporada(this.nuevaTemporada).subscribe({
      next: () => {
        this.toastr.success('Temporada creada correctamente');
        this.cargarTemporadas(); // Recargar lista si tienes esta función
        this.nuevaTemporada = {
          nombre: '',
          fecha_inicio: '',
          fecha_fin: '',
          estado: '',
        }; // Limpiar formulario
        const modal = document.getElementById('modalTemporada');
        if (modal) bootstrap.Modal.getInstance(modal)?.hide();
      },
      error: () => {
        this.toastr.error('Error al crear la temporada');
      },
    });
  }
}
