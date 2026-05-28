# Centro de rueda — Placeholder de asset visual

Elemento posicionado en el centro exacto de la rueda para que el diseñador coloque un asset visual (imagen, logo, decoración).

---

## Archivos

| Archivo | Qué se modificó |
|---|---|
| `src/app/components/wheel-container/wheel-container.component.html` | `div.wheel-center-asset` con `img.wheel-center-image` |
| `src/app/components/wheel-container/wheel-container.component.css` | Estilos y variables CSS del elemento |

---

## Uso

Poner el `src` de la imagen en el HTML:

```html
<div class="wheel-center-asset">
  <img class="wheel-center-image" src="assets/images/mi-asset.png" alt="" aria-hidden="true">
</div>
```

Ajustar tamaño y capa desde CSS (o desde `responsive-variables.scss`):

```css
--wheel-center-size:    18%;   /* % del diámetro de la rueda */
--wheel-center-z-index: 4;     /* 3 = rueda, 1001 = confetti */
```

---

## Detalles de posicionamiento

- `position: absolute` + `top/left: 50%` + `translate(-50%, -50%)` → siempre en el centro exacto del `.wheel-wrapper`.
- `pointer-events: none` — no interfiere con los clicks de la rueda.
- `object-fit: contain` en la imagen — escala sin distorsión.
