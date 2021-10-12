---
layout: ~/layouts/MainLayout.astro
title: Componentes integrados
lang: es
---

Astro incluye varios componentes integrados para que los utilices en tus proyectos. Todos los componentes integrados están disponibles a través de `import {} from 'astro/components';`.

## `<Code />`

```astro
---
import { Code } from 'astro/components';
---
<!-- Resaltado de sintaxis de código JavaScript. -->
<Code code={`const foo = 'bar';`} lang="js" />
<!-- Opcional: personaliza tu tema. -->
<Code code={`const foo = 'bar';`} lang="js" theme="dark-plus" />
<!-- Opcional: habilite el ajuste de palabras. -->
<Code code={`const foo = 'bar';`} lang="js" wrap />
```

Este componente proporciona resaltado de sintaxis para bloques de código en el momento de la compilación (no se incluye JavaScript del lado del cliente). El componente funciona internamente con shiki y es compatible con todos los [temas](https://github.com/shikijs/shiki/blob/main/docs/themes.md) populares y [lenguajes](https://github.com /shikijs/shiki/blob/main/docs/languages.md).

También puede utilizar el componente `<Prism />` para el resaltado de sintaxis impulsado por la librería de resaltado de sintaxis [Prism](https://prismjs.com/). Esta es la librería que el Markdown de Astro usa por defecto. Sin embargo, cambiaremos todo el uso a `<Code>` a medida que avanzamos hacia nuestra versión v1.0.

## `<Markdown />`

```astro
---
import { Markdown } from 'astro/components';
---
<Markdown>
  # ¡La sintaxis de Markdown ahora es compatible! **¡Hurra!**
</Markdown>
```

Mira nuestra [Guía de Markdown](/es/guides/markdown-content) para más información.

<!-- TODO: We should move some of the specific component info here. -->

## `<Prism />`

```astro
---
import { Prism } from 'astro/components';
---
<Prism lang="js" code={`const foo = 'bar';`} />
```

Este componente proporciona resaltado de sintaxis específico del lenguaje para bloques de código. Dado que esto nunca cambia en el cliente, tiene sentido usar un componente Astro (es igualmente razonable usar un componente de framework para este tipo de cosas; ¡Astro es solo servidor por defecto para todos los frameworks!).

Consulta la [lista de lenguajes soportados por Prism](https://prismjs.com/#supported-languages) donde puedes encontrar undonde puede encontrar el alias correspondiente de un lenguaje. ¡Y también puedes mostrar tus bloques de código Astro con `lang="astro"`!

## `<Debug />`

```astro
---
import Debug from 'astro/debug';
const serverObject = {
  a: 0,
  b: "string",
  c: {
    nested: "object"
  }
}
---
<Debug {serverObject} />
```

Este componente proporciona una forma de inspeccionar los valores en el lado del cliente, sin JavaScript.
