import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonLabel, IonButton, IonIcon, IonRange, RangeCustomEvent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, volumeMute, volumeHigh } from 'ionicons/icons';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-game-settings',
  templateUrl: './game-settings.component.html',
  styleUrls: ['./game-settings.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonLabel,
    IonButton,
    IonIcon,
    IonRange,
  ]
})
export class GameSettingsComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() uiVolume: number = 50; // Volumen de interfaz del componente padre
  @Output() closeModal = new EventEmitter<void>();
  @Output() uiVolumeChange = new EventEmitter<number>(); // Emitir cambios de volumen UI

  public settingsForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private audioService: AudioService
  ) {
    addIcons({ closeOutline, volumeMute, volumeHigh });

    this.settingsForm = this.fb.group({
      volume: [30, [Validators.required, Validators.min(0), Validators.max(100)]],
      uiVolume: [50, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit() {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      this.initializeForm();
    }
  }

  private initializeForm() {
    // Obtener el volumen actual del servicio de audio (0-1) y convertir a porcentaje (0-100)
    const currentVolume = Math.round(this.audioService.getVolume() * 100);

    this.settingsForm.patchValue({
      volume: currentVolume,
      uiVolume: this.uiVolume
    });
    this.settingsForm.markAsPristine();
  }

  /**
   * Formateador para el pin del slider que muestra el porcentaje
   */
  public pinFormatter = (value: number): string => {
    return `${value}%`;
  }

  /**
   * Maneja el cambio de volumen en tiempo real
   */
  public onVolumeChange(event: Event): void {
    const customEvent = event as RangeCustomEvent;
    const volume = customEvent.detail.value as number;

    // Convertir el porcentaje (0-100) a volumen (0-1)
    const volumeDecimal = volume / 100;
    this.audioService.setVolume(volumeDecimal);

    // Si el volumen es 0, deshabilitar el audio, si no, habilitarlo
    this.audioService.setEnabled(volume > 0);
  }

  /**
   * Maneja el cambio de volumen de interfaz en tiempo real
   */
  public onUIVolumeChange(event: Event): void {
    const customEvent = event as RangeCustomEvent;
    const volume = customEvent.detail.value as number;

    // Emitir el nuevo volumen al componente padre
    this.uiVolumeChange.emit(volume);
  }

  public onClose() {
    this.closeModal.emit();
  }
}