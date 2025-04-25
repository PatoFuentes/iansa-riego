import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService, ToastrModule } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';
import { RegionesService } from '../../../core/services/regiones.service';
import { Region } from '../../../core/models/region.model';

declare var bootstrap: any;

@Component({
  selector: 'app-region-index',
  imports: [CommonModule, RouterModule, FormsModule, ToastrModule],
  templateUrl: './region-index.component.html',
  styleUrls: ['./region-index.component.scss'],
})
export class RegionIndexComponent implements OnInit {
  regiones: Region[] = [];
  nuevaRegion: string = '';
  filtroNombreRegion: string = '';
  regionesInactivas: Region[] = [];

  constructor(
    private regionesService: RegionesService,
    private router: Router,
    private toastr: ToastrService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.obtenerRegiones();
    this.cargarRegionesInactivas();
  }

  obtenerRegiones(): void {
    this.regionesService.getRegiones().subscribe((data) => {
      this.regiones = data;
    });
  }

  verRegion(id: number): void {
    this.router.navigate(['/regiones', id]);
  }

  agregarRegion(): void {
    if (this.nuevaRegion.trim() !== '') {
      this.regionesService.addRegion(this.nuevaRegion).subscribe({
        next: () => {
          this.toastr.success('Región agregada correctamente ✅');
          this.nuevaRegion = '';
          this.obtenerRegiones();

          const modal = document.getElementById('nuevaRegionModal');
          if (modal) {
            const bsModal =
              bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
            bsModal.hide();
          }
        },
        error: () => {
          this.toastr.error('Hubo un error al agregar la región ❌');
        },
      });
    }
  }

  cargarRegionesInactivas(): void {
    this.regionesService.getRegionesInactivas().subscribe({
      next: (data) => {
        this.regionesInactivas = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.error('Error al cargar regiones inactivas:', err);
      },
    });
  }

  regionesInactivasFiltradas(): Region[] {
    const filtro = this.filtroNombreRegion.toLowerCase();
    return this.regionesInactivas.filter((r: Region) =>
      r.nombre.toLowerCase().includes(filtro)
    );
  }

  activarRegion(id: number): void {
    this.regionesService.activarRegion(id).subscribe(() => {
      this.toastr.success('Región activada correctamente ✅');
      this.obtenerRegiones();
      this.cargarRegionesInactivas();
    });
  }

  get esAdmin(): boolean {
    const usuario = this.authService.getUsuario();
    return usuario?.tipo === 'administrador';
  }

  obtenerImagenFondo(region: any): string {
    switch (region.nombre.toLowerCase()) {
      case 'maule':
        return '/assets/img/maule.png';
      case 'biobío':
        return '/assets/img/biobio.png';
      case 'ñuble':
        return '/assets/img/nuble.png';
      default:
        return '/assets/img/default-region.jpg';
    }
  }
}
