import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LoadingController, ToastController, ModalController } from '@ionic/angular/standalone';
import { Observable } from 'rxjs';
import { addIcons } from 'ionicons';
import { saveOutline, closeCircleOutline, calendarOutline, speedometerOutline } from 'ionicons/icons';

import { CrudBaseComponent } from 'src/app/core';
import { AssignmentService } from 'src/app/core';
import { FormFieldComponent } from 'src/app/shared';
import { ModalHeaderComponent } from 'src/app/shared';
import { ModalFooterComponent } from 'src/app/shared';

@Component({
  selector: 'app-asignacion-form',
  templateUrl: './asignacion-form.page.html',
  styleUrls: ['./asignacion-form.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    ReactiveFormsModule,
    FormFieldComponent,
    ModalHeaderComponent,
    ModalFooterComponent
  ]
})
export class AsignacionFormPage extends CrudBaseComponent {
  private assignmentService = inject(AssignmentService);
  
  // Additional properties required by the template
  public conductores: any[] = [];
  public rutasPlantilla: any[] = [];
  public vehiculos: any[] = [];
  public isSubmitting = false;
  public constants = {
    ESTADO_OPTIONS: [
      { value: 'Activo', label: 'Activo' },
      { value: 'Inactivo', label: 'Inactivo' }
    ]
  };
  public currentDate = new Date().toISOString().split('T')[0];

  constructor(
    loadingCtrl: LoadingController,
    toastCtrl: ToastController
  ) {
    super(loadingCtrl, toastCtrl);
    addIcons({ saveOutline, closeCircleOutline, calendarOutline, speedometerOutline });
  }

  get title(): string {
    return 'Asignación de Recorrido';
  }
  
  createForm(): FormGroup {
    const item = (this.item || {}) as any;
    return this.formManager.createAssignmentForm(item, this.isViewMode);
  }

  saveItem(data: any): Observable<any> {
    return this.assignmentService.createAssignment(data);
  }

  updateItem(id: any, data: any): Observable<any> {
    return this.assignmentService.updateAssignment(id, data);
  }
  
  override getItem(id: any): Observable<any> {
    return this.assignmentService.getAssignmentById(id);
  }

  // Method required by template
  onVehiculoChange(event: any): void {
    // Handle vehicle change logic if needed
    console.log('Vehicle changed:', event);
  }

  // Additional getter for form controls access
  get f() {
    return this.form?.controls || {};
  }

  // Method to close modal if opened in modal context
  async closeModal(): Promise<void> {
    if (this.modalCtrl) {
      await this.modalCtrl.dismiss();
    }
  }
}
