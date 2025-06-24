import { Component, OnInit, inject } from '@angular/core';
import {
  CommonModule,
  DatePipe,
  TitleCasePipe,
  SlicePipe,
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ApiService, Siniestro } from '../../services/api.service';
import { addIcons } from 'ionicons';
import {
  calendar,
  calendarOutline,
  chevronForwardOutline,
  funnelOutline,
  peopleCircleOutline,
  refresh,
  refreshOutline,
  searchOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-gestion-siniestros',
  templateUrl: './gestion-siniestros.page.html',
  styleUrls: ['./gestion-siniestros.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DatePipe, SlicePipe],
})
export class GestionSiniestrosPage implements OnInit {
  public siniestros: Siniestro[] = [];
  public siniestrosFiltrados: Siniestro[] = [];
  public cargando = true;
  public skeletonItems = Array(5);

  // Propiedades para filtros
  public searchTerm: string = '';
  public filterEstado: string = '';
  public filterVehiculo: string = '';
  public vehiculosUnicos: string[] = [];

  private apiService = inject(ApiService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  constructor() {
    // Registrar iconos personalizados
    addIcons({
      chevronForward: chevronForwardOutline,
      funnelOutline,
      refreshOutline,
      searchOutline,
      calendarOutline,
      peopleCircleOutline,
    });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.cargarSiniestros();
  }
  cargarSiniestros() {
    this.apiService.getSiniestros().subscribe({
      next: (data) => {
        console.log('[Gestión Siniestros] Datos recibidos del backend:', data);
        this.siniestros = data;
        this.siniestrosFiltrados = [...data];
        this.extraerVehiculosUnicos();
        this.cargando = false;
        console.log(
          `[Gestión Siniestros] Carga finalizada. Se recibieron ${data.length} registros.`
        );
      },
      error: (err) => {
        console.error(
          '[Gestión Siniestros] ¡ERROR! La petición al API falló:',
          err
        );
        this.cargando = false;
        this.mostrarToast('Error al cargar los incidentes.', 'danger');
      },
    });
  }

  verDetalles(id: number | undefined) {
    if (!id) {
      console.error('No se puede navegar, el ID del siniestro es indefinido.');
      return;
    }
    this.router.navigate(['/siniestro-detalle', id]);
  }
  getColorForStatus(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'warning';
      case 'reportado':
        return 'warning';
      case 'en_progreso':
        return 'primary';
      case 'en_revision':
        return 'primary';
      case 'resuelto':
        return 'success';
      case 'cancelado':
        return 'medium';
      default:
        return 'light';
    }
  }

  getStatusDisplayName(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'reportado':
        return 'Reportado';
      case 'en_progreso':
        return 'En Progreso';
      case 'en_revision':
        return 'En Revisión';
      case 'resuelto':
        return 'Resuelto';
      case 'cancelado':
        return 'Cancelado';
      default:
        return estado
          .replace('_', ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  }

  // Extraer vehículos únicos para el filtro
  extraerVehiculosUnicos() {
    const vehiculos = new Set<string>();
    this.siniestros.forEach((siniestro) => {
      if (siniestro.vehiculo?.patente) {
        vehiculos.add(siniestro.vehiculo.patente);
      }
    });
    this.vehiculosUnicos = Array.from(vehiculos).sort();
  }

  // Aplicar filtros
  applyFilters() {
    let resultados = [...this.siniestros]; // Filtro por término de búsqueda
    if (this.searchTerm.trim()) {
      const termino = this.searchTerm.toLowerCase().trim();
      resultados = resultados.filter(
        (siniestro) =>
          siniestro.descripcion?.toLowerCase().includes(termino) ||
          siniestro.conductor?.pri_nom_usu?.toLowerCase().includes(termino) ||
          siniestro.conductor?.pri_ape_usu?.toLowerCase().includes(termino) ||
          siniestro.vehiculo?.patente?.toLowerCase().includes(termino)
      );
    }

    // Filtro por estado
    if (this.filterEstado) {
      resultados = resultados.filter(
        (siniestro) => siniestro.estado === this.filterEstado
      );
    }

    // Filtro por vehículo
    if (this.filterVehiculo) {
      resultados = resultados.filter(
        (siniestro) => siniestro.vehiculo?.patente === this.filterVehiculo
      );
    }

    this.siniestrosFiltrados = resultados;
  }

  // Limpiar filtros
  clearFilters() {
    this.searchTerm = '';
    this.filterEstado = '';
    this.filterVehiculo = '';
    this.siniestrosFiltrados = [...this.siniestros];
  }

  // Manejar refresh
  handleRefresh(event: any) {
    this.cargarSiniestros();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      color: color,
    });
    toast.present();
  }
}
