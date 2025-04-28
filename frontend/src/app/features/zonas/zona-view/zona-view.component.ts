import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ZonasService } from '../../../core/services/zonas.service';
import { Zona } from '../../../core/models/zona.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConsumoAgua } from '../../../core/models/consumo-agua.model';
import { AguaService } from '../../../core/services/consumo-agua.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService, ToastrModule } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ClimaZona } from '../../../core/models/clima.model';
import { environment } from '../../../../environments/environment';
import { TemporadasService } from '../../../core/services/temporadas.service';
import { Temporada } from '../../../core/models/temporada.model';
import Swal from 'sweetalert2';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, Chart, registerables } from 'chart.js';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import annotationPlugin from 'chartjs-plugin-annotation';

declare var bootstrap: any;

@Component({
  selector: 'app-zona-view',
  imports: [
    CommonModule,
    RouterModule,
    ToastrModule,
    FormsModule,
    NgChartsModule,
  ],
  templateUrl: './zona-view.component.html',
  styleUrls: ['./zona-view.component.scss'],
})
export class ZonaViewComponent implements OnInit {
  zona: Zona = {
    id: 0,
    nombre: '',
    estacion: '',
    coordenadas: '',
    estado: '',
  };
  consumoAgua: ConsumoAgua[] = [];
  valorKc: number = 1.0;
  generando = false;
  mostrarConsumo: boolean = false;
  formularioManual: {
    semana_inicio: string;
    semana_fin: string;
    eto: number | null;
    precipitacion: number | null;
    kc: number | null;
    id_temporada: number | null;
  } = {
    semana_inicio: '',
    semana_fin: '',
    eto: null,
    precipitacion: null,
    kc: null,
    id_temporada: null,
  };
  climaSemanalPreview: any[] = [];
  mostrarModalClima = false;
  climaZona: ClimaZona[] = [];
  mostrarClima: boolean = false;
  cargandoClima: boolean = false;
  recomendacionPreview: any = null;
  mostrarModalRecomendacion = false;
  recomendacionFechasEto: Record<string, number> = {};
  mostrarEtoDetalle = false;
  consumoSeleccionado: ConsumoAgua | null = null;
  temporadas: Temporada[] = [];
  temporadaSeleccionadaId: number | null = null;
  chartData: ChartData<'line'> = {
    labels: [],
    datasets: [],
  };
  mostrarGrafico: boolean = false;
  mostrarModalClimaManual = false;
  climaManual: {
    fecha: string;
    temp_min: number;
    temp_max: number;
    temp_promedio: number;
    precipitacion: number;
  }[] = [
    { fecha: '', temp_min: 0, temp_max: 0, temp_promedio: 0, precipitacion: 0 },
  ];

  constructor(
    private route: ActivatedRoute,
    private zonasService: ZonasService,
    private authService: AuthService,
    private toastr: ToastrService,
    private http: HttpClient,
    private aguaService: AguaService,
    private temporadasService: TemporadasService
  ) {}

