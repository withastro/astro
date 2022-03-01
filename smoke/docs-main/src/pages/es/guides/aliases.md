---
layout: ~/layouts/MainLayout.astro
title: Alias
---

Un **alias** es un atajo útil para tus importaciones de JavaScript. Esta puede ser una gran opción si no te gustan las rutas de importación relativas largas con muchos segmentos repetidos `../`. Define un alias para importar cosas directamente desde algún directorio de proyecto de nivel superior, sin importar qué tan profundamente anidado esté ubicado un archivo.

Con un alias, puedes importar desde `"$components/SomeComponent.astro"` en lugar de `" ../../../../../components/SomeComponent.astro "`.

## Agregar un alias personalizado

Para agregar un alias personalizado a tu proyecto, busca el archivo `snowpack.config.mjs` de tu proyecto. Este archivo de configuración contiene las instrucciones y la configuración de la herramienta de compilación interna de Astro [Snowpack](https://www.snowpack.dev/reference/configuration). Si no ves un archivo `snowpack.config.mjs` en el nivel superior de su proyecto (dentro de la misma carpeta que tu `package.json`), puedes crear un archivo en blanco ahora.

Para agregar un nuevo alias de importación, define una nueva entrada `alias`:

```ts
// snowpack.config.mjs
export default {
  alias: {
    // Asignar importaciones de "$components/*" a "src/components/*"
    $components: './src/components',
    // Asignar importaciones de "$/*" a "src/*"
    $: './src',
    // ¡Defina el tuyo!
    '$my-special-alias': './src/some/special/folder',
  },
  // ...
};
```

Una vez que hayas definido tu(s) alia(s) y hayas reiniciado Astro (si es necesario), puedes comenzar a importar desde el alias en cualquier lugar de tu proyecto:

```js
import MyComponent from '$components/MyComponent.astro';
import mySvgUrl from '$/logo.svg';
```

Puede leer más sobre la configuración de `alias` en [la documentación de Snowpack](https://www.snowpack.dev/reference/configuration#alias).

## Consejos y trucos

- Recomendamos comenzar todos los alias con el carácter especial `$`. No es necesario.
- Es común definir un alias `$` de nivel superior para tu directorio `src`. No es necesario.
- Para agregar soporte VSCode para tus alias, también necesitarás definir tus alias en un archivo `tsconfig.json` o `jsconfig.json` a través del valor de configuración `"paths"`. Esto habilitará Intellisense en VSCode y la mayoría de los demás editores de texto.
- ¡No necesitas usar un alias con Astro! Algunas personas prefieren menos magia en su código y no quieren molestarse con pasos adicionales para la compatibilidad con el editor de texto.
