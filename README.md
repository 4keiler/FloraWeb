# FLORA Web

Sitio estático de FLORA — cosmética clínicamente probada. Página única generada por un script de build propio (no requiere Astro en producción).

## Estructura

```
/
├─ src/pages/index.astro   # fuente de la página (template)
├─ public/                 # salida final del build (se sirve tal cual)
│  ├─ index.html           # página generada
│  ├─ styles/ scripts/ assets/ Productos/
├─ build.cjs               # transforma index.astro → public/index.html
├─ serve.cjs               # servidor estático local
└─ tools/                  # scripts de desarrollo (comparación, screenshots, etc.)
```

## Comandos

| Comando            | Acción                                          |
| :----------------- | :---------------------------------------------- |
| `npm install`      | Instala dependencias                            |
| `npm run build`    | Genera `public/index.html` (obligatorio antes de publicar) |
| `npm run dev`      | Sirve `public/` en `http://localhost:3000`      |
| `npm run deploy`   | Publica directo a Cloudflare Pages con Wrangler |

## Publicar en Cloudflare Pages

### Opción A — Dashboard (recomendada, despliegue automático desde GitHub)

1. Sube este repositorio a GitHub.
2. En [Cloudflare Dashboard → Workers & Pages → Create → Pages](https://dash.cloudflare.com), conecta el repositorio.
3. Configuración del build:
   - **Build command**: `npm run build`
   - **Build output directory**: `public`
   - **Node version**: `22` (archivo `.node-version` incluido)
4. Cada push a `main` publica automáticamente.

### Opción B — CLI con Wrangler

```sh
npx wrangler login
npm run deploy
```

## Notas de producción

- El sitio es 100 % estático: `public/index.html` + assets, sin servidor.
- La página usa fonts externas (Google Fonts / Adobe Typekit) y librerías CDN (GSAP, Lenis, Spline).
- Todos los enlaces de productos apuntan a WhatsApp `https://wa.me/584246518282`.