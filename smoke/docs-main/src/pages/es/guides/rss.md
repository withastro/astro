---
layout: ~/layouts/MainLayout.astro
title: RSS
---

Astro admite la generación de feeds RSS rápida y automática para blogs y otros sitios web de contenido.

Puedes crear una fuente RSS desde cualquier página de Astro que utilice una función `getStaticPaths()` para el enrutamiento. Solo las rutas dinámicas pueden usar `getStaticPaths()` hoy (ver [Enrutamiento](/es/core-concepts/routing)).

> Esperamos que esta función esté disponible para todas las demás páginas antes de la v1.0. Como solución alternativa, puedes convertir una ruta estática en una ruta dinámica que solo genera una página. Consulta [Enrutamiento](/es/core-concepts/routing) para obtener más información sobre las rutas dinámicas.

Crea una fuente RSS llamando a la función `rss()` que se pasa como argumento a `getStaticPaths ()`. Esto creará un archivo `rss.xml` en tu compilación final basado en los datos que proporciones usando el array `items`.

```js
// Example: /src/pages/posts/[...page].astro
// Coloca esta función dentro de la secuencia de comandos del componente de Astro.
export async function getStaticPaths({rss}) {
  const allPosts = Astro.fetchContent('../post/*.md');
  const sortedPosts = allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  // Genera un feed RSS de esta colección
  rss({
    // El título, la descripción y los metadatos personalizados de la fuente RSS.
    title: 'Don’s Blog',
    description: 'An example blog on Astro',
    customData: `<language>en-us</language>`,
    // The list of items for your RSS feed, sorted.
    items: sortedPosts.map(item => ({
      title: item.title,
      description: item.description,
      link: item.url,
      pubDate: item.date,
    })),
    // Opcional: personaliza dónde se escribe el archivo.
    // De lo contrario, el valor predeterminado es "/rss.xml".
    dest: "/my/custom/feed.xml",
  });
  // Devuelve tus rutas
  return [...];
}
```

Nota: Las fuentes RSS **no** se crearán durante el desarrollo. Actualmente, las fuentes RSS solo se generan durante la compilación final.
