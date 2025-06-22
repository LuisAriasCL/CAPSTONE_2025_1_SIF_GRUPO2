import { Component, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { LoadingController, ToastController } from '@ionic/angular';
import { FormUtils } from '../utils/form.utils';

@Component({
  template: ''
})
export abstract class BaseFormComponent implements OnDestroy {
  protected destroy$ = new Subject<void>();
  abstract form: FormGroup;
  
  protected constructor(
    protected loadingCtrl: LoadingController,
    protected toastCtrl: ToastController
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  compareWith = FormUtils.compareWith;

  protected async showLoading(message: string = 'Cargando...') {
    const loading = await this.loadingCtrl.create({ message });
    await loading.present();
    return loading;
  }

  protected async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  protected markFormAsTouched(): void {
    FormUtils.markFormGroupTouched(this.form);
  }

  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  protected getFieldError(fieldName: string, validationMessages?: any): string | null {
    const field = this.form.get(fieldName);
    return FormUtils.getFieldErrorMessage(field, fieldName, validationMessages);
  }

  protected isFormValid(): boolean {
    if (this.form.invalid) {
      this.markFormAsTouched();
      return false;
    }
    return true;
  }
}
