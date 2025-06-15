import { Component, Input, OnInit } from '@angular/core'; // 1. IMPORTAMOS Input
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonMenuToggle, IonButtons } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { menuOutline, personCircleOutline } from 'ionicons/icons';
import { DropdownUsuarioComponent } from '../dropdown-usuario/dropdown-usuario.component';
import { IconoAlertaComponent } from "../icono-alerta/icono-alerta.component";
import { AuthService, UserInfo } from 'src/app/services/auth.service'; // 2. IMPORTAMOS AuthService Y UserInfo

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [ CommonModule, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonMenuToggle, DropdownUsuarioComponent, IconoAlertaComponent ],
})
export class HeaderComponent implements OnInit {

  @Input() title: string = 'SIF';
  
  
  currentUser: UserInfo | null = null;
  notificationCount: number = 5; 


  constructor(private authService: AuthService) {
    addIcons({ menuOutline, personCircleOutline });
  }

  ngOnInit(): void {
   
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }
}
