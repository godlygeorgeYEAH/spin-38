import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { BetEntry, BetHistory } from '../../interfaces/bet-history.interface';

@Component({
  selector: 'app-bet-history',
  templateUrl: './bet-history.component.html',
  styleUrls: ['./bet-history.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    IonButton,
    IonIcon
  ]
})
export class BetHistoryComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() historyData: BetHistory[] = [];
  @Output() closeModal = new EventEmitter<void>();

  /**
   * Historial ordenado por fecha descendente (más reciente primero).
   * Se recalcula solo cuando cambia `historyData` (no en cada ciclo de
   * detección), evitando copia + sort innecesarios y manteniendo la
   * referencia estable para el *ngFor.
   */
  sortedHistory: BetHistory[] = [];

  ngOnChanges(): void {
    this.sortedHistory = [...this.historyData].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  onClose(): void {
    this.closeModal.emit();
  }

  /**
   * Formatea la fecha para mostrar en el historial
   */
  formatDate(timestamp: Date): string {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByEntry(_index: number, entry: BetHistory): number {
    return entry.id;
  }

  trackByBet(index: number, _bet: BetEntry): number {
    return index;
  }
}
