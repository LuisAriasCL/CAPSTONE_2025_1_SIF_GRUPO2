import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline, logInOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  isSubmitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {
    // Registrar íconos personalizados
    addIcons({
      mailOutline,
      lockClosedOutline,
      logInOutline, // Ícono para el botón "Entrar"
    });
  }

  ngOnInit() {
    // Inicializar el formulario de login
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      clave: ['', [Validators.required]], // Cambiado de 'password' a 'clave'
    });
  }

  // --- Getters opcionales ---
  get email() {
    return this.loginForm.get('email');
  }
  get clave() {
    return this.loginForm.get('clave');
  }
  // --- Fin Getters ---

  // --- Método llamado al enviar el formulario ---
  async login() {
    this.isSubmitted = true; // Marcar para mostrar errores si es necesario

    if (this.loginForm.invalid) {
      console.log('Formulario de login inválido');
      return; // No continuar si hay errores de validación
    }

    const loading = await this.loadingController.create({
      message: 'Iniciando sesión...',
    });
    await loading.present();

    // Llamar al método login del AuthService con los valores del formulario
    this.authService.login(this.loginForm.value).subscribe({
      next: async (response) => {
        // --- Éxito en el Login ---
        await loading.dismiss();
        console.log('Login exitoso!', response);
        this.router.navigateByUrl('/', { replaceUrl: true });
      },
      error: async (error) => {
        // --- Error en el Login ---
        await loading.dismiss();
        console.error('Error en el login:', error);
        const alert = await this.alertController.create({
          header: 'Error de Inicio de Sesión',
          message: error.message || 'Ocurrió un error desconocido.',
          buttons: ['OK'],
        });
        await alert.present();
      },
    });
  }
}