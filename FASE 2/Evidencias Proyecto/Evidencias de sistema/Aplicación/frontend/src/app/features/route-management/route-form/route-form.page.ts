import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LoadingController, ToastController } from '@ionic/angular/standalone';
import { Observable } from 'rxjs';
import { addIcons } from 'ionicons';
import { save, navigateCircleOutline, locationOutline, closeOutline } from 'ionicons/icons';

import { CrudBaseComponent } from '../../../core/base/crud-base.component';
import { ApiService } from '../../../core/services/api.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { ModalHeaderComponent } from '../../../shared/components/modal-components/modal-header/modal-header.component';
import { ModalFooterComponent } from '../../../shared/components/modal-components/modal-footer/modal-footer.component';

@Component({
  selector: 'app-route-form',
  templateUrl: './route-form.page.html',
  styleUrls: ['./route-form.page.scss'],
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
export class RouteFormPage extends CrudBaseComponent {
  private apiService = inject(ApiService);
  
  // Map and route properties expected by template
  origenCoords: [number, number] | null = null;
  destinoCoords: [number, number] | null = null;
  calculatedPoints: any[] = [];
  calculatedDistance: number | null = null;
  isCalculatingRoute = false;
  routeCalculationError: string | null = null;
  isSubmitted = false;

  constructor(
    loadingCtrl: LoadingController,
    toastCtrl: ToastController
  ) {
    super(loadingCtrl, toastCtrl);
    addIcons({ save, navigateCircleOutline, locationOutline, closeOutline });
  }

  get title(): string {
    return 'Ruta';
  }

  get routeForm(): FormGroup {
    return this.form;
  }
  
  createForm(): FormGroup {
    const item = (this.item || {}) as any;
    return this.formManager.createRouteForm(item);
  }
  saveRoute(): void {
    this.onSubmit();
  }

  clearMapSelection(): void {
    this.origenCoords = null;
    this.destinoCoords = null;
    this.calculatedPoints = [];
    this.calculatedDistance = null;
    this.routeCalculationError = null;
  }

  saveItem(data: any): Observable<any> {
    return this.apiService.createRoute(data);
  }

  updateItem(id: any, data: any): Observable<any> {
    return this.apiService.updateRoute(id, data);
  }

  override getItem(id: any): Observable<any> {
    return this.apiService.getRoute(id);
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
