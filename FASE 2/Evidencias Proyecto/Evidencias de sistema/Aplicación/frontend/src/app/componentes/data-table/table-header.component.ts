import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Column } from 'src/types/components.types';

// Importar utilidades para la tabla
import {
  getSortClass,
  isColumnSorted,
  getSortIcon,
  getAriaSortValue,
} from 'src/app/utils/table-utils';

@Component({
  selector: 'app-table-header',
  template: `
    <thead>
      <tr role="row">
        <th
          *ngFor="let column of columns"
          [ngStyle]="{ width: column.width || 'auto' }"
          [ngClass]="{
            sortable: column.sortable,
            'sorted-asc': getSortClass(column) === 'asc',
            'sorted-desc': getSortClass(column) === 'desc'
          }"
          (click)="onSortColumn(column)"
          role="columnheader"
          [attr.aria-sort]="getAriaSortValue(column)"
        >
          {{ column.header }}
          <span *ngIf="column.sortable" class="sort-icon">
            <ion-icon
              [name]="getSortIcon(column)"
              [ngClass]="{ 'sort-active': isColumnSorted(column) }"
            >
            </ion-icon>
          </span>
        </th>
      </tr>
    </thead>
  `,
  styleUrls: ['./data-table.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class TableHeaderComponent {
  @Input() columns: Column[] = [];
  @Input() sortColumn: string = '';
  @Input() sortDirection: 'asc' | 'desc' = 'asc';

  @Output() sortChange = new EventEmitter<{
    column: string;
    direction: 'asc' | 'desc';
  }>();

  /**
   * Maneja el ordenamiento por columna.
   */
  onSortColumn(column: Column): void {
    if (!column.sortable) return;

    this.sortChange.emit({
      column: column.field,
      direction:
        this.sortColumn === column.field && this.sortDirection === 'asc'
          ? 'desc'
          : 'asc',
    });
  }

  /**
   * Obtiene la clase CSS para el ordenamiento usando utils.
   */
  getSortClass(column: Column): string | null {
    return getSortClass(column, this.sortColumn, this.sortDirection);
  }

  /**
   * Obtiene el ícono de ordenamiento apropiado usando utils.
   */
  getSortIcon(column: Column): string {
    return getSortIcon(column, this.sortColumn, this.sortDirection);
  }

  /**
   * Obtiene el valor aria-sort para accesibilidad usando utils.
   */
  getAriaSortValue(column: Column): string {
    return getAriaSortValue(column, this.sortColumn, this.sortDirection);
  }

  /**
   * Verifica si la columna está siendo ordenada usando utils.
   */
  isColumnSorted(column: Column): boolean {
    return isColumnSorted(column, this.sortColumn);
  }
}
