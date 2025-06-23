import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ApiService, Usuario } from '../../services/api.service';
import { HeaderComponent } from 'src/app/componentes/header/header.component';
import { UsuarioFormComponent } from 'src/app/componentes/usuario-form/usuario-form.component';
import { addIcons } from 'ionicons';
import { 
  createOutline, trashOutline, add, refreshOutline, happyOutline, 
  shieldCheckmarkOutline, briefcaseOutline, carSportOutline, buildOutline, constructOutline, personOutline, peopleCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-gestion-usuarios',
  templateUrl: './gestion-usuarios.page.html',
  styleUrls: ['./gestion-usuarios.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, HeaderComponent, FormsModule]
})
export class GestionUsuariosPage implements OnInit {

  public usuarios: Usuario[] = [];
  public resultadosFiltrados: Usuario[] = []; 
  public cargando = true;
  public error = false;
  public skeletonItems = Array(5);
  public rolesParaFiltrar = ['conductor', 'tecnico', 'gestor', 'admin', 'mantenimiento'];
  public selectedRole: string = 'todos'; 
  public selectedStatus: 'activo' | 'inactivo' = 'activo';

  constructor(
    private apiService: ApiService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController 
  ) {
    addIcons({ 
      createOutline, trashOutline, add, refreshOutline, happyOutline, shieldCheckmarkOutline, 
      briefcaseOutline, carSportOutline, buildOutline, constructOutline, personOutline, peopleCircleOutline
    });
  }

  ngOnInit() { }

  ionViewWillEnter() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.cargando = true;
    this.error = false;
    
    const rolToFetch = this.selectedRole === 'todos' ? undefined : this.selectedRole;

    this.apiService.getAllUsers(rolToFetch, this.selectedStatus).subscribe({
      next: (data) => {
        this.usuarios = data;
        this.resultadosFiltrados = [...data];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.cargando = false;
        this.error = true;
        this.mostrarToast('Error al cargar la lista de usuarios.', 'danger');
      }
    });
  }

  filterByStatus(event: any) {
    this.selectedStatus = event.detail.value;
    this.cargarUsuarios();
  }

  filterByRole(event: any) {
    this.selectedRole = event.detail.value;
    this.cargarUsuarios();
  }

  handleSearch(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    if (!searchTerm) {
      this.resultadosFiltrados = [...this.usuarios];
      return;
    }
    this.resultadosFiltrados = this.usuarios.filter(usuario => {
      const nombreCompleto = `${usuario.pri_nom_usu} ${usuario.pri_ape_usu}`.toLowerCase();
      const email = usuario.email.toLowerCase();
      return nombreCompleto.includes(searchTerm) || email.includes(searchTerm);
    });
  }

  async openUserForm(usuario: Usuario | null) {
    const modal = await this.modalCtrl.create({
      component: UsuarioFormComponent,
      componentProps: { usuario: usuario ? { ...usuario } : null }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm') {
      if (usuario) { // Modo Edición
        this.apiService.updateUser(usuario.id_usu, data).subscribe({
          next: () => {
            this.mostrarToast('Usuario actualizado con éxito', 'success');
            this.cargarUsuarios();
          },
          error: (err) => this.mostrarToast(err.error?.message || 'Error al actualizar', 'danger')
        });
      } else { // Modo Creación
        this.apiService.createUser(data).subscribe({
          next: () => {
            this.mostrarToast('Usuario creado con éxito', 'success');
            this.selectedRole = data.rol; // Opcional: filtra por el rol recién creado
            this.cargarUsuarios();
          },
          error: (err) => this.mostrarToast(err.error?.message || 'Error al crear', 'danger')
        });
      }
    }
  }

  async onDeactivate(usuario: Usuario) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Desactivación',
      message: `¿Estás seguro de que quieres desactivar a ${usuario.pri_nom_usu} ${usuario.pri_ape_usu}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desactivar',
          role: 'confirm',
          cssClass: 'ion-color-danger',
          handler: () => {
            this.apiService.deleteUser(usuario.id_usu).subscribe({
              next: (res) => { this.mostrarToast(res.message, 'success'); this.cargarUsuarios(); },
              error: (err) => this.mostrarToast(err.error?.message || 'Error al desactivar', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async onReactivate(usuario: Usuario) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Reactivación',
      message: `¿Estás seguro de que quieres reactivar a ${usuario.pri_nom_usu} ${usuario.pri_ape_usu}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Reactivar',
          role: 'confirm',
          handler: () => {
            this.apiService.reactivateUser(usuario.id_usu).subscribe({
              next: (res) => { this.mostrarToast(res.message, 'success'); this.cargarUsuarios(); },
              error: (err) => this.mostrarToast(err.error?.message || 'Error al reactivar', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  getIconForRole(rol: string): string {
    const iconMap: { [key: string]: string } = {
      admin: 'shield-checkmark-outline',
      gestor: 'briefcase-outline',
      conductor: 'car-sport-outline',
      mantenimiento: 'build-outline',
      tecnico: 'construct-outline'
    };
    return iconMap[rol] || 'person-outline';
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      position: 'top',
      color: color
    });
    toast.present();
  }
}