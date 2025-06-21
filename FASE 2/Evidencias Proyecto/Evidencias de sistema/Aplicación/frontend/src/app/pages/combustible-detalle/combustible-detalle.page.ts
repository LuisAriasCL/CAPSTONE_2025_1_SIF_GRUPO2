// Fichero: src/app/pages/combustible-detalle/combustible-detalle.page.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { HeaderComponent } from 'src/app/componentes/header/header.component';

@Component({
  selector: 'app-combustible-detalle',
  templateUrl: './combustible-detalle.page.html',
  styleUrls: ['./combustible-detalle.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeaderComponent, DatePipe, CurrencyPipe, TitleCasePipe]
})
export class CombustibleDetallePage implements OnInit {
  registro: any = null;
  isLoading = true;
  // CAMBIO: Añadir la propiedad apiUrl, igual que en siniestro-detalle
  public readonly apiUrl = 'http://localhost:8101'; 

  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.apiService.getCombustibleById(+id).subscribe({
        next: (data) => {
          this.registro = data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
        }
      });
    }
  }
}