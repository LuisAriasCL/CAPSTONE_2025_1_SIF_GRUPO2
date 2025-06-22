import { Component, OnInit, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { BaseFormComponent } from './base-form.component';
import { LoadingController, ToastController, ModalController } from '@ionic/angular';
import { FormManagerService } from '../services/form-manager.service';

@Component({
  template: ''
})
export abstract class CrudBaseComponent extends BaseFormComponent implements OnInit {
    // Servicios inyectados
  protected router = inject(Router);
  protected activatedRoute = inject(ActivatedRoute);
  protected modalCtrl = inject(ModalController);
  protected formManager = inject(FormManagerService);

  // Propiedades comunes
  form!: FormGroup;
  item: any = null;
  itemId: string | number | null = null;
  isEditMode = false;
  isViewMode = false;
  isLoading = false;
  pageTitle = '';

  constructor(
    loadingCtrl: LoadingController,
    toastCtrl: ToastController
  ) {
    super(loadingCtrl, toastCtrl);
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  private async initializeComponent(): Promise<void> {
    this.extractRouteParams();
    this.updatePageTitle();
    this.form = this.createForm();
    
    if (this.isEditMode || this.isViewMode) {
      await this.loadItem();
    }
  }

  private extractRouteParams(): void {
    this.itemId = this.activatedRoute.snapshot.paramMap.get('id');
    this.isEditMode = !!this.itemId;
    this.isViewMode = this.activatedRoute.snapshot.queryParamMap.get('mode') === 'view';
  }

  private updatePageTitle(): void {
    const entityName = this.title;
    if (this.isViewMode) {
      this.pageTitle = `Ver ${entityName}`;
    } else if (this.isEditMode) {
      this.pageTitle = `Editar ${entityName}`;
    } else {
      this.pageTitle = `Crear ${entityName}`;
    }
  }

  private async loadItem(): Promise<void> {
    if (!this.itemId) return;

    const loading = await this.showLoading('Cargando...');
    
    try {
      this.item = await this.getItem(this.itemId).toPromise();
      this.form = this.createForm(); // Recrear formulario con datos
    } catch (error) {
      console.error('Error loading item:', error);
      await this.showToast('Error al cargar los datos', 'danger');
      this.goBack();
    } finally {
      loading.dismiss();
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.isFormValid()) {
      await this.showToast('Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    const loading = await this.showLoading(
      this.isEditMode ? 'Actualizando...' : 'Guardando...'
    );

    try {
      const formData = this.form.value;
      let result;

      if (this.isEditMode) {
        result = await this.updateItem(this.itemId, formData).toPromise();
      } else {
        result = await this.saveItem(formData).toPromise();
      }

      await this.showToast(
        this.isEditMode ? 'Actualizado correctamente' : 'Guardado correctamente',
        'success'
      );

      this.goBack();
    } catch (error) {
      console.error('Error saving item:', error);
      await this.showToast('Error al guardar', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }

  cancel(): void {
    if (this.modalCtrl) {
      this.modalCtrl.dismiss();
    } else {
      this.goBack();
    }
  }

  // Métodos abstractos que deben ser implementados por cada formulario
  abstract get title(): string;
  abstract createForm(): FormGroup;
  abstract saveItem(data: any): Observable<any>;
  abstract updateItem(id: any, data: any): Observable<any>;
  // Método opcional para obtener un item (para modo edición)
  getItem(id: any): Observable<any> {
    throw new Error('getItem method must be implemented for edit mode');
  }
}
