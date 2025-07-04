import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-recuperar',
  templateUrl: './recuperar.page.html',
  styleUrls: ['./recuperar.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
})
export class RecuperarPage implements OnInit {
  recuperarForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private toastController: ToastController,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.recuperarForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  async onSubmit() {
    const email = this.recuperarForm.value.email;

    if (!email) {
      const toast = await this.toastController.create({
        message: 'Por favor, ingresa un correo electrónico.',
        duration: 3000,
        position: 'top',
        color: 'danger',
      });
      await toast.present();
      return;
    }

    try {
      await this.http.post('/api/auth/recover-password', { email }).toPromise();

      const toast = await this.toastController.create({
        message: 'Se ha enviado un enlace de recuperación a tu correo.',
        duration: 3000,
        position: 'top',
        color: 'success',
      });
      await toast.present();

      this.router.navigate(['/login']);
    } catch (error: any) { // Usa `any` para evitar problemas de tipo
      const errorMessage = error.status === 404
        ? 'El correo no está registrado.'
        : 'Error al enviar el correo. Intenta nuevamente.';

      const toast = await this.toastController.create({
        message: errorMessage,
        duration: 3000,
        position: 'top',
        color: 'danger',
      });
      await toast.present();
    }
  }
}