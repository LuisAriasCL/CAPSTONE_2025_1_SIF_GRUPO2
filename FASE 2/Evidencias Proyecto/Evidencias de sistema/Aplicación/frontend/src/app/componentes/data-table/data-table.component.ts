import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Column, ActionButton, PageEvent } from 'src/types/components.types';
import { TableExportComponent } from './table-export.component';
import { TableHeaderComponent } from './table-header.component';
import { TablePaginationComponent } from './table-pagination.component';

// Re-exportar las interfaces para que otros componentes puedan importarlas desde aquí
export { Column, ActionButton, PageEvent } from 'src/types/components.types';

// Importar utilidades para la tabla
import {
  getPropertyValue,
  // Ya no se usarán directamente aquí si el padre maneja la paginación
  // getPaginationStart,
  // getPaginationEnd,
  // getPaginationTotal,
} from 'src/app/utils/table-utils';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TableExportComponent,
    TableHeaderComponent,
    TablePaginationComponent,
  ],
})
export class DataTableComponent implements OnInit, OnChanges {
  // 1. Inputs y Outputs
  @Input() columns: Column[] = [];
  @Input() data: any[] = []; // Recibirá los datos ya paginados del padre
  @Input() pageSize = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];
  @Input() showPagination = true;
  @Input() showExport = false;
  @Input() tableClass = 'display';
  @Input() tableId = 'dataTable';
  @Input() totalItems = 1; // Total de ítems del backend, pasado por el padre
  @Input() actionButtons: ActionButton[] = [];
  @Input() showImport = false;
  @Input() idField = 'id';

  // Nuevos Inputs para que el padre controle el estado de paginación y ordenamiento
  @Input() currentPage = 1; // Página actual, manejada por el padre
  @Input() sortColumn: string = ''; // Columna de ordenamiento actual, manejada por el padre
  @Input() sortDirection: 'asc' | 'desc' = 'asc'; // Dirección de ordenamiento, manejada por el padre

  @Output() page = new EventEmitter<PageEvent>(); // Evento para cambio de página o tamaño
  @Output() sort = new EventEmitter<{
    column: string;
    direction: 'asc' | 'desc';
  }>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() export = new EventEmitter<string>();
  @Output() import = new EventEmitter<string>();

  // 2. Propiedades internas
  readonly NULL_DATA = 'Datos no disponibles';
  readonly MAX_VISIBLE_PAGES = 5; // Para el componente de paginación

  // displayData ya no es necesaria si 'data' es la página actual
  // displayData: any[] = [];
  totalPages = 0; // Se calculará basado en totalItems y pageSize
  Math = Math;

  constructor() {}

  ngOnInit(): void {
    this.calculateTotalPages();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['totalItems'] || changes['pageSize']) {
      this.calculateTotalPages();
    }
    // 'data' ya viene paginada, no se necesita 'updateDisplayData' complejo
    // if (changes['data']) {
    //   this.displayData = this.data;
    // }
  }

  private calculateTotalPages(): void {
    if (this.totalItems > 0 && this.pageSize > 0) {
      this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    } else {
      this.totalPages = 0;
    }
  }

  // --- MÉTODOS PÚBLICOS PARA COMPONENTES HIJOS Y TEMPLATE ---

  onRowClickMethod(row: any): void {
    this.rowClick.emit(row);
  }

  getPropertyValue(obj: any, path: string): any {
    return getPropertyValue(obj, path);
  }

  renderCell(column: Column, row: any): string {
    if (column.isAction) {
      return '';
    }
    if (column.cell) {
      return column.cell(row);
    }
    const value = getPropertyValue(row, column.field); // Usar la utilidad directamente
    if (value === null || value === undefined) {
      return '';
    }
    return value.toString();
  }

  getCellClass(column: Column, row: any): string {
    if (column.field === 'estadoVehi' && row.estadoVehi) {
      // Específico para Vehiculo
      return 'status-' + row.estadoVehi.toLowerCase().replace(/\s+/g, '-');
    }
    // Puedes añadir más lógica de clases aquí si es necesario
    return '';
  }

  hasData(): boolean {
    return Array.isArray(this.data) && this.data.length > 0;
  }

  // Los métodos getPaginationStart, getPaginationEnd, getPaginationTotal
  // ahora se manejarán principalmente dentro de table-pagination.component.ts
  // usando los inputs que este componente (DataTableComponent) le pasa.

  // getTotalRecords ya no es necesario aquí si el padre pasa totalItems
  // getTotalRecords(): number {
  //   return this.totalItems;
  // }

  // --- MANEJADORES DE EVENTOS DE COMPONENTES HIJO ---
  // Estos métodos ahora solo emiten el evento al padre

  onExportClick(format: string) {
    // Renombrado para evitar conflicto con @Output
    this.export.emit(format);
  }

  onImportClick(format: string) {
    // Renombrado para evitar conflicto con @Output
    this.import.emit(format);
  }

  onSortChange(event: { column: string; direction: 'asc' | 'desc' }) {
    // El estado de sortColumn y sortDirection es manejado por el padre.
    // Este componente solo emite el evento.
    this.sort.emit(event);
  }

  onPageChange(pageEvent: PageEvent) {
    console.log('DataTableComponent onPageChange:', pageEvent); // Log para depuración

    // Actualizar currentPage internamente en DataTableComponent.
    // Esto asegura que TablePaginationComponent (hijo) reciba el valor
    // más reciente inmediatamente para su UI y lógica de botones,
    // antes de que el ciclo completo de actualización del padre se complete.

    // Emitir el evento al componente padre (VehicleListPage)
    // para que maneje la lógica principal de carga de datos.
    this.page.emit(pageEvent);
  }

  // onPageSizeChange ya está cubierto por onPageChange si PageEvent incluye pageSize
}
