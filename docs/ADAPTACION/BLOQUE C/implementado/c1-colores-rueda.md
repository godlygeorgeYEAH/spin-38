# C1 — Paleta de colores de la rueda

El cliente quiere una ruleta visualmente azul. Los colores anteriores no reflejaban una identidad de color clara y el contraste entre secciones adyacentes era insuficiente.

## Decisiones de diseño

**Rueda externa:** dos azules fijos para todas las paletas — marino profundo y cobalto medio. Son los que el cliente aprobó; no se tocan.

**Rueda interna:** es el lienzo de experimentación. Se probaron tres direcciones antes de llegar a las paletas actuales:
- **Tierra (ámbar + siena):** se descartó porque en pantalla se veía extremadamente brillante, efecto circo.
- **Verde casino (selva + esmeralda):** se descartó porque rompía el concepto naval de la ruleta — se sentía como una mesa de blackjack.
- **Turquesa de playa venezolana:** aprobado. La inspiración directa es el agua de las playas venezolanas (Los Roques, Morrocoy): turquesa claro, casi traslúcido, con profundidad en los bordes.

## Implementación

Las paletas viven en `src/app/components/wheel-container/wheel-palettes.ts`. Para cambiar la paleta activa, editar una sola línea:

```typescript
export const ACTIVE_PALETTE: PaletteName = 'Caribe'; // → 'Selva' | 'Clasica'
```

## Paletas disponibles

### Clásica
Colores originales del proyecto. Se conserva como referencia y fallback de desarrollo.

| Rol | Centro (60%) | Borde (100%) |
|---|---|---|
| Externa A | `#2097FC` | `#1167C0` |
| Externa B | `#2711A3` | `#180B6B` |
| Interna A | `#FFD890` | `#C48A10` |
| Interna B | `#86EBF5` | `#1DA8BC` |

---

### Caribe ✓ (activa)
**Inspiración:** agua de playa venezolana — Los Roques, Morrocoy. Turquesa claro casi traslúcido en la superficie, teal profundo en el fondo. La rueda interna evoca el mar Caribe desde arriba.

| Rol | Centro (60%) | Borde (100%) |
|---|---|---|
| Externa A | `#103EA8` | `#061E60` |
| Externa B | `#2C7CE0` | `#1455B0` |
| Interna A (teal profundo) | `#0E8FAA` | `#054F62` |
| Interna B (turquesa claro) | `#42DCEE` | `#1AAEC6` |

---

### Selva
**Inspiración:** verde selva, naturaleza tropical. Archivada porque en pantalla el verde esmeralda evocaba más una mesa de casino que un entorno naval. Se conserva para iteración futura si el cliente quiere explorar esa dirección.

| Rol | Centro (60%) | Borde (100%) |
|---|---|---|
| Externa A | `#103EA8` | `#061E60` |
| Externa B | `#2C7CE0` | `#1455B0` |
| Interna A (verde selva) | `#0A5C38` | `#042E18` |
| Interna B (esmeralda) | `#1EC468` | `#0E8A40` |

## Criterios de aceptación

- Ningún par de secciones adyacentes tiene el mismo tono perceptual.
- La rueda externa se lee inequívocamente como azul.
- La rueda interna armoniza con la externa sin confundirse con ella.

## Estado

Implementado — paleta **Caribe** activa.
