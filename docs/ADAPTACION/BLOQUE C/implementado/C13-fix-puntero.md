# C13 — Fix Puntero: Rebote Visible Durante Todo el Giro

## Descripción

El puntero (imagen de ancla) no mostraba animación de rebote durante la fase rápida del giro. El efecto visual solo era perceptible en los últimos segundos, cuando la rueda ya iba lenta. Sonido y detección de cruces funcionaban correctamente en todo momento.

---

## Causa raíz

La rueda usa easing `cubic-bezier(0.23, 1, 0.32, 1)` — una curva ease-out que concentra ~80% de los cruces de segmento en el primer 30% del tiempo de animación. Durante esa fase rápida, múltiples cruces ocurren dentro de una misma ventana de 16ms, lo que provocaba que el mecanismo anterior colapsara:

**Mecanismo anterior (roto a alta velocidad):**
```
crossing t=0ms   → pointerBounce = true, setTimeout(false, 150ms)
crossing t=16ms  → pointerBounce ya es true (no-op, Angular no actualiza)
crossing t=32ms  → no-op
...
t=150ms          → pointerBounce = false
t=150ms (RAF)    → nuevo crossing → pointerBounce = true
t=166ms          → setTimeout del t=16ms → pointerBounce = false  ← clase removida antes de que la animación termine
t=167ms          → crossing → true
t=182ms          → false
```

El ciclo `true/false/true/false` ocurría dentro de la misma ventana de renderizado. Con `ChangeDetectionStrategy.OnPush`, Angular solo renderizaba el estado final de cada ciclo de detección, haciendo que la animación CSS fuera imperceptible. Al final del giro, con un cruce cada 300–500ms, cada bounce tenía tiempo de completar sus 150ms limpiamente — por eso el usuario solo lo veía ahí.

No había una condición de estado explícita que filtrara los eventos: el problema era de timing entre la frecuencia de cruces y el patrón `boolean + setTimeout`.

---

## Solución

Se reemplazó el patrón `pointerBounce: boolean + setTimeout` por animación directa vía **WAAPI** (`element.animate()`), con un throttle de 80ms entre rebotes visibles.

WAAPI corre en el compositor del navegador, independiente del ciclo de change detection de Angular. Cada llamada a `el.animate()` inicia una animación que se ejecuta hasta completarse, sin depender de clases CSS ni re-renders de Angular.

El throttle de 80ms (~12 rebotes/seg máximo) garantiza que cada animación sea perceptible aunque la rueda cruce 100 segmentos por segundo en el pico de velocidad.

---

## Comportamiento resultante

| Fase del giro | Cruces/seg (aprox.) | Rebotes visibles/seg | Aspecto |
|---|---|---|---|
| Inicio (ease-out rápido) | ~80–100 | ~12 | Ticking rápido, continuo |
| Mitad | ~15–30 | ~12 | Ticking moderado |
| Final (slowdown) | 1–5 | 1–5 | Cada click individual y claro |

---

## Nota sobre el ángulo de detección

`getCurrentSegmentIndex()` calcula el segmento en 0° (parte superior de la rueda), que coincide exactamente con la posición física del puntero (centrado en la parte superior del contenedor). No fue necesario modificar la lógica de detección de ángulo.

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/app/components/wheel-container/wheel-container.component.ts` | Eliminado `NgZone`; agregado `@ViewChild('pointerImage')`, `lastBounceTime`, `BOUNCE_THROTTLE_MS`; nuevo método `triggerPointerBounce()` con WAAPI; `checkSegmentCrossing()` simplificado |
| `src/app/components/wheel-container/wheel-container.component.html` | Agregado `#pointerImage` al `<img>` del puntero; eliminado `[class.bounce]="pointerBounce"` |

---

## Diff clave

**`checkSegmentCrossing()` — antes:**
```typescript
if (this.lastSegmentIndex !== -1 && currentSegment !== this.lastSegmentIndex) {
  this.audioService.playClick();
  this.zone.run(() => {
    this.pointerBounce = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.pointerBounce = false;
      this.cdr.markForCheck();
    }, 150);
  });
}
```

**`checkSegmentCrossing()` — después:**
```typescript
if (this.lastSegmentIndex !== -1 && currentSegment !== this.lastSegmentIndex) {
  this.audioService.playClick();
  this.triggerPointerBounce();
}
```

**`triggerPointerBounce()` — nuevo:**
```typescript
private triggerPointerBounce(): void {
  const now = performance.now();
  if (now - this.lastBounceTime < this.BOUNCE_THROTTLE_MS) return;
  this.lastBounceTime = now;

  const el = this.pointerImageEl?.nativeElement;
  if (!el) return;

  el.animate(
    [
      { transform: 'translateX(-50%) rotate(0deg)', offset: 0 },
      { transform: 'translateX(-50%) rotate(-15deg)', offset: 0.4 },
      { transform: 'translateX(-50%) rotate(0deg)', offset: 1 },
    ],
    { duration: 150, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'none' }
  );
}
```

---

## Estado

Implementado — rama `fix-puntero`, commit `b30b5af`
