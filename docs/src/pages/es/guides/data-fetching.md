---
layout: ~/layouts/MainLayout.astro
title: Obtención de datos
lang: es
---

Los componentes y las páginas de Astro pueden obtener datos remotos para ayudar a generar tus páginas. Astro proporciona dos herramientas diferentes a las páginas para ayudarte a hacer esto: **fetch()** y **await de nivel superior**.

## `fetch()`

Las páginas de Astro tienen acceso a la función global `fetch()` en su script de configuración. `fetch()` es una API de JavaScript nativa ([MDN <span class = "sr-only">- fetch</span>](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)) que te permite realizar solicitudes HTTP para cosas como API y recursos.

Aunque los scripts de componentes de Astro se ejecutan dentro de Node.js (y no en el navegador), Astro proporciona esta API nativa para que pueda obtener datos en el momento de la creación de la página.

```astro
---
// Movies.astro
const response = await fetch('https://example.com/movies.json');
const data = await response.json();
// Recuerda: las secuencias de comandos del componente de Astro se registran en la CLI
console.log(data);
---
<!-- Envía el resultado a la página -->
<div>{JSON.stringify(data)}</div>
```

## await de nivel superior

`await` es otra característica nativa de JavaScript que te permite esperar la respuesta de alguna promesa asincrónica ([MDN <span class =" sr-only ">- await</span>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)). Astro admite "await" en el nivel superior de la secuencia de comandos de tu componente.

**Importante:** Estos aún no están disponibles dentro de los componentes de Astro que no son de página. En su lugar, carga todos tus datos dentro de tus páginas y luego pásalos a tus componentes como propiedades.

## Usando `fetch()` fuera de Componentes de Astro

Si quieres usar `fetch()` en un componente que no sea Astro, usa la biblioteca [`node-fetch`](https://github.com/node-fetch/node-fetch):

```tsx
// Movies.tsx
import fetch from 'node-fetch';
import type { FunctionalComponent } from 'preact';
import { h } from 'preact';

const data = fetch('https://example.com/movies.json').then((response) =>
  response.json()
);

// Los componentes que se procesan en tiempo de compilación también se registran en la CLI.
// Si cargaste este componente con una directiva, se registraría en la consola del navegador.
console.log(data);

const Movies: FunctionalComponent = () => {
  // Envía el resultado a la página
  return <div>{JSON.stringify(data)}</div>;
};

export default Movies;
```

Si cargas un componente usando `node-fetch` [interactivamente](/es/core-concepts/component-hydration), con `client:load`, `client:visible`, etc., necesitarás no usar `node-fetch` o cambiar a una librería [isomórfica](https://en.wikipedia.org/wiki/Isomorphic_JavaScript) que se ejecutará tanto en el momento de la compilación como en el cliente, como [`node-fetch` README.md](https://github.com/node-fetch/node-fetch#motivation) recomienda:

> En lugar de implementar XMLHttpRequest en Node.js para ejecutar [Fetch polyfill] específico del navegador (https://github.com/github/fetch), ¿por qué no pasar de http nativo a buscar API directamente? Por lo tanto, node-fetch, código mínimo para una API compatible con window.fetch en tiempo de ejecución de Node.js.
>
> Consulta [isomorphic-unfetch](https://www.npmjs.com/package/isomorphic-unfetch) de Jason Miller o [cross-fetch] de Leonardo Quixada (https://github.com/lquixada/cross-fetch) para uso isomórfico (exporta node-fetch para el lado del servidor, whatwg-fetch para el lado del cliente).

> Citado de https://github.com/node-fetch/node-fetch#motivation
