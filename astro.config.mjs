// @ts-check
import { defineConfig } from "astro/config";

// Publicación principal: Cloudflare Pages en https://cafeteria.luisjardonpiquero.com/ (npm run build:cf, raíz del dominio).
// Por defecto (npm run build) se compila para GitHub Pages: https://luisjardon.github.io/cafe-jardon/
// Para servirla en otra ruta (p. ej. dentro de luisjardonpiquero.com) basta con cambiar SITE y BASE al compilar:
//   SITE=https://luisjardonpiquero.com BASE=/cafe-jardon npm run build
export default defineConfig({
  site: process.env.SITE ?? "https://luisjardon.github.io",
  base: process.env.BASE ?? "/cafe-jardon",
});
