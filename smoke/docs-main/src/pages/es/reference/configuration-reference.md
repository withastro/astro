---
layout: ~/layouts/MainLayout.astro
title: Referencia de Configuración
---

Para configurar Astro, agrega un archivo `astro.config.mjs` en la raíz de tu proyecto. Todos los ajustes son opcionales.

Puedes ver la API de configuración completa (incluida la información sobre la configuración predeterminada) en [GitHub](https://github.com/withastro/astro/blob/latest/packages/astro/src/@types/config.ts).

```js
// Example: astro.config.mjs

// @type-check habilitado!
// VSCode y otros editores de texto habilitados para TypeScript proporcionarán autocompletado,
// información sobre herramientas útiles y advertencias si el objeto exportado no es válido.
// Puede desactivar esto eliminando los comentarios "@ts-check" y `@type` a continuación.

// @ts-check
export default /** @type {import('astro').AstroUserConfig} */ (
  {
    // ...
  }
);
```

## Configuración Snowpack

Astro funciona internamente con Snowpack. Puedes configurar Snowpack directamente creando un archivo `snowpack.config.mjs`. Consulta [snowpack.dev](https://www.snowpack.dev/reference/configuration) para obtener la documentación completa sobre este archivo.
