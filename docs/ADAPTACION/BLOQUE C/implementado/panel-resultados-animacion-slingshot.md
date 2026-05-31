# 🎯 Panel de Resultados — Animación Slingshot

El panel de últimos resultados (`.right-results-panel`) solo es visible durante `COUNTING_DOWN`. Cuando el conteo termina y la rueda entra en `SPINNING`, el panel sale disparado hacia la derecha con un efecto de honda/liga: primero retrocede 22 px y luego sale disparado. Durante `REVEALING` el panel permanece oculto — ese estado queda reservado para la animación de resultado del sorteo.

---

## 📦 Archivos involucrados

| Archivo | Qué se modificó |
|---|---|
| `src/app/home/home.page.ts` | Propiedad `resultsPanelClass` + suscripción a `roundState$` |
| `src/app/home/home.page.html` | `[ngClass]="resultsPanelClass"` en `.right-results-panel` |
| `src/app/home/home.page.css` | `@keyframes panel-slingshot-exit`, `@keyframes panel-slide-enter` y reglas `.panel-exit` / `.panel-enter` |

---

## ⚙️ Cómo funciona

### Máquina de estados CSS

El componente mantiene una propiedad `resultsPanelClass` que toma tres valores:

| Valor | Cuándo se aplica | Efecto |
|---|---|---|
| `''` (vacío) | `IDLE`, `SPINNING`, `REVEALING` | Panel fuera de pantalla (sin animación activa) |
| `'panel-enter'` | Al entrar en `COUNTING_DOWN` | Deslizamiento de entrada desde la derecha |
| `'panel-exit'` | Al entrar en `SPINNING` | Animación slingshot: retrocede y sale por la derecha |

### Flujo de estados

```
App inicia
  └─ roundState$ emite 'IDLE'
       └─ resultsPanelClass = '' (panel oculto, sin animación)

Servidor abre período de apuestas
  └─ roundState$ emite 'COUNTING_DOWN'
       └─ resultsPanelClass = 'panel-enter'  →  panel desliza desde la derecha

Countdown llega a 0 — rueda empieza a girar
  └─ roundState$ emite 'SPINNING'
       └─ resultsPanelClass = 'panel-exit'  →  slingshot sale a la derecha

Rueda se detiene
  └─ roundState$ emite 'REVEALING'
       └─ sin cambio — panel permanece oculto
          estado reservado para animación de resultado del sorteo

Período de revealing termina
  └─ roundState$ emite 'IDLE'
       └─ sin cambio — panel permanece oculto hasta el próximo COUNTING_DOWN
```

---

## 🎬 Animaciones CSS

### Salida — efecto slingshot (`panel-slingshot-exit`)

```css
@keyframes panel-slingshot-exit {
  0%   { transform: translateX(0); }
  18%  { transform: translateX(-22px); }   /* tiro hacia la izquierda */
  100% { transform: translateX(130%); }    /* sale disparado a la derecha */
}

.right-results-panel.panel-exit {
  animation: panel-slingshot-exit 520ms cubic-bezier(0.55, 0, 1, 0.45) forwards;
}
```

- **Duración**: 520 ms
- **Easing**: `cubic-bezier(0.55, 0, 1, 0.45)` — aceleración fuerte (ease-in agresivo)
- **`forwards`**: el panel se queda fuera de pantalla al terminar la animación

### Entrada (`panel-slide-enter`)

```css
@keyframes panel-slide-enter {
  0%   { transform: translateX(130%); }
  100% { transform: translateX(0); }
}

.right-results-panel.panel-enter {
  animation: panel-slide-enter 380ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}
```

- **Duración**: 380 ms
- **Easing**: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` — ease-out suave (desaceleración natural)

---

## 🔧 Propiedades y lógica en `HomePage`

```ts
public resultsPanelClass: '' | 'panel-exit' | 'panel-enter' = '';
```

Suscripción en `ngAfterViewInit`:

```ts
this.orchestrator.roundState$.subscribe(state => {
  if (state === 'COUNTING_DOWN') {
    this.resultsPanelClass = 'panel-enter';
  } else if (state === 'SPINNING') {
    this.resultsPanelClass = 'panel-exit';
  }
  // REVEALING e IDLE: panel permanece oculto — REVEALING reservado para animación de resultado
  this.cdr.markForCheck();
});
```

> `cdr.markForCheck()` es necesario porque `HomePage` usa `ChangeDetectionStrategy.OnPush`.

---

## 📐 Por qué `130%` y no `100vw`

El panel es `position: fixed` con `right: 0.3rem`. Traducirlo con `translateX(100vw)` desplazaría el borde izquierdo del panel hasta el borde derecho de la pantalla, pero como el panel tiene ancho propio (`min(700px, 90vw)`), quedaría parcialmente visible. Con `130%` se desplaza más allá de su propio ancho, garantizando que desaparezca completamente independientemente de la resolución.

---

## 🐛 Consideraciones

**El panel no desaparece completamente en pantallas muy anchas**
→ Subir el valor `130%` en `.panel-exit` y el keyframe `0%` de `panel-slide-enter` a `150%` o usar `calc(100% + 100vw)`.

**La animación de entrada se dispara al cargar la app**
→ Ya no es posible: el `panel-enter` solo se aplica explícitamente cuando `roundState$` emite `COUNTING_DOWN`. En `IDLE` inicial el panel no tiene clase activa.

**El panel no se anima (queda estático)**
→ Confirmar que `roundState$` esté emitiendo. El orquestador debe llamar a `.start()` para iniciar el polling — esto ocurre al final de `ngAfterViewInit` en `HomePage`.
