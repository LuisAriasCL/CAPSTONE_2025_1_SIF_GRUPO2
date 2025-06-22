import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LoadingController, ToastController } from '@ionic/angular/standalone';
import { Observable } from 'rxjs';
import { addIcons } from 'ionicons';
import { saveOutline, alertCircleOutline, carOutline, closeOutline } from 'ionicons/icons';

import { CrudBaseComponent } from '../../base/crud-base.component';
import { ApiService } from '../../services/api.service';
import { FormFieldComponent } from '../../componentes/form-field/form-field.component';
import { ModalHeaderComponent } from '../../componentes/modal-components/modal-header/modal-header.component';
import { ModalFooterComponent } from '../../componentes/modal-components/modal-footer/modal-footer.component';

@Component({
  selector: 'app-siniestro-form',
  templateUrl: './siniestro-form.page.html',
  styleUrls: ['./siniestro-form.page.scss'],
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
export class SiniestroFormPage extends CrudBaseComponent {
  private apiService = inject(ApiService);

  constructor(
    loadingCtrl: LoadingController,
    toastCtrl: ToastController
  ) {
    super(loadingCtrl, toastCtrl);
    addIcons({ saveOutline, alertCircleOutline, carOutline, closeOutline });
  }

  get title(): string {
    return 'Siniestro';
  }  createForm(): FormGroup {
    const item = (this.item || {}) as any;
    // @ts-ignore - Temporary fix for unknown type issue
    return this.formManager.createSiniestroForm(item);
  }

  saveItem(data: any): Observable<any> {
    return this.apiService.createSiniestro(data);
  }

  updateItem(id: any, data: any): Observable<any> {
    return this.apiService.updateSiniestro(id, data);
  }

  override getItem(id: any): Observable<any> {
    return this.apiService.getSiniestroById(id);
  }
}
