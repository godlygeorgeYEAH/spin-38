import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, } from '@ionic/angular/standalone';

@Component({
  selector: 'app-game-tutorial',
  templateUrl: './game-tutorial.component.html',
  styleUrls: ['./game-tutorial.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonIcon,

  ]
})
export class GameTutorialComponent {
  @Input() isOpen: boolean = false;
  @Output() closeModal = new EventEmitter<void>();

  constructor() {}

  onClose(): void {
    this.closeModal.emit();
  }

  get tutorialSteps() {
    return [
      {
        step: 1,
        title: 'Selecciona tus Animales',
        description: 'Haz clic en los segmentos de la ruleta para elegir los animales del zodiaco chino por los que quieres apostar. Puedes seleccionar múltiples animales.',
        icon: 'help-circle',
        color: '#d4af37'
      },
      {
        step: 2,
        title: 'Realiza tus Apuestas',
        description: 'Usa las fichas de la sección "FICHAS" para apostar dinero en cada animal seleccionado. Cada ficha tiene un valor diferente ($1, $5, $10, etc.).',
        icon: 'cash',
        color: '#2ecc71'
      },
      {
        step: 3,
        title: 'Gira la Ruleta',
        description: 'Una vez que hayas seleccionado al menos un animal y apostado por él, el botón central "GIRAR" se activará. Haz clic para iniciar el giro de la ruleta.',
        icon: 'play',
        color: '#3498db'
      }
    ];
  }

  get gameRules() {
    return [
      'Cada animal del zodiaco chino tiene las mismas probabilidades de ganar (1/12)',
      'Los multiplicadores van desde x1 hasta x10, dependiendo del segmento donde caiga la ruleta',
      'Puedes apostar por múltiples animales en una misma ronda',
      'Después de cada giro, el juego se resetea automáticamente para una nueva ronda'
    ];
  }
}