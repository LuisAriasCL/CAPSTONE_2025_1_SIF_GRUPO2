import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-table-export',
  template: `
    <div class="table-actions">
      <div *ngIf="showImport" class="import-buttons"></div>
      <div *ngIf="showExport" class="export-buttons">
        <button (click)="onExport('excel')" class="export-btn">
          <ion-icon name="grid-outline"></ion-icon> Exportar Excel
        </button>
        <button (click)="onExport('pdf')" class="export-btn">
          <ion-icon name="document-outline"></ion-icon> Exportar PDF
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./data-table.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class TableExportComponent {
  @Input() showExport = false;
  @Input() showImport = false;
  @Input() exportFormats: string[] = ['excel', 'pdf'];
  @Input() importFormats: string[] = ['excel'];

  @Output() exportAction = new EventEmitter<string>();
  @Output() importAction = new EventEmitter<string>();

  /**
   * Maneja la exportación en el formato solicitado.
   * @param format 'excel' | 'pdf' | ...
   */
  onExport(format: string): void {
    this.exportAction.emit(format);
  }

  /**
   * Maneja la importación en el formato solicitado.
   * @param format 'excel' | 'pdf' | ...
   */
  onImport(format: string): void {
    this.importAction.emit(format);
  }
}
