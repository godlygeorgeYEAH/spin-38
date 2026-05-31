import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { RevealOverlayComponent } from './components/results-animation/reveal-overlay.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, RevealOverlayComponent],
})
export class AppComponent {
  constructor() {}
}
