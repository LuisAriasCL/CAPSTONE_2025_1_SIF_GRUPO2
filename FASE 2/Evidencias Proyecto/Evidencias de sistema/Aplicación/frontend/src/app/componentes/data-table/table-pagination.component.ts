import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms'; // IMPORTAR FormsModule
import { PageEvent } from 'src/types/components.types';

// Importar utilidades para la paginación
import {
  getPaginationRange,
  getPaginationStart,
  getPaginationEnd,
} from 'src/app/utils/table-utils';

@Component({
  selector: 'app-table-pagination',
  template: `
    <div *ngIf="totalPages > 0" class="pagination">
      <!-- Simplificado: si hay páginas, mostrar -->
      <div class="pagination-controls">
        <button
          [disabled]="currentPage === 1"
          (click)="onPageButtonClick(1)"
          class="page-btn"
        >
          &laquo;
        </button>
        <button
          [disabled]="currentPage === 1"
          (click)="onPageButtonClick(currentPage - 1)"
          class="page-btn"
        >
          &lsaquo;
        </button>

        <ng-container *ngFor="let p of getVisiblePages()">
          <button
            [ngClass]="{ active: currentPage === p }"
            (click)="onPageButtonClick(p)"
            class="page-btn"
          >
            {{ p }}
          </button>
        </ng-container>

        <button
          [disabled]="currentPage === totalPages"
          (click)="onPageButtonClick(currentPage + 1)"
          class="page-btn"
        >
          &rsaquo;
        </button>
        <button
          [disabled]="currentPage === totalPages"
          (click)="onPageButtonClick(totalPages)"
          class="page-btn"
        >
          &raquo;
        </button>
      </div>

      <div class="page-size-selector">
        <span>Filas por página:</span>
        <select
          [ngModel]="pageSize"
          (ngModelChange)="onPageSizeSelectChange($event)"
        >
          <option *ngFor="let size of pageSizeOptions" [value]="size">
            {{ size }}
          </option>
        </select>
      </div>

      <div class="pagination-info">
        Mostrando {{ calculatePaginationStart() }} a
        {{ calculatePaginationEnd() }} de {{ totalItems }} registros
      </div>
    </div>
  `,
  styleUrls: ['./data-table.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule, // AÑADIR FormsModule AQUÍ
  ],
})
export class TablePaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 0;
  @Input() pageSize = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];
  @Input() totalItems = 0;
  @Input() maxVisiblePages = 5;

  @Output() pageChange = new EventEmitter<PageEvent>();

  getVisiblePages(): number[] {
    return getPaginationRange(
      this.currentPage,
      this.totalPages,
      this.maxVisiblePages
    );
  }

  onPageButtonClick(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.pageChange.emit({
      pageIndex: page - 1, // 0-indexed
      pageSize: this.pageSize,
      length: this.totalItems,
    });
  }

  // Este método ahora recibirá un 'number' directamente gracias a ngModelChange
  onPageSizeSelectChange(newPageSize: number): void {
    if (newPageSize !== this.pageSize) {
      this.pageChange.emit({
        pageIndex: 0, // Reset to first page
        pageSize: newPageSize,
        length: this.totalItems,
      });
    }
  }

  calculatePaginationStart(): number {
    if (this.totalItems === 0) return 0;
    return getPaginationStart(
      this.currentPage,
      this.pageSize,
      this.totalItems > 0 // hasData
    );
  }

  calculatePaginationEnd(): number {
    if (this.totalItems === 0) return 0;
    return getPaginationEnd(
      this.currentPage,
      this.pageSize,
      this.totalItems,
      this.totalItems > 0 // hasData
    );
  }
}
