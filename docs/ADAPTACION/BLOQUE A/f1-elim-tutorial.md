# F1 — Eliminar sistema de tutorial completo

## Requisito
Eliminar completamente el sistema de tutorial: lógica de tutorial stage en animaciones del componente de rueda, el tutorial interactivo con overlay, el `TutorialService`, el `GameTutorialComponent`, y todas las variables CSS relacionadas.

## Estado

Implementado

### Notas de Implementación

#### `wheel-container.component.ts`
- Eliminado `@Input() tutorialStage: string = ''`.
- Eliminado comentario residual en `ngOnChanges`: "La animación de tutorial está desactivada en Safari via HTML binding".

#### `wheel-container.component.html`
- Eliminado `[class.tutorial-manual-spin-animation]="tutorialStage === 'manual-spin' && !isSafari"` del tag `<svg>`.
- Eliminado `[class.tutorial-pulse]="tutorialStage === 'spin'"` del `<img>` del yin-yang.

#### `wheel-container.component.css`
- Eliminados 4 bloques CSS huérfanos:
  - `.wheel.tutorial-manual-spin-animation` + `@keyframes tutorialManualSpin` (~62 líneas).
  - `.yin-yang-image.tutorial-pulse` + `@keyframes tutorialYinYangPulse`.
  - `.wheel-wrapper.performance-low .yin-yang-image.tutorial-pulse` + `@keyframes tutorialYinYangPulseLow`.
  - `.wheel-wrapper.performance-medium .yin-yang-image.tutorial-pulse` + `@keyframes tutorialYinYangPulseMedium`.

#### `home.page.ts`
- Eliminados imports: `GameTutorialComponent`, `TutorialService`, `TutorialStage`.
- Eliminado `GameTutorialComponent` de `imports[]`.
- Eliminada inyección `private tutorialService: TutorialService` del constructor.
- Eliminadas variables: `showTutorial`, `tutorialActive`, `tutorialStage`, `tutorialAnimal`, `tutorialAnimalImage`, `tutorialShowingRedirectMessage`.
- Eliminadas inicializaciones en `ngOnInit`: `this.showTutorial = false`, `this.initializeTutorial()`.
- Eliminadas guardas de tutorial en métodos: `onAnimalToggle`, `addCoinToCurrentAnimal`, `clearAllBets`, `clearCurrentAnimalBet`, `spinWheels`.
- Eliminados métodos: `openTutorial()`, `closeTutorial()`.
- Eliminada sección completa `// MÉTODOS DEL TUTORIAL INTERACTIVO` (~140 líneas): `initializeTutorial`, `advanceTutorialStage`, `onTutorialAnimalClick`, `onTutorialChipClick`, `completeTutorial`, `getTutorialText`, `handleTutorialOverlayClick`, `onTutorialWrongAreaClick`.

#### `home.page.html`
- Eliminado binding `[tutorialStage]="tutorialStage"` del `<app-wheel-container>`.
- Eliminado bloque `<div class="tutorial-overlay">` completo (overlay interactivo con spotlight, animal guía, burbuja de texto, click-blockers).
- Eliminado `<app-game-tutorial *ngIf="showTutorial" ...>`.
- Eliminado botón `?` del header que llamaba `openTutorial()`.

#### `home.page.css`
- Eliminada sección "TUTORIAL INTERACTIVO" completa (~690 líneas): `.tutorial-overlay`, `.tutorial-dark-overlay`, `.tutorial-spotlight`, `.manual-spin-indicator`, `.tutorial-animal`, `.tutorial-text-bubble`, y todas las variantes de performance (`performance-low`, `performance-medium`).

#### Archivos eliminados
- `src/app/services/tutorial.service.ts` — servicio con estado `hasCompletedTutorial` (localStorage), `markTutorialCompleted()`, `getTutorialAnimal()`.
- `src/app/components/game-tutorial/game-tutorial.component.ts`
- `src/app/components/game-tutorial/game-tutorial.component.html`
- `src/app/components/game-tutorial/game-tutorial.component.css`

#### Variables CSS eliminadas
- `src/theme/variables.scss`: bloque `// Tutorial variables` (7 propiedades: `--tutorial-primary`, `--tutorial-secondary`, `--tutorial-accent`, `--tutorial-text`, `--tutorial-bg-primary`, `--tutorial-bg-secondary`, `--tutorial-shadow`).
- `src/theme/responsive-variables.scss`: todas las declaraciones `--tutorial-*` y `--menu-tutorial-*` en todos los breakpoints (~997 líneas eliminadas). Incluía variables de tipografía, posicionamiento por etapa (welcome/wheel/betting/spin/manual-spin), spotlight, animal guía, burbuja de texto y padding.
- `src/app/components/game-settings/game-settings.component.css`: sustituido `var(--tutorial-primary)` por `#d4af37` (mismo valor que `--gold-primary`).

## Plan original (scope expandido durante implementación)
1. ~~Eliminar `@Input() tutorialStage`.~~
2. ~~Eliminar comentario residual en `ngOnChanges`.~~
3. ~~Eliminar bindings condicionales de `tutorialStage` en template.~~
4. ~~Eliminar CSS huérfano de animaciones tutorial en `wheel-container.component.css`.~~
5. ~~Eliminar `TutorialService` y `GameTutorialComponent` (archivos completos).~~
6. ~~Eliminar todo el tutorial interactivo de `home.page.ts`, `home.page.html`, `home.page.css`.~~
7. ~~Limpiar variables CSS en `variables.scss`, `responsive-variables.scss`, `game-settings.component.css`.~~
