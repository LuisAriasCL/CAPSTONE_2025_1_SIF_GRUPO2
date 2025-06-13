import { Component, OnInit, OnDestroy } from '@angular/core'; // Añadir OnDestroy
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonMenuToggle,
  IonButtons,
  IonBackButton,
  IonLabel,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { menuOutline } from 'ionicons/icons';
import { DropdownUsuarioComponent } from '../dropdown-usuario/dropdown-usuario.component';
import { AuthService } from '../../services/auth.service'; // Asumiendo que tienes AuthService
import { TitleService } from '../../services/title.service'; // Importar el nuevo servicio
import { Subscription } from 'rxjs'; // Importar Subscription para manejar las suscripciones
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    IonLabel,
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonMenuToggle,
    DropdownUsuarioComponent,
  ],
})
export class HeaderComponent implements OnInit, OnDestroy {
  public currentPageTitle: string = 'Sistema Integral de Flota';
  public currentUserName: string = 'Juan Lopez'; // Valor por defecto inicial
  public notificationCount: number = 0;

  private titleSubscription!: Subscription;
  private userSubscription!: Subscription;
  private notificationSubscription!: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private titleService: TitleService
  ) {
    addIcons({
      menuOutline,
    });
  }

  ngOnInit(): void {
    this.titleSubscription = this.titleService.pageTitle$.subscribe(
      (title) => (this.currentPageTitle = title)
    );

    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      // Ahora simplemente usamos la propiedad nombreCompleto que ya viene procesada del servicio
      if (user && user.nombreCompleto) {
        this.currentUserName = user.nombreCompleto;
      } else if (user && user.priNomUsu) {
        // Fallback por si nombreCompleto no estuviera por alguna razón, pero priNomUsu sí
        this.currentUserName = user.priNomUsu;
      } else {
        this.currentUserName = 'Juan Lopez'; // Valor por defecto si no hay usuario o nombre
      }
    });
  }

  ngOnDestroy(): void {
    // Buena práctica desuscribirse para evitar memory leaks
    this.titleSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
    this.notificationSubscription?.unsubscribe();
  }
}
