import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular'; // Importar AlertController
import { ApiService, Usuario } from '../../../core/services/api.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { UsuarioFormComponent } from 'src/app/shared/components/usuario-form/usuario-form.component';
import { ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from 'src/app/shared/components/page-header/page-header.component';
@Component({
  selector: 'app-gestion-usuarios',
  templateUrl: './gestion-usuarios.page.html',
  styleUrls: ['./gestion-usuarios.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, HeaderComponent, UsuarioFormComponent, FormsModule, PageHeaderComponent]
})
export class GestionUsuariosPage implements OnInit {

  public usuarios: Usuario[] = [];
  public resultadosFiltrados: Usuario[] = []; 
  public cargando = true;
  public error = false;
   public skeletonItems = Array(5);
  public rolesParaFiltrar = ['conductor', 'tecnico', 'gestor', 'admin'];
  public selectedRole: string = 'todos'; 

  // Función de comparación para ion-select
  compareWith = (o1: any, o2: any) => {
    return o1 === o2;
  };

  constructor(
    private apiService: ApiService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
    ,  private modalCtrl: ModalController 
  ) { }

  ngOnInit() { }

  ionViewWillEnter() {
    this.cargarUsuarios(this.selectedRole);
  }
filterByRole(event: any) {
    const rolSeleccionado = event.detail.value;
    this.cargarUsuarios(rolSeleccionado);
  }
    cargarUsuarios(rol: string = 'todos') {
    this.cargando = true;
    this.error = false;
    this.resultadosFiltrados = []; 

   
    const rolToFetch = rol === 'todos' ? undefined : rol;

    this.apiService.getAllUsers(rolToFetch).subscribe({
      next: (data) => {
        this.usuarios = data;
        this.resultadosFiltrados = [...data];
        this.cargando = false;
      },
      error: (err) => {
        console.error(`Error al cargar usuarios para el rol: ${rol}`, err);
        this.cargando = false;
        this.error = true;
        this.mostrarToast('Error al cargar la lista de usuarios.', 'danger');
      }
    });
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


async onCreate() {
  const modal = await this.modalCtrl.create({
    component: UsuarioFormComponent,
    
    componentProps: {
      usuario: null 
    }
  });

  await modal.present();

  const { data, role } = await modal.onWillDismiss();

  if (role === 'confirm') {
   
    this.apiService.createUser(data).subscribe({
      next: (nuevoUsuario) => {
        this.mostrarToast('Usuario creado con éxito', 'success');
     
        this.usuarios.unshift(nuevoUsuario);
        this.resultadosFiltrados = [...this.usuarios];
      },
      error: (err) => {
        this.mostrarToast(err.message || 'Error al crear el usuario', 'danger');
      }
    });
  }
}

 async onEdit(usuario: Usuario) {
  const modal = await this.modalCtrl.create({
    component: UsuarioFormComponent,
    componentProps: {
      usuario: { ...usuario } 
    }
  });
  
  await modal.present();

 
  const { data, role } = await modal.onWillDismiss();

  if (role === 'confirm') {
    
    this.apiService.updateUser(usuario.id_usu, data).subscribe({
      next: (response) => {
        this.mostrarToast('Usuario actualizado con éxito', 'success');
        this.cargarUsuarios();
      },
      error: (err) => {
        this.mostrarToast(err.message || 'Error al actualizar el usuario', 'danger');
      }
    });
  }
}

  async onDelete(usuario: Usuario) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Borrado',
      message: `¿Estás seguro de que quieres eliminar a ${usuario.pri_nom_usu} ${usuario.pri_ape_usu}? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'confirm',
          cssClass: 'ion-color-danger',
          handler: () => {
        
            this.apiService.deleteUser(usuario.id_usu).subscribe({
              next: (response) => {
                this.mostrarToast(response.message, 'success');
            
                this.usuarios = this.usuarios.filter(u => u.id_usu !== usuario.id_usu);
                this.resultadosFiltrados = this.resultadosFiltrados.filter(u => u.id_usu !== usuario.id_usu);
              },
              error: (err) => {
                console.error('Error al eliminar usuario:', err);
                this.mostrarToast(err.message || 'Error al eliminar el usuario.', 'danger');
              }
            });
          },
        },
      ],
    });
    await alert.present();
  }
  

  getIconForRole(rol: string): string {
    switch (rol) {
      case 'admin': return 'shield-checkmark';
      case 'gestor': return 'briefcase';
      case 'conductor': return 'car-sport';
      case 'mantenimiento': return 'build';
      case 'tecnico': return 'construct';
      default: return 'person';
    }
  }

  getColorForRole(rol: string): string {
    switch (rol) {
      case 'admin': return 'danger';
      case 'gestor': return 'primary';
      case 'conductor': return 'secondary';
      case 'mantenimiento': return 'tertiary';
      case 'tecnico': return 'warning';
      default: return 'medium';
    }
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      color: color
    });
    toast.present();
  }
}