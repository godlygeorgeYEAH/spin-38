# 🎯 Panel de Resultados — Animación Slingshot

Cuando la rueda entra en estado `SPINNING`, el panel de últimos resultados (`.right-results-panel`) se desplaza fuera de pantalla hacia la derecha con un efecto de honda/liga: primero retrocede 22 px hacia la izquierda y luego sale disparado. Al finalizar el giro, el panel regresa deslizándose suavemente desde la derecha.

---

## 📦 Archivos involucrados

| Archivo | Qué se modificó |
|---|---|
| `src/app/home/home.page.ts` | Propiedades `resultsPanelClass` y `resultsPanelHasAnimated` + suscripción a `roundState$` |
| `src/app/home/home.page.html` | `[ngClass]="resultsPanelClass"` en `.right-results-panel` |
| `src/app/home/home.page.css` | `@keyframes panel-slingshot-exit`, `@keyframes panel-slide-enter` y reglas `.panel-exit` / `.panel-enter` |

---

## ⚙️ Cómo funciona

### Máquina de estados CSS

El componente mantiene una propiedad `resultsPanelClass` que toma tres valores:

| Valor | Cuándo se aplica | Efecto |
|---|---|---|
| `''` (vacío) | Estado inicial, antes del primer giro | Sin animación — panel visible en posición normal |
| `'panel-exit'` | Al entrar en `SPINNING` | Animación slingshot: retrocede y sale por la derecha |
| `'panel-enter'` | Al salir de `SPINNING` | Deslizamiento de entrada desde la derecha |

El flag `resultsPanelHasAnimated` evita que la animación de entrada se dispare en el primer render (cuando el estado va de `undefined` → `IDLE` al iniciar la app).

### Flujo de estados

```
App inicia
  └─ roundState$ emite 'IDLE'
       └─ hasAnimated = false → resultsPanelClass = '' (sin animación)

Rueda empieza a girar
  └─ roundState$ emite 'SPINNING'
       └─ hasAnimated = true
          resultsPanelClass = 'panel-exit'  →  slingshot sale a la derecha

Rueda termina (REVEALING / IDLE)
  └─ roundState$ emite otro estado
       └─ hasAnimated = true → resultsPanelClass = 'panel-enter'  →  desliza de vuelta
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
private resultsPanelHasAnimated = false;
```

Suscripción en `ngAfterViewInit`:

```ts
this.orchestrator.roundState$.subscribe(state => {
  if (state === 'SPINNING') {
    this.resultsPanelHasAnimated = true;
    this.resultsPanelClass = 'panel-exit';
  } else if (this.resultsPanelHasAnimated) {
    this.resultsPanelClass = 'panel-enter';
  }
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
→ Verificar que `resultsPanelHasAnimated` siga siendo `false` en el primer emit de `roundState$`. Si el orquestador emite `SPINNING` inmediatamente al iniciar, el comportamiento es el esperado (se trata como un giro real).

**El panel no se anima (queda estático)**
→ Confirmar que `roundState$` esté emitiendo. El orquestador debe llamar a `.start()` para iniciar el polling — esto ocurre al final de `ngAfterViewInit` en `HomePage`.
