# Puntero de la Rueda — Pendiente de Rediseño

**Contexto de uso:** La aplicación corre en televisores ubicados al menos a 1 metro de altura. Los usuarios son mayormente personas de tercera edad. Todo elemento visual debe ser legible y reconocible a distancia, con formas simples, alto contraste y trazos gruesos.

## Cambios requeridos
- Reemplazar el puntero actual por un **ancla** siguiendo la temática naval del juego.
- El ancla debe apuntar hacia abajo (hacia la rueda), con la punta claramente indicando el segmento activo.
- Debe mantener legibilidad a distancia: trazo grueso, sin detalles finos.

## Criterios de diseño
- Forma de ancla clásica (con barra horizontal en la parte superior y gancho en la inferior).
- La punta del gancho es el punto de referencia sobre el segmento de la rueda.
- Contraste fuerte con la rueda.
- Tamaño suficiente para ser visible desde lejos.
- `drop-shadow` aplicado desde CSS ya existe — el asset puede ser PNG transparente.


## Posición y animación en código
- El puntero vive en `.pointers-container` en `wheel-container.component.html`
- Tiene animación de rebote (`bounce`) al cruzar segmentos — el diseño de ancla debe ser compatible con una rotación leve en el eje vertical del punto de pivote superior
