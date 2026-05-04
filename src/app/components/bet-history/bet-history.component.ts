import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { BetHistory } from '../../interfaces/bet-history.interface';

@Component({
  selector: 'app-bet-history',
  templateUrl: './bet-history.component.html',
  styleUrls: ['./bet-history.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonIcon
  ]
})
export class BetHistoryComponent {
  @Input() isOpen: boolean = false;
  @Input() historyData: BetHistory[] = [];
  @Output() closeModal = new EventEmitter<void>();

  constructor() {}

  onClose(): void {
    this.closeModal.emit();
  }

  /**
   * Obtiene el historial ordenado por fecha descendente (más reciente primero)
   */
  get sortedHistory(): BetHistory[] {
    return [...this.historyData].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
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

  /**
   * Obtiene las estadísticas generales del historial
   */
  get statistics() {
    if (this.historyData.length === 0) {
      return {
        totalRounds: 0,
        totalBet: 0,
        totalWon: 0,
        winRate: 0,
        netProfit: 0
      };
    }

    const totalRounds = this.historyData.length;
    const wins = this.historyData.filter(h => h.isWin).length;
    const totalBet = this.historyData.reduce((sum, h) => sum + h.totalBet, 0);
    const totalWon = this.historyData.reduce((sum, h) => sum + h.winAmount, 0);
    const winRate = (wins / totalRounds) * 100;
    const netProfit = totalWon - totalBet;

    return {
      totalRounds,
      totalBet,
      totalWon,
      winRate: Math.round(winRate),
      netProfit
    };
  }
}
