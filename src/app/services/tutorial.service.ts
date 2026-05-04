import { Injectable } from '@angular/core';

export type TutorialStage = 'welcome' | 'wheel' | 'betting' | 'spin' | 'manual-spin' | 'completed';

@Injectable({
  providedIn: 'root'
})
export class TutorialService {
  private readonly STORAGE_KEY = 'ruleta-zodiaco-tutorial-completed';
  private readonly TUTORIAL_ANIMAL_KEY = 'ruleta-zodiaco-tutorial-animal';

  /**
   * Verifica si el usuario ya completó el tutorial
   */
  public hasCompletedTutorial(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) === 'true';
  }

  /**
   * Marca el tutorial como completado
   */
  public markTutorialCompleted(): void {
    localStorage.setItem(this.STORAGE_KEY, 'true');
  }

  /**
   * Resetea el tutorial (para testing)
   */
  public resetTutorial(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TUTORIAL_ANIMAL_KEY);
  }

  /**
   * Obtiene el animal del tutorial (o asigna uno aleatorio si no existe)
   */
  public getTutorialAnimal(): string {
    let animal = localStorage.getItem(this.TUTORIAL_ANIMAL_KEY);

    if (!animal) {
      const animals = [
        'rata', 'buey', 'tigre', 'conejo',
        'dragon', 'serpiente', 'caballo', 'cabra',
        'mono', 'gallo', 'perro', 'cerdo'
      ];
      animal = animals[Math.floor(Math.random() * animals.length)];
      localStorage.setItem(this.TUTORIAL_ANIMAL_KEY, animal);
    }

    return animal;
  }
}
