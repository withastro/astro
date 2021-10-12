---
layout: ~/layouts/MainLayout.astro
title: Páginas
lang: es
---

**Páginas** son un tipo especial de [Componente de Astro](/es/core-concepts/astro-components) que manejan el enrutamiento, la carga de datos y la creación de plantillas para cada página de su sitio web. Puedes pensar en ellos como cualquier otro componente de Astro, solo que con responsabilidades adicionales.

Astro también admite Markdown para páginas con mucho contenido, como publicaciones de blogs y documentación. Consulta [Contenido de Markdown](/es/guides/markdown-content) para obtener más información sobre cómo escribir páginas con Markdown.

## Enrutamiento basado en archivos

Astro usa Páginas para hacer algo llamado **enrutamiento basado en archivos.** Cada archivo en tu directorio `src/pages` se convierte en una página en tu sitio, usando el nombre del archivo para decidir la ruta final.

Los Componentes de Astro (`.astro`) y archivos Markdown (`.md`) son los únicos formatos admitidos para las páginas. No se admiten otros tipos de páginas (como un componente React `.jsx`), pero puedes usar cualquier cosa como componente de la interfaz de usuario dentro de una página `.astro` para lograr un resultado similar.

```
src/pages/index.astro       -> mysite.com/
src/pages/about.astro       -> mysite.com/about
src/pages/about/index.astro -> mysite.com/about
src/pages/about/me.astro    -> mysite.com/about/me
src/pages/posts/1.md        -> mysite.com/posts/1
```

## Plantillas de página

Todos los componentes de Astro son responsables de devolver HTML. Las páginas de Astro también devuelven HTML, pero tienen la responsabilidad única de devolver una respuesta de página completa `<html> ... </html>`, incluyendo `<head>` ([MDN <span class = "sr-only">- head</span>](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head)) y `<body>` ([MDN <span class = "sr-only ">- body</span>](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body)).

`<! doctype html>` es opcional y se agregará automáticamente.

```astro
---
// Ejemplo: esqueleto de página HTML
---
<!doctype html>
<html>
  <head>
    <title>Título del documento</title>
  </head>
  <body>
    <h1>¡Hola mundo!</h1>
  </body>
</html>
```

## Carga de datos

Las páginas de Astro pueden obtener datos para ayudar a generar tus páginas. Astro proporciona dos herramientas diferentes a las páginas para ayudarte a hacer esto: **fetch()** y **await de alto nivel**.

📚 Lee nuestra [guía completa sobre la obtención de datos](/es/guides/data-fetching) para obtener más información.

```astro
---
// Ejemplo: los scripts del componente de Astro se ejecutan en el momento de la compilación
const response = await fetch('http://example.com/movies.json');
const data = await response.json();
console.log(data);
---
<!-- Envía el resultado a la página -->
<div>{JSON.stringify(data)}</div>
```

## Página de error 404 personalizada

Para una página de error 404 personalizada, crea un archivo `404.astro` en `/src/pages`. Eso genera una página `404.html`. La mayoría de los [servicios de despliegue](/es/guides/deploy) lo encontrarán y lo utilizarán.

Esto es especial y diferente al comportamiento predeterminado de construir `page.astro` (o `page/index.astro`) a `page/index.html`.
