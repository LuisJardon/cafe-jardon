// @ts-check
import { defineConfig } from "astro/config";

// Por defecto se publica en GitHub Pages: https://luisjardon.github.io/cafe-jardon/
// Para servirla en otra ruta (p. ej. dentro de luisjardonpiquero.com) basta con cambiar SITE y BASE al compilar:
//   SITE=https://luisjardonpiquero.com BASE=/cafe-jardon npm run build
export default defineConfig({
  site: process.env.SITE ?? "https://luisjardon.github.io",
  base: process.env.BASE ?? "/cafe-jardon",
});
