import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-jackpot-display',
  templateUrl: './jackpot-display.component.html',
  styleUrls: ['./jackpot-display.component.css'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JackpotDisplayComponent {}
