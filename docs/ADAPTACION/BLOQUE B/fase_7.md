# Fase 7 — Concepto visual y assets finales

**Bloque:** B
**Estimación:** Sin estimación fija — depende de la aprobación del concepto y la entrega de assets.
**Dependencias:** Concepto visual aprobado por Luis (cliente). Assets de los 38 animales venezolanos entregados por el diseñador. Fase 6 completada o en paralelo avanzado.
**Entregable:** Aplicación visualmente terminada con los 38 animales del animalito venezolano en los segmentos y el estilo "acero aniquilado" aplicado en toda la interfaz.

## Objetivo

Vestir el producto funcionalmente completo con la identidad visual definitiva. Esta fase no toca lógica de ronda, polling, ni animación — solo sustituye placeholders por assets reales y aplica los design tokens del concepto aprobado. La separación intencional entre funcionalidad y estética, establecida desde la Fase 3B con el render condicional, hace que este trabajo sea predecible y sin riesgo de regresión funcional.

## Qué se construye / Qué se hace

- **Sustitución de números por animales venezolanos.**
  - Los 38 números placeholder en los segmentos de ambos anillos se reemplazan por las imágenes de los 38 animales del animalito venezolano.
  - Al tratarse de render condicional implementado desde la Fase 3B, la sustitución consiste en poblar el campo `image` de cada `WheelItem` — el número desaparece del render automáticamente sin cambios de template ni lógica.
  - Las imágenes se depositan en `assets/images/animales/` siguiendo la jerarquía de carpetas definida en la Fase 0.

- **Aplicación de la paleta "acero aniquilado".**
  - Se aplican los design tokens del concepto aprobado en `theme/variables.scss`.
  - Se reemplazan los gradientes rojos y dorados heredados de Spin Zodiac por los gradientes metálicos de la paleta nueva.
  - Se actualizan colores de borde, fondo, tipografía y cualquier variable de color que use la UI.

- **Assets de rueda y elementos gráficos.**
  - Se sustituye el borde decorativo de la rueda por el asset entregado por el diseñador.
  - Se aplican cualquier otros elementos gráficos de la rueda que hayan llegado: texturas de segmento, puntero, aro exterior, etc.
  - Se ajusta el layout general si el concepto visual implica cambios de proporciones o posicionamiento de elementos.

## Criterio de completitud

- Los 38 animales venezolanos aparecen correctamente en los segmentos de ambos anillos, en el orden de posiciones de la ruleta americana.
- Ningún número de la ruleta americana es visible en los segmentos cuando el asset del animal correspondiente está disponible.
- La paleta "acero aniquilado" está aplicada en toda la interfaz: ningún gradiente rojo ni dorado de Spin Zodiac sobrevive en producción.
- `theme/variables.scss` contiene las variables del concepto nuevo, no las del proyecto original.
- El borde decorativo y los elementos gráficos de la rueda corresponden a los assets entregados por el diseñador.
- El concepto visual aplicado coincide con la propuesta aprobada por Luis.
- La sustitución de assets no introduce regresiones funcionales: el motor de giro, el countdown, el historial y el jackpot placeholder funcionan igual que antes.
- La aplicación compila sin errores y no muestra warnings de assets faltantes en consola.

## Estado

Pendiente
