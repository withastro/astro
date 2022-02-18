---
layout: ~/layouts/MainLayout.astro
title: Estructura del proyecto
---

Astro incluye un diseño de carpeta dogmático para tu proyecto. Cada proyecto de Astro debe incluir estos directorios y archivos:

- `src/*` - El código fuente de tu proyecto (componentes, páginas, etc.)
- `public/*` - Tus activos sin código (tipografías, iconos, etc.)
- `package.json` - Un manifiesto de proyecto.

La forma más sencilla de configurar tu nuevo proyecto es con `npm init astro`. Consulta nuestra [Guía de instalación](/es/installation) para obtener un tutorial sobre cómo configurar tu proyecto automáticamente (con `npm init astro`) o manualmente.

## Estructura del proyecto

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

La carpeta src es donde vive la mayor parte del código fuente de tu proyecto. Esto incluye:

- [Components de Astro](/es/core-concepts/astro-components)
- [Páginas](/es/core-concepts/astro-pages)
- [Maquetas](/es/core-concepts/layouts)
- [Componentes frontend JS](/es/core-concepts/component-hydration)
- [Estilado (CSS, Sass)](/es/guides/styling)
- [Marcado](/es/guides/markdown-content)

Astro tiene un control total sobre cómo estos archivos se procesan, optimizan y empaquetan en la construcción final de tu sitio. Algunos archivos (como los componentes de Astro) nunca llegan directamente al navegador y, en cambio, se procesan en HTML. Otros archivos (como CSS) se envían al navegador, pero es posible que se incluyan con otros archivos CSS dependiendo de cómo los utilice tu sitio.

### `src/components`

Los [components](/es/core-concepts/astro-components) son unidades reutilizables de Interfaz de Usuario (UI) para tus páginas HTML. Se recomienda (pero no es obligatorio) que coloques tus componentes en este directorio. La forma en que los organices dentro de este directorio depende de ti.

Tus componentes de UI que no son de Astro (React, Preact, Svelte, Vue, etc.) también pueden vivir en el directorio `src/components`. Astro procesará automáticamente todos los componentes en HTML a menos que hayas habilitado un componente de interfaz a través de la hidratación parcial.

### `src/layouts`

Las [maquetas](/es/core-concepts/layouts) son componentes reutilizables para maquetar páginas HTML. Se recomienda (pero no es obligatorio) que coloques tus componentes de maqueta en este directorio. La forma en que los organices dentro de este directorio depende de ti.

### `src/pages`

Las [páginas](/es/core-concepts/astro-pages) páginas contienen todas las páginas (compatibles con `.astro` y `.md`) de tu sitio web. Es **obligatorio** que coloques tus páginas en este directorio.

### `public/`

Para la mayoría de los usuarios, la mayoría de sus archivos vivirán dentro del directorio `src/` para que Astro pueda manejarlos y optimizarlos adecuadamente en su compilación final. Por el contrario, el directorio `public/` es el lugar para que cualquier archivo viva fuera del proceso de construcción de Astro.

Si colocas un archivo en la carpeta pública, Astro no lo procesará. En su lugar, se copiará intacto en la carpeta de compilación. Esto puede ser útil para activos como imágenes y fuentes, o cuando necesita incluir un archivo específico como `robots.txt` o `manifest.webmanifest`.
