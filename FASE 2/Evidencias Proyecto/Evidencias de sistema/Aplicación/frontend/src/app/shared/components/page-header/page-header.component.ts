import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() showButton: boolean = true;
  @Input() buttonText: string = 'Agregar';
  @Input() buttonIcon: string = 'add-circle-outline';
  @Input() buttonColor: string = '';
  @Input() buttonFill: 'clear' | 'outline' | 'solid' = 'solid';
  @Input() customButtonClass: string = 'add-button';
  
  @Output() buttonClick = new EventEmitter<void>();

  onButtonClick() {
    this.buttonClick.emit();
  }
}