  ngOnInit(): void {
    Chart.register(...registerables);
    Chart.register(annotationPlugin);
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.zonasService.getZona(id).subscribe({
        next: (data) => {
          this.zona = data;
          this.obtenerConsumoAgua();
          this.obtenerClima();
          this.temporadasService.getTemporadasActivas().subscribe({
            next: (data) => (this.temporadas = data),
            error: () => this.toastr.error('Error al cargar temporadas'),
          });
        },
        error: (err) => console.error('Error al cargar zona:', err),
      });
    }
  }

  get esAdmin(): boolean {
    const usuario = this.authService.getUsuario();
    return usuario?.tipo === 'administrador';
  }

  obtenerConsumoAgua(): void {
    if (!this.zona?.id) return;

    this.aguaService.getConsumoAguaPorZona(this.zona.id).subscribe({
      next: (data) => {
        this.consumoAgua = data.sort(
          (a, b) =>
            new Date(a.semana_inicio).getTime() -
            new Date(b.semana_inicio).getTime()
        );
      },
      error: (err) => {
        console.error('Error al obtener consumo de agua:', err);
      },
    });
  }

  generarRecomendacion(): void {
    this.generando = true;

    if (!this.valorKc || this.valorKc <= 0) {
      this.toastr.warning('Ingrese un valor de kc válido');
      this.generando = false;
      return;
    }

    this.http
      .get<any>(
        `${environment.apiUrl}/api/eto?estacion_id=${this.zona.estacion_id}&estacion_api=${this.zona.estacion_api}`
      )
      .subscribe({
        next: (data) => {
          if (!data || !data.fechas) {
            this.toastr.warning('No se obtuvieron datos válidos');
            this.generando = false;
            return;
          }

          const fechas = Object.keys(data.fechas);
          const valores = Object.values(data.fechas);

          if (valores.length < 5) {
            this.toastr.warning(
              'Faltan muchos datos de ETo. Revise la estación manualmente.'
            );
            this.generando = false;
            return;
          }

          let missing = 0;
          let sumaEto = 0;

          for (const fecha of fechas) {
            const valor = data.fechas[fecha];
            if (valor === null || valor === undefined) {
              missing++;
            } else {
              sumaEto += valor;
            }
          }

          if (missing > 2) {
            this.toastr.warning(
              'Faltan más de 2 datos de ETo. Corrija manualmente.'
            );
            this.generando = false;
            return;
          }

          const promedio = sumaEto / (valores.length - missing);
          const etoPorFechaCompleto: Record<string, number> = {};

          for (const fecha of fechas) {
            const valor = data.fechas[fecha];
            etoPorFechaCompleto[fecha] = valor ?? promedio;
          }

          // 🔢 Cálculos
          const EToTotal = Object.values(etoPorFechaCompleto).reduce(
            (a: number, b: number) => a + b,
            0
          );
          const kc = this.valorKc;
          const ETc = EToTotal * kc;

          const calculos = this.calcularConsumo(EToTotal, kc);
          this.recomendacionPreview = {
            zona_id: this.zona.id,
            semana_inicio: data.semana_inicio,
            semana_fin: data.semana_fin,
            precipitacion: Number(data.totalPrecipitacion) || 0,
            ...calculos,
          };
          this.recomendacionFechasEto = data.fechas;

          this.mostrarModalRecomendacion = true;
          this.generando = false;
        },
        error: () => {
          this.toastr.error('❌ Error al obtener datos del clima');
          this.generando = false;
        },
      });
  }

  recalcularValoresRecomendacion(): void {
    const kc = Number(this.recomendacionPreview.kc);
    const eto = Number(this.recomendacionPreview.eto);

    const etc = kc * eto;
    this.recomendacionPreview.etc = etc.toFixed(2);
    this.recomendacionPreview.consumo_pivote = (etc / 0.85).toFixed(2);
    this.recomendacionPreview.consumo_cobertura = (etc / 0.8).toFixed(2);
    this.recomendacionPreview.consumo_carrete = (etc / 0.75).toFixed(2);
    this.recomendacionPreview.consumo_aspersor = (etc / 0.7).toFixed(2);
  }

  guardarRecomendacion(): void {
    const consumo = this.recomendacionPreview;
    if (!consumo) return;

    // 💾 Enviar al backend
    this.aguaService.guardarConsumoAgua(this.zona.id, consumo).subscribe({
      next: () => {
        this.toastr.success('✅ Recomendación generada y guardada');
        this.obtenerConsumoAgua();
        this.valorKc = 1.0;
        this.mostrarModalRecomendacion = false;

        setTimeout(() => {
          const modal = document.getElementById('modalKc');
          if (modal) bootstrap.Modal.getInstance(modal)?.hide();
        }, 300); // Pequeña pausa para confirmar éxito
      },
      error: () => {
        this.toastr.error('❌ Error al guardar la recomendación');
        this.generando = false;
      },
    });
  }

  obtenerFechasOrdenadas(): string[] {
    return Object.keys(this.recomendacionFechasEto).sort();
  }

  abrirModalManual(): void {
    const modal = document.getElementById('modalManual');
    if (modal) bootstrap.Modal.getOrCreateInstance(modal).show();
  }

  agregarManual(): void {
    const { semana_inicio, semana_fin, eto, precipitacion, kc } =
      this.formularioManual;

    if (
      [semana_inicio, semana_fin, eto, precipitacion, kc].some(
        (v) => v === null || v === undefined || v === ''
      )
    ) {
      this.toastr.warning('Complete todos los campos');
      return;
    }

    const calculos = this.calcularConsumo(eto!, kc!);
    const consumo = {
      zona_id: this.zona.id,
      semana_inicio,
      semana_fin,
      precipitacion: precipitacion!.toFixed(2),
      id_temporada: this.formularioManual.id_temporada,
      ...calculos,
    };

    this.aguaService.guardarConsumoAgua(this.zona.id, consumo).subscribe({
      next: () => {
        this.toastr.success('Consumo agregado manualmente');
        this.obtenerConsumoAgua();
        this.formularioManual = {
          semana_inicio: '',
          semana_fin: '',
          eto: null,
          precipitacion: null,
          kc: null,
          id_temporada: null,
        };
        setTimeout(() => {
          const modal = document.getElementById('modalManual');
          if (modal) bootstrap.Modal.getInstance(modal)?.hide();
        }, 300); // Pequeña pausa para confirmar éxito
      },
      error: () => this.toastr.error('Error al guardar el consumo manualmente'),
    });
  }

  cargarClimaSemanal(): void {
    this.cargandoClima = true;
    if (!this.zona.estacion_id || !this.zona.estacion_api) {
      this.toastr.warning('Faltan datos de la estación');
      return;
    }

    this.http
      .get<any>(
        `${environment.apiUrl}/api/clima-semanal?estacion_id=${this.zona.estacion_id}&estacion_api=${this.zona.estacion_api}`
      )
      .subscribe({
        next: (data) => {
          if (!data.length) {
            this.toastr.info(
              'No se encontraron datos climáticos para mostrar.'
            );
            return;
          }

          this.climaSemanalPreview = data;
          this.mostrarModalClima = true; // 🟢 Mostrar modal
          this.cargandoClima = false;
        },
        error: () => {
          this.toastr.error('❌ Error al obtener los datos climáticos');
          this.cargandoClima = false;
        },
      });
  }
  guardarClima(): void {
    if (!this.zona || !this.climaSemanalPreview.length) return;

    this.zonasService.getClimaPorZona(this.zona.id).subscribe({
      next: (climaExistente: any[]) => {
        const fechasRegistradas = climaExistente.map((c) => c.fecha);

        // 🔎 Filtrar solo las fechas nuevas
        const datosNuevos = this.climaSemanalPreview.filter(
          (dia) => !fechasRegistradas.includes(dia.fecha)
        );

        if (datosNuevos.length === 0) {
          this.toastr.info('Todos los días ya están registrados.');
          this.mostrarModalClima = false;
          return;
        }

        // 📨 Guardar cada día por separado
        const peticiones = datosNuevos.map((dia) => {
          const gradosDia = Math.max(0, dia.temp_promedio - 3);
          return this.zonasService.guardarClimaSemanal(this.zona.id, {
            id_zona: this.zona.id,
            fecha: dia.fecha,
            ta_min: dia.temp_min,
            ta_max: dia.temp_max,
            ta_prom: dia.temp_promedio,
            precipitacion: dia.precipitacion,
            grados_dia: gradosDia,
            id_temporada: this.temporadaSeleccionadaId,
          });
        });

        // Ejecutar todas las peticiones
        Promise.all(peticiones.map((p) => p.toPromise()))
          .then(() => {
            this.toastr.success('✅ Información climática guardada');
            this.obtenerClima(); // recargar tabla
            this.mostrarModalClima = false;
          })
          .catch(() => {
            this.toastr.error('❌ Error al guardar algunos registros');
            this.obtenerClima(); // recargar tabla
            this.mostrarModalClima = false;
          });
      },
      error: () => {
        this.toastr.error('❌ Error al verificar registros existentes');
      },
    });
  }

  private calcularConsumo(eto: number, kc: number) {
    const etc = eto * kc;
    return {
      eto: eto.toFixed(2),
      kc: kc.toFixed(2),
      etc: etc.toFixed(2),
      consumo_pivote: (etc / 0.85).toFixed(2),
      consumo_cobertura: (etc / 0.8).toFixed(2),
      consumo_carrete: (etc / 0.75).toFixed(2),
      consumo_aspersor: (etc / 0.7).toFixed(2),
    };
  }

  editarConsumo(consumo: ConsumoAgua): void {
    this.consumoSeleccionado = { ...consumo }; // copia para evitar mutaciones
    this.consumoSeleccionado.id_temporada = Number(
      this.consumoSeleccionado.id_temporada
    );
    const modal = document.getElementById('editarkcModal');
    if (modal) bootstrap.Modal.getOrCreateInstance(modal).show();
  }

  guardarEdicionConsumo(): void {
    if (!this.consumoSeleccionado) return;

    const { eto, kc } = this.consumoSeleccionado;
    const kcNum = Number(kc);
    const etc = eto * kcNum;

    const datosActualizados = {
      ...this.consumoSeleccionado,
      kc: kcNum.toFixed(1),
      etc: etc.toFixed(1),
      consumo_pivote: (etc / 0.85).toFixed(1),
      consumo_cobertura: (etc / 0.8).toFixed(1),
      consumo_carrete: (etc / 0.75).toFixed(1),
      consumo_aspersor: (etc / 0.7).toFixed(1),
    };

    this.aguaService
      .editarConsumoAgua(
        this.consumoSeleccionado.id!,
        datosActualizados,
        this.zona.id
      )
      .subscribe({
        next: () => {
          this.toastr.success('Consumo actualizado correctamente');
          this.obtenerConsumoAgua();
          this.consumoSeleccionado = null;
          const modal = document.getElementById('editarkcModal');
          if (modal) bootstrap.Modal.getInstance(modal)?.hide();
        },
        error: () => {
          this.toastr.error('Error al guardar cambios');
        },
      });
  }

  eliminarConsumo(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción borrara el registro.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        this.aguaService.eliminarConsumoAgua(id, this.zona.id).subscribe({
          next: () => {
            this.toastr.success('Registro eliminado correctamente');
            this.obtenerConsumoAgua();
          },
        });
      }
    });
  }

  get consumoFiltrado(): ConsumoAgua[] {
    if (!this.temporadaSeleccionadaId) return this.consumoAgua;
    return this.consumoAgua.filter(
      (c) => c.id_temporada === this.temporadaSeleccionadaId
    );
  }

  get climaFiltrado(): ClimaZona[] {
    if (!this.temporadaSeleccionadaId) return this.climaZona;
    return this.climaZona.filter(
      (c) => c.id_temporada === this.temporadaSeleccionadaId
    );
  }

  calcularGradosDia(temp_prom: number): number {
    return Math.max(0, temp_prom - 3);
  }

  public chartLabels: string[] = [];
  public ultimoGradoDia: number = 0;
  public chartOptions: any;

  obtenerClima(): void {
    if (!this.zona?.id) return;

    this.zonasService.getClimaPorZona(this.zona.id).subscribe({
      next: (data) => {
        this.climaZona = data
          .filter((item) => item.grados_dia != null)
          .sort(
            (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
          );

        const labels = this.climaZona.map((d) =>
          new Date(d.fecha).toLocaleDateString('es-CL')
        );
        const gradosDiaAcumulado: number[] = [];
        let suma = 0;

        for (const dia of this.climaZona) {
          const grados = parseFloat(dia.grados_dia?.toString() || '0');
          suma += isNaN(grados) ? 0 : grados;
          gradosDiaAcumulado.push(suma);
        }

        const ultimoValor = gradosDiaAcumulado[gradosDiaAcumulado.length - 1];
        const ultimaFecha = labels[labels.length - 1];

        // 🔧 Ahora generas dinámicamente las opciones con el valor
        this.chartOptions = {
          responsive: true,
          plugins: {
            legend: { display: true },
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  const valor = context.parsed.y;
                  return `${Math.round(valor)} grados acumulados`;
                },
              },
            },
          },
          scales: {
            y: {
              title: {
                display: true,
                text: 'GDA (°C) (T Base 3)',
                font: {
                  size: 14,
                  weight: 'bold' as const,
                },
              },
            },
            x: {
              title: {
                display: true,
                text: 'Fecha',
                font: {
                  size: 14,
                  weight: 'bold' as const,
                },
              },
            },
          },
        };

        // Finalmente actualizas los datos del gráfico
        this.chartData = {
          labels,
          datasets: [
            {
              data: gradosDiaAcumulado,
              label: 'Grados Día',
              borderColor: 'green',
              backgroundColor: 'rgba(0, 128, 0, 0.2)',
              fill: true,
              tension: 0.3,
              pointRadius: 3,
            },
            {
              data: new Array(gradosDiaAcumulado.length - 1)
                .fill(null)
                .concat(ultimoValor),
              label: `Total acumulado: ${Math.round(ultimoValor)} GDA`,
              borderColor: 'transparent',
              backgroundColor: 'red',
              pointRadius: 6,
              pointHoverRadius: 8,
              pointBackgroundColor: 'red',
              fill: false,
              type: 'line',
            },
          ],
        };
      },
      error: (err) => {
        console.error('Error al obtener información de clima:', err);
      },
    });
  }

  cargarDatosGradosDia(): void {
    this.zonasService.getClimaPorZona(this.zona.id).subscribe({
      next: (data) => {
        const datosFiltrados = data
          .filter((d) => d.grados_dia !== null)
          .sort(
            (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
          );

        this.chartData.labels = datosFiltrados.map((d) => d.fecha);
        this.chartData.datasets[0].data = datosFiltrados.map(
          (d) => d.grados_dia ?? 0
        );
        this.chartLabels = datosFiltrados.map((d) =>
          new Date(d.fecha).toLocaleDateString('es-CL')
        );
      },
    });
  }

  actualizarGraficoGradosDia(): void {
    const datos = this.climaFiltrado
      .filter((d) => d.grados_dia != null)
      .sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );

    const labels = datos.map((d) =>
      new Date(d.fecha).toLocaleDateString('es-CL')
    );
    const gradosDiaAcumulado: number[] = [];
    let suma = 0;
    for (const dia of datos) {
      const grados = parseFloat(dia.grados_dia?.toString() || '0');
      suma += isNaN(grados) ? 0 : grados;
      gradosDiaAcumulado.push(suma);
    }

    this.chartData = {
      labels,
      datasets: [
        {
          data: gradosDiaAcumulado,
          label: 'Grados Día Acumulados',
          borderColor: 'green',
          backgroundColor: 'rgba(0, 128, 0, 0.2)',
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }
  exportarConsumoAgua(): void {
    const datos = this.consumoFiltrado.map((d) => ({
      'Semana Inicio': d.semana_inicio,
      'Semana Fin': d.semana_fin,
      'ETo (mm)': d.eto,
      'Precipitación (mm)': d.precipitacion,
      Kc: d.kc,
      'ETc (mm)': d.etc,
      'Pivote (mm)': d.consumo_pivote,
      'Cobertura (mm)': d.consumo_cobertura,
      'Carrete (mm)': d.consumo_carrete,
      'Aspersión (mm)': d.consumo_aspersor,
    }));

    // Verificar si hay datos
    if (datos.length === 0) {
      this.toastr.warning(
        'No hay datos para exportar en la temporada seleccionada.',
        'Exportación cancelada'
      );
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = {
      Sheets: { 'Consumo Agua': worksheet },
      SheetNames: ['Consumo Agua'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const data: Blob = new Blob([excelBuffer], {
      type: 'application/octet-stream',
    });

    const temporadaNombre =
      this.temporadas.find((t) => t.id === this.temporadaSeleccionadaId)
        ?.nombre || 'todas';
    FileSaver.saveAs(
      data,
      `consumo_agua_${this.zona.nombre}_${temporadaNombre}.xlsx`
    );
  }

  exportarClima(): void {
    const datos = this.climaFiltrado.map((d) => ({
      Fecha: d.fecha,
      'Temperatura Mínima (°C)': d.ta_min,
      'Temperatura Máxima (°C)': d.ta_max,
      'Temperatura Promedio (°C)': d.ta_prom,
      'Precipitación (mm)': d.precipitacion,
      'Grados Día': d.grados_dia,
    }));

    // Verificar si hay datos
    if (datos.length === 0) {
      this.toastr.warning(
        'No hay datos para exportar en la temporada seleccionada.',
        'Exportación cancelada'
      );
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = { Sheets: { Clima: worksheet }, SheetNames: ['Clima'] };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const data: Blob = new Blob([excelBuffer], {
      type: 'application/octet-stream',
    });

    const temporadaNombre =
      this.temporadas.find((t) => t.id === this.temporadaSeleccionadaId)
        ?.nombre || 'todas';
    FileSaver.saveAs(
      data,
      `clima_zona_${this.zona.nombre}_${temporadaNombre}.xlsx`
    );
  }

  agregarFilaClima(): void {
    this.climaManual.push({
      fecha: '',
      temp_min: 0,
      temp_max: 0,
      temp_promedio: 0,
      precipitacion: 0,
    });
  }

  guardarClimaManual(): void {
    const datosAGuardar = this.climaManual.map((dia) => ({
      id_zona: this.zona.id,
      fecha: dia.fecha,
      ta_min: dia.temp_min,
      ta_max: dia.temp_max,
      ta_prom: dia.temp_promedio,
      precipitacion: dia.precipitacion,
      grados_dia: this.calcularGradosDia(dia.temp_promedio),
      id_temporada: this.temporadaSeleccionadaId,
    }));

    const peticiones = datosAGuardar.map((d) =>
      this.zonasService.guardarClimaSemanal(this.zona.id, d).toPromise()
    );

    Promise.all(peticiones)
      .then(() => {
        this.toastr.success('✅ Clima guardado exitosamente');
        this.obtenerClima();
        this.mostrarModalClimaManual = false;
      })
      .catch(() => {
        this.toastr.error('❌ Error al guardar el clima');
      });
  }

  abrirModalClimaManual(): void {
    this.mostrarModalClimaManual = true;
  }

  @ViewChild('graficoCanvas') graficoCanvas!: ElementRef;
  descargarGrafico(): void {
    const canvas: HTMLCanvasElement = this.graficoCanvas.nativeElement;
    const imagen = canvas.toDataURL('image/png');

    const link = document.createElement('a');
    const temporadaNombre =
      this.temporadas.find((t) => t.id === this.temporadaSeleccionadaId)
        ?.nombre || 'todas';
    link.href = imagen;
    link.download = `GDA_${this.zona.nombre}_${temporadaNombre}_${new Date()
      .toISOString()
      .slice(0, 10)}.png`;
    link.click();
  }
}
