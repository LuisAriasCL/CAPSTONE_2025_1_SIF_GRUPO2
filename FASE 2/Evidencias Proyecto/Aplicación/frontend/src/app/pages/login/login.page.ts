import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, LoadingController, AlertController, NavController } from '@ionic/angular';

// Importar nuestro servicio de autenticación
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
    RouterLink 
  ]
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
    
  ) { }

  ngOnInit() {
    // Inicializar el formulario de login
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]], // Requerido y formato email
      password: ['', [Validators.required]] // Requerido
    });
  }

  // --- Getters opcionales ---
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
  // --- Fin Getters ---


  // --- Método llamado al enviar el formulario ---
  async login() {
    this.isSubmitted = true; // Marcar para mostrar errores si es necesario

    if (this.loginForm.invalid) {
      console.log('Formulario de login inválido');
      return; // No continuar si hay errores de validación
    }

    const loading = await this.loadingController.create({ message: 'Iniciando sesión...' });
    await loading.present();

    // Llamar al método login del AuthService con los valores del formulario
    this.authService.login(this.loginForm.value).subscribe({
      next: async (response) => {
        // --- Éxito en el Login ---
        await loading.dismiss();
        console.log('Login exitoso!', response);
        console.log('Usuario logueado:', this.authService.getCurrentUser()); // Verificar que se guardó
        // Navegar a la página principal (ej. /home) después del login exitoso
        // replaceUrl: true para que el usuario no pueda "volver atrás" a la pantalla de login
        // Dentro del .subscribe -> next:
 // Navegar a la raíz protegida (que redirigirá a dashboard)
 this.router.navigateByUrl('/', { replaceUrl: true });
 // O directamente a dashboard:
 // this.router.navigateByUrl('/dashboard', { replaceUrl: true });
      },
      error: async (error) => {
        // --- Error en el Login ---
        await loading.dismiss();
        console.error('Error en el login:', error);
        // Mostrar alerta con el mensaje de error formateado por AuthService
        const alert = await this.alertController.create({
          header: 'Error de Inicio de Sesión',
          message: error.message || 'Ocurrió un error desconocido.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

}