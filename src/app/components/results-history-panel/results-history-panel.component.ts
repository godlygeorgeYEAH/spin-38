import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { RoundOrchestratorService, RoundHistoryEntry } from '../../services/round-orchestrator.service';
import { ANIMAL_MAP } from '../../data/animal-map';

export interface HistoryDisplayEntry {
  roundId: number;
  spinTime: string;
  outerImage: string;
  outerPosition: string;
  innerImage: string;
  innerPosition: string;
}

@Component({
  selector: 'app-results-history-panel',
  templateUrl: './results-history-panel.component.html',
  styleUrls: ['./results-history-panel.component.css'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultsHistoryPanelComponent implements OnInit, OnDestroy {
  public history: HistoryDisplayEntry[] = [];
  private sub = new Subscription();

  constructor(
    private orchestrator: RoundOrchestratorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.orchestrator.recentHistory$.subscribe(entries => {
        this.history = entries.slice(0, 6).map(entry => ({
          roundId: entry.roundId,
          spinTime: entry.spinTime ?? '',
          outerImage: ANIMAL_MAP[String(entry.outerPosition)]?.image ?? '',
          outerPosition: String(entry.outerPosition),
          innerImage: ANIMAL_MAP[String(entry.innerPosition)]?.image ?? '',
          innerPosition: String(entry.innerPosition),
        }));
        this.cdr.markForCheck();
      })
    );
  }

  trackById(index: number, entry: HistoryDisplayEntry): number {
    return entry.roundId;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
