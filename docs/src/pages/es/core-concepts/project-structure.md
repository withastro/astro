---
layout: ~/layouts/MainLayout.astro
title: Estructura del Proyecto
lang: es
---

Astro requiere una estructura fija de carpetas y archivos para tu proyecto. Cada proyecto de Astro debe incluir estas carpetas y archivos:

- `src/*` - Código de tu proyecto (componentes, páginas, etc.)
- `public/*` - Archivos estáticos (fuentes, íconos, imágenes, etc.)
- `package.json` - Manifiesto del proyecto.

La forma más sencilla de crear un nuevo proyecto es con `npm init astro`. Mira nuestra [Guía de Instalación](/es/quick-start) para ver cómo crear un proyecto automáticamente (con `npm init astro`) o manualmente.

## Estructura del Proyecto

```
├── src/
│   ├── components/
│   ├── layouts/
│   └── pages/
│       └── index.astro
├── public/
└── package.json
```

### `src/`

La carpeta `src/` contiene la mayoría del código de tu proyecto. Estos incluyen:

- [Componentes de Astro](/core-concepts/astro-components)
- [Páginas](/core-concepts/astro-pages)
- [Plantillas](/core-concepts/layouts)
- [Componentes Frontend de JS](/core-concepts/component-hydration)
- [Estilos (CSS, Sass)](/guides/styling)
- [Archivos Markdown](/guides/markdown-content)

Astro tiene un control total sobre estos archivos para ser procesados, optimizados y empaquetados en tu proyecto final. Algunos archivos (como los componentes de Astro) nunca llegan directamente al navegador y sólo son renderizados al HTML. Otros archivos (como CSS) se envían al navegador, pero pueden ser empaquetados junto con otros archivos CSS, dependiendo de cómo los utilice tú sitio.

### `src/components`

La carpeta [components](/core-concepts/astro-components) son unidades de interfaz de usuarios reutilizables para tus páginas HTML. Es recomendable (pero no obligatorio) que pongas tus componentes en esta carpeta. Cómo organizarlos dentro de esta carpeta dependerá de tí.

Los componentes de interfaz de usuarios que no sean de Astro (React, Preact, Svelte, Vue, etc.), también pueden estar en la carpeta `src/components`. Astro renderiza automáticamente todos los componentes a HTML, a menos que tengas componentes con hidratación parcial.

### `src/layouts`

La carpeta [layouts](/core-concepts/layouts) son componentes reusables para diseños de páginas HTML. Es recomendable (pero no obligatorio) que pongas tus diseños en esta carpeta. Cómo organizarlos dentro de esta carpeta dependerá de tí.

### `src/pages`

La carpeta [pages](/core-concepts/astro-pages) contiene todas las páginas (`.astro` y `.md`) para tu sitio web. Se **requiere** que pongas tus páginas en esta carpeta.

### `public/`

Para la mayoría de usuarios, la mayoría de tus archivos se encontrarán en la carpeta `src/` para que Astro pueda manejar y optimizarlos en el proceso final de compilación. En contraste, la carpeta `public/` es el lugar para que cualquier archivo que no esté dentro del proceso de compilación de Astro sea almacenado.

Si pones un archivo en la carpeta `public/`, Astro no lo procesa. En su lugar, lo copiará tal cual en la carpeta de compilación. Esto puede ser útil para archivos estáticos como imágenes y fuentes, o cuando necesitas incluir un archivo específico como `robots.txt` o `manifest.webmanifest`.
