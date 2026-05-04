import { Pipe, PipeTransform } from '@angular/core';
import { Animal, AnimalBet } from '../interfaces/wheel-general.interface';

@Pipe({
  name: 'findBet',
  standalone: true
})
export class FindBetPipe implements PipeTransform {
  transform(bets: AnimalBet[], animal: Animal | null): AnimalBet | undefined {
    if (!animal || !bets) {
      return undefined;
    }
    return bets.find(bet => bet.animal.name === animal.name);
  }
}