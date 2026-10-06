# Café Jardón

Web de demostración de una cafetería de especialidad ficticia en Gijón, hecha para mi portfolio.
El negocio, los textos y la dirección son inventados; el objetivo es enseñar lo que se puede construir.

**Ver la web:** https://luisjardon.github.io/cafe-jardon/

## Qué tiene

- **Intro en 3D:** un grano de café se parte en dos y la pantalla se rasga como papel.
- **Productos al hacer scroll:** cada café aparece en su recipiente real, modelado en 3D
  (espresso en demitasse, Chemex, cold brew con hielo y latte en vaso con capas).
- **"Hazte tu café":** configurador 3D. Eliges bebida, tamaño, leche, extras y si es para tomar aquí o para llevar,
  y el recipiente cambia al momento, con el precio recalculado en vivo.
- **Pedido:** añadir al pedido con animación, panel lateral con total y el pedido guardado en el navegador.
- **Historia:** vídeo en bucle con frases que aparecen al bajar.
- Carta con fotos que siguen al ratón, horario con "abierto ahora" calculado en vivo y menú adaptado a móvil.
- **Accesible:** respeta "reducir movimiento" del sistema (con versión estática y fotos de cada producto)
  y permite activar las animaciones a mano.

## Tecnología

- [Astro](https://astro.build) (web estática)
- [Three.js](https://threejs.org): todos los objetos 3D están modelados por código, sin modelos externos
- [GSAP](https://gsap.com) + ScrollTrigger + SplitText para las animaciones
- [Lenis](https://lenis.darkroom.engineering) para el scroll suave
- Fuentes servidas desde la propia web: Bricolage Grotesque, Instrument Serif y DM Mono

## Arrancar en local

Necesita Node 22 o superior.

```bash
npm install
npm run dev
```

Se abre en http://localhost:4321/cafe-jardon/

Para generar la versión publicable (carpeta `dist/`):

```bash
npm run build
```

### Publicarla en otra ruta

Por defecto se publica en `https://luisjardon.github.io/cafe-jardon/`. Para servirla en otro sitio:

```bash
SITE=https://luisjardonpiquero.com BASE=/cafe-jardon npm run build
```

## Créditos

- Fotos: [Unsplash](https://unsplash.com) (licencia Unsplash)
- Vídeo del vertido: Swarup Sarkar en [Pexels](https://www.pexels.com/video/36881321/) (licencia Pexels), recortado y desenfocado
- Logo LJ y diseño: Luis Jardón Piquero
