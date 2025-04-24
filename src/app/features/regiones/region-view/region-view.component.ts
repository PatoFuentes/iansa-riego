import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RegionesService } from '../../../core/services/regiones.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { ZonasService } from '../../../core/services/zonas.service';
import { Zona } from '../../../core/models/zona.model';
import { FormsModule } from '@angular/forms';

declare var bootstrap: any;

@Component({
  selector: 'app-region-view',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './region-view.component.html',
  styleUrls: ['./region-view.component.scss'],
})
export class RegionViewComponent implements OnInit {
  region: any = {};
  zonas: Zona[] = [];
  nuevaZona: Zona = {
    id: 0,
    nombre: '',
    estacion: '',
    coordenadas: '',
    estacion_id: '',
    estacion_api: '',
    region_id: 0, // se actualiza luego con regionId
  };
  regionId!: number;
  zonasInactivas: Zona[] = [];
  filtroNombreZona: string = '';
  zonaSeleccionada: Zona = {
    id: 0,
    nombre: '',
    estacion: '',
    coordenadas: '',
    estacion_id: '',
    estacion_api: '',
    region_id: 0, // se actualiza luego con regionId
  };

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private regionesService: RegionesService,
    private toastr: ToastrService,
    private authService: AuthService,
    private zonasService: ZonasService
  ) {}

  ngOnInit(): void {
    this.regionId = Number(this.route.snapshot.paramMap.get('id')); // ← Guarda en this.regionId
    if (this.regionId) {
      this.regionesService.getRegion(this.regionId).subscribe((data) => {
        this.region = data;
      });

      this.obtenerZonas(this.regionId);
      if (this.esAdmin) {
        this.cargarZonasInactivas();
      }
    }
  }

  desactivarRegion(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción desactivará la region.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        this.regionesService.desactivarRegion(this.region.id).subscribe(() => {
          this.toastr.info('Region desactivada correctamente ✅');
          this.router.navigate(['/regiones']); // o recargar region actual
        });
      }
    });
  }

  get esAdmin(): boolean {
    const usuario = this.authService.getUsuario();
    return usuario?.tipo === 'administrador';
  }

  obtenerZonas(id: number): void {
    this.zonasService.obtenerZonasPorRegion(id).subscribe({
      next: (data) => {
        this.zonas = data;
      },
      error: (err) => {
        console.error('Error al obtener zonas:', err);
      },
    });
  }

  crearZona(): void {
    if (
      this.nuevaZona &&
      this.nuevaZona.nombre.trim() &&
      this.nuevaZona.estacion?.trim() &&
      this.nuevaZona.coordenadas?.trim() &&
      this.nuevaZona.estacion_id?.trim() &&
      this.nuevaZona.estacion_api?.trim()
    ) {
      this.nuevaZona.region_id = this.regionId;

      this.zonasService.crearZona(this.nuevaZona).subscribe({
        next: () => {
          this.toastr.success('Zona creada correctamente ✅');
          this.obtenerZonas(this.regionId);
          this.nuevaZona = {
            id: 0,
            nombre: '',
            estacion: '',
            coordenadas: '',
            estacion_id: '',
            estacion_api: '',
            region_id: this.regionId,
          };

          const modal = document.getElementById('nuevaZonaModal');
          if (modal) bootstrap.Modal.getInstance(modal)?.hide();
        },
        error: (error) => {
          console.error('Error al crear zona:', error);
          this.toastr.error('No se pudo crear la zona ❌');
        },
      });
    } else {
      this.toastr.warning('Todos los campos son obligatorios');
    }
  }

  desactivarZona(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción desactivará la zona.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        this.zonasService.desactivarZona(id).subscribe(() => {
          this.toastr.info('Zona desactivada correctamente ✅');
          this.obtenerZonas(this.regionId);
          this.cargarZonasInactivas();
        });
      }
    });
  }

  cargarZonasInactivas(): void {
    this.zonasService.getZonasInactivasPorRegion(this.regionId).subscribe({
      next: (data) => {
        this.zonasInactivas = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.error('Error al cargar zonas inactivas:', err);
      },
    });
  }

  zonasInactivasFiltradas(): Zona[] {
    const filtro = this.filtroNombreZona.toLowerCase();
    return this.zonasInactivas.filter((z) =>
      z.nombre.toLowerCase().includes(filtro)
    );
  }

  activarZona(id: number): void {
    this.zonasService.activarZona(id).subscribe(() => {
      this.toastr.success('Zona activada correctamente ✅');
      this.obtenerZonas(this.regionId);
      this.cargarZonasInactivas();
    });
  }

  abrirModalEditar(zona: Zona): void {
    this.zonaSeleccionada = { ...zona }; // Copia segura
    const modal = document.getElementById('editarZonaModal');
    if (modal) {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    }
  }

  guardarCambiosZona(): void {
    if (!this.zonaSeleccionada || !this.zonaSeleccionada.id) {
      this.toastr.error('Zona no válida para editar ❌');
      return;
    }
    this.zonasService
      .editarZona(this.zonaSeleccionada.id, this.zonaSeleccionada)
      .subscribe({
        next: () => {
          this.toastr.success('Zona actualizado correctamente ✅');
          this.obtenerZonas(this.regionId);
          const modal = document.getElementById('editarZonaModal');
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
            this.toastr.warning('Zona no encontrado ❌');
          } else {
            this.toastr.error('Hubo un error al guardar los cambios ❌');
          }
        },
      });
  }

  verZona(id: number): void {
    this.router.navigate(['/zonas', id]);
  }
}
