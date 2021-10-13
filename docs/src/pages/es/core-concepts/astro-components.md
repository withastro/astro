---
layout: ~/layouts/MainLayout.astro
title: Componentes de Astro
lang: es
---

Los **componentes de Astro** (archivos que terminan con `.astro`) son la base de las plantillas del lado del servidor en Astro. Piensa en la sintaxis del componente Astro como HTML mejorado con JavaScript.

Aprender una nueva sintaxis puede ser intimidante, por lo que cuidadosamente diseñamos la sintaxis del componente Astro para que los desarrolladores web se familizarizen lo más pronto posible. En gran medida se basa en patrones que probablemente ya conozcas: componentes, portada, propiedades y expresiones JSX. Estamos seguros de que esta guía te permitirá escribir componentes de Astro en poco tiempo, especialmente si ya estás familiarizado con HTML y JavaScript.

## Visión general de la sintaxis

Un único archivo `.astro` representa un solo componente Astro en tu proyecto. Este patrón se conoce como **Componente de archivo único (SFC, del inglés Single-File Component)**. Tanto Svelte (`.svelte`) como Vue (`.vue`) también siguen este patrón.

A continuación se muestra un recorrido por las diferentes piezas y características de la sintaxis del componente Astro. Puedes leerlo de principio a fin o saltar entre secciones.

### Plantilla HTML

La sintaxis del componente Astro es un superconjunto de HTML. **Si conoces HTML, ya sabes lo suficiente como para escribir tu primer componente Astro.**

Por ejemplo, este archivo de tres líneas es un componente Astro válido:

```html
<!-- Ejemplo1.astro - ¡El HTML estático es un componente Astro válido! -->
<div class="ejemplo-1">
  <h1>¡Hola mundo!</h1>
</div>
```

Un componente Astro representa un fragmento de HTML en tu proyecto. Puede ser un componente reutilizable o una página completa de HTML que incluya elementos `<html>`, `<head>` y `<body>`. Consulta nuestra guía sobre [Páginas de Astro](/es/core-concept/astro-pages) para aprender a crear tu primera página HTML completa con Astro.

**Cada componente de Astro debe incluir una plantilla HTML.** Aunque puede mejorar su componente de varias maneras (ver más abajo), al fin y al cabo es la plantilla HTML la que dicta cómo se verá tu componente Astro renderizado.

### Estilos CSS

Las reglas CSS dentro de una etiqueta `<style>` se ajustan automáticamente a ese componente. Eso significa que puedes reutilizar los nombres de las clases en varios componentes, sin preocuparse por los conflictos. Los estilos se extraen y optimizan automáticamente en la compilación final para que no tengas que preocuparte por la carga de estilos.

Para obtener los mejores resultados, solo debes tener una etiqueta `<style>` por componente Astro. Esto no es necesariamente una limitación, pero a menudo dará como resultado un CSS mejor optimizado en su compilación final. Cuando trabajas con páginas, la etiqueta `<style>` puede ir anidada dentro de tu página `<head>`. Para los componentes independientes, la etiqueta `<style>` puede ir al nivel superior de su plantilla.

```html
<!-- Ejemplo de CSS del componente Astro -->
<style>
  .circle {
    background-color: red;
    border-radius: 999px;
    height: 50px;
    width: 50px;
  }
</style>
<div class="circle"></div>
```

```html
<!-- Ejemplo de CSS de Astro Page -->
<html>
  <head>
    <style>
      ...;
    </style>
  </head>
  <body>
    ...
  </body>
</html>
```

El uso de `<style global>` omitirá el alcance automático para cada regla CSS en el bloque `<style>`. Esta trampilla de escape debe evitarse si es posible, pero puede ser útil si, por ejemplo, necesitas modificar el estilo de los elementos HTML agregados por una librería externa.

Sass (una alternativa a CSS) está también disponible mediante `<style lang="scss">`.

📚 Lee nuestra guía completa sobre [Estilo de los componentes](/es/guides/styling) para obtener más información.

### Script preliminar

Para construir componentes dinámicos, presentamos la idea de un script preliminar del componente. [Frontmatter](https://jekyllrb.com/docs/front-matter/) es un patrón común en Markdown, donde algunos config/metadata están contenidos dentro de una valla de código (`---`) en la parte superior del archivo . Astro hace algo similar, pero con soporte completo para JavaScript y TypeScript en sus componentes.

Recuerda que Astro es un lenguaje de plantillas del lado del servidor, por lo que el script de su componente se ejecutará durante la compilación, pero solo el HTML se representará en el navegador. Para enviar JavaScript al navegador, puedes usar una etiqueta `<script>` en su plantilla HTML o [convertir tu componente para usar un framework de frontend](/es/core-concept/component-hydration) como React, Svelte, Vue, etc.

```astro
---
// Todo lo que esté dentro de la valla de código `---` es el script de tu componente.
// Este código JavaScript se ejecuta en tiempo de compilación.
// Consulte a continuación para obtener más información sobre lo que puede hacer.
console.log('Esto se ejecuta en el momento de la compilación, es visible en la salida CLI');
// Consejo: ¡TypeScript también es compatible de forma inmediata!
const thisWorks: number = 42;
---
<div class="ejemplo-1">
  <h1>¡Hola mundo!</h1>
</div>
```

### Importaciones de componentes

Un componente Astro puede reutilizar otros componentes de Astro dentro de su plantilla HTML. Esto se convierte en la base de nuestro sistema de componentes: crea nuevos componentes y luego reutilízalos en todo tu proyecto.

Para utilizar un componente Astro en tu plantilla, primero debes importarlo en el script preliminar del componente. Un componente Astro es siempre la importación predeterminada del archivo.

Una vez importado, puedes usarlo como cualquier otro elemento HTML en tu plantilla. Ten en cuenta que un componente de Astro **DEBE** comenzar con una letra mayúscula. Astro usará esto para distinguir entre elementos HTML nativos (`from`,` input`, etc.) y tus componentes de Astro personalizados.

```astro
---
// Importa tus componentes en tu script del componente
import AlgunComponente from './AlgunComponente.astro';
---
<!-- ... ¡luego utilízalos en su HTML! -->
<div>
  <AlgunComponente />
</div>
```

📚 También puedes importar y usar componentes de otros frameworks frontend como React, Svelte y Vue. Lee nuestra guía sobre [Hidratación de componentes](/es/core-concept/component-hydration) para obtener más información.

### Expresiones JSX dinámicas

En lugar de inventar nuestra propia sintaxis personalizada para la creación de plantillas dinámicas, te brindamos acceso directo a los valores de JavaScript dentro de su HTML, utilizando algo que se parece a [JSX](https://reactjs.org/docs/introducing-jsx.html) .

Los componentes de Astro pueden definir variables locales dentro del script de Frontmatter. Todas las variables de secuencia de comandos están disponibles automáticamente en la plantilla HTML a continuación.

#### Dynamic Values

```astro
---
const nombre = "Tu nombre aquí";
---
<div>
  <h1>¡Hola {nombre}!</h1>
</div>
```

#### Atributos dinámicos

```astro
---
const nombre = "Tu nombre aquí";
---
<div>
  <div data-nombre={nombre}>Se admiten expresiones de atributo</div>
  <div data-consejo={`Utilice cadenas de plantilla JS para mezclar ${"variables"}.`}>¡Qué bueno!</div>
</div>
```

#### HTML Dinámico

```astro
---
const elementos = ["Perro", "Gato", "Ornitorrinco"];
---
<ul>
  {elementos.map((elemento) => (
    <li>{elemento}</li>
  ))}
</ul>
```

### Propiedades del Componente

Un componente Astro puede definir y aceptar propiedades. Las propiedades están disponibles en el global `Astro.props` en su script preliminar.

```astro
---
// Ejemplo: <AlgunComponente saludo="(Opcional) Hola" name="Nombre requerido" />
const { saludo = 'Hola', nombre } = Astro.props;
---
<div>
    <h1>¡{saludo}, {nombre}!</h1>
</div>
```

Puedes definir tus propiedades con TypeScript exportando un `Props` de tipo _interface_.

> _**En el futuri**_, Astro recogerá automáticamente cualquier interfaz de `Props` exportada y dará advertencias/errores de tipo para su proyecto.

```astro
---
// Ejemplo: <AlgunComponente />  (CUIDADO: propiedad "nombre" obligatoria)
export interface Props {
  nombre: string;
  saludo?: string;
}
const { saludo = 'Hola', nombre } = Astro.props;
---
<div>
    <h1>¡{saludo}, {nombre}!</h1>
</div>
```

Luego puede pasar las propiedades del componente de esta manera:

```astro
---
// AlgunOtroCompoennte.astro
import AlgunComponente from "./AlgunComponente.astro";
let nombreDePila = "mundo";
---
<AlgunComponente nombre={nombreDePila}/>
```

### Ranuras

Los archivos `.astro` utilizan la etiqueta [`<slot>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot) para habilitar la composición de componentes. Viniendo de React o Preact, este es el mismo concepto que `hijos`. Puedes pensar en el elemento `<slot>` como un marcador de posición para el marcado que se pasará desde fuera del componente.

```astro
<!-- Example: MiComponente.astro -->
<div id="mi-componente">
  <slot /> <!-- los hijos irán aquí -->
</div>

<!-- Usage -->
<MiComponente>
  <h1>¡Hola mundo!</h1>
</MiComponente>
```

Ten en cuenta que si la etiqueta `<slot>` no se usa en la plantilla HTML, los elementos secundarios pasados al componente no se procesarán.

Las ranuras se vuelven aún más poderosas cuando se utilizan **ranuras con nombre **. En lugar de un solo elemento `<slot>` que representa a _todos_ los hijos, las ranuras con nombre te permiten especificar varios lugares donde los hijos deben ser colocados.

> **Nora:** El atributo `slot` attribute no está restringido a HTML simple, ¡los componentes también pueden usar `slot`!

```astro
<!-- Ejemplo: MiComponente.astro -->
<div id="mi-componente">
  <header>
    <!-- hijo con el atributo `slot="cabecera"` irá aquí -->
    <slot name="cabecera" />
  </header>
  <main>
    <!-- hijo sin atributo `slot` (or con el `slot="default"`) irá aquí -->
    <slot />
  </main>
  <footer>
    <!-- hijo con el atributo `slot="pie"` irá aquí  -->
    <slot name="pie" />
  </footer>
</div>

<!-- Usage -->
<MiComponente>
  <h1 slot="cabecera">¡Hola mundo!</h1>
  <p>Lorem ipsum ...</p>
  <FooterComponent slot="pie" />
</MiComponente>
```

Las ranuras también pueden devolver **contenido de respaldo**. Cuando no hay hijos pasados a un `<slot>` que coincidan, un elemento `<slot>` renderizará sus propios hijos de marcador de posición.

Slots can also render **fallback content**. When there are no matching children passed to a `<slot>`, a `<slot>` element will render its own children.

```astro
<!-- MiComponente.astro -->
<div id="mi-componente">
  <slot>
    <h1>¡Me renderizaré cuando esta ranura no tenga hijos!</h1>
  </slot>
</div>

<!-- Usage -->
<MiComponente />
```

### Fragmentos y elementos múltiples

Una plantilla de componente Astro puede representar tantos elementos de nivel superior como desees. A diferencia de otros frameworks de componentes de interfaz de usuario, no es necesario que envuelvas todo en un único `<div>` si prefieres no hacerlo.

```html
<!-- Un componente Astro puede contener varios elementos HTML de nivel superior: -->
<div id="a" />
<div id="b" />
<div id="c" />
```

Sin embargo, cuando trabajes dentro de una expresión JSX, debes envolver varios elementos dentro de un **Fragmento**. Los fragmentos te permiten renderizar un conjunto de elementos sin agregar nodos adicionales al DOM. Esto es necesario en las expresiones JSX debido a una limitación de JavaScript: nunca puede "devolver" más de una cosa en una función o expresión de JavaScript. El uso de un fragmento resuelve este problema.

Un Fragmento debe abrirse con `<>` y cerrarse con `</>`. No se preocupe si olvida esto, el compilador de Astro le advertirá que debe agregar uno.

```astro
---
const elementos = ["Perro", "Gato", "Ornitorrinco"];
---
<ul>
  {elementos.map((elemento) => (
    <>
      <li>{elemento} rojo</li>
      <li>{elemento} azul</li>
      <li>{elemento} verde</li>
    </>
  ))}
</ul>
```

### Scripts izados

Por defecto, Astro no hace ninguna suposición sobre cómo deseas que se sirvan los scripts, por lo que si agregas una etiqueta `<script>` en una página o un componente, se quedará sola.

Sin embargo, si deseas que todos tus scripts se extraigan de los componentes y se muevan a la parte superior de la página, y luego se agrupen en producción, puedes lograrlo con scripts izados.

Un **script izado** se ve así:

```astro
<script hoist>
  // Una secuencia de comandos en línea
</script>
```

O puede vincularse a un archivo JavaScript externo:

```astro
<script src={Astro.resolve('./mi-componente.js')} hoist></script>
```

Un script elevado puede estar dentro de una página o un componente, y no importa cuántas veces se use el componente, el script solo se agregará una vez:

```astro
---
import TwitterTimeline from '../components/TwitterTimeline.astro';
---

<-- The script will only be injected into the head once. -->
<TwitterTimeline />
<TwitterTimeline />
<TwitterTimeline />
```

## Comparando `.astro` versus` .jsx`

Los archivos `.astro` puede terminar pareciendo muy similares a los archivos `.jsx`, pero hay algunas diferencias claves. Aquí hay una comparación entre los dos formatos.

| Feature                              | Astro                                      | JSX                                                            |
| ------------------------------------ | ------------------------------------------ | -------------------------------------------------------------- |
| Extensión de archivo                 | `.astro`                                   | `.jsx` or `.tsx`                                               |
| Componentes definidos por el usuario | `<Capitalized>`                            | `<Capitalized>`                                                |
| Sintaxis de expresiones              | `{}`                                       | `{}`                                                           |
| Difundir atributos                   | `{...props}`                               | `{...props}`                                                   |
| Atributos booleanos                  | `autocomplete` === `autocomplete={true}`   | `autocomplete` === `autocomplete={true}`                       |
| Funciones en línea                   | `{items.map(item => <li>{item}</li>)}`     | `{items.map(item => <li>{item}</li>)}`                         |
| Soporte IDE                          | WIP - [VS Code][code-ext]                  | Fenomenal                                                      |
| Requiere importación JS              | No                                         | Sí, `jsxPragma` (`React` or `h`) debe estar dentro del alcance |
| Fragmentos                           | Automatic top-level, `<>` inside functions | Envolver con `<Fragment>` or `<>`                              |
| Múltiples frameworks por archivo     | Yes                                        | No                                                             |
| Modificando `<head>`                 | Just use `<head>`                          | Por-framework (`<Head>`, `<svelte:head>`, etc)                 |
| Estilo de comentario                 | `<!-- HTML -->`                            | `{/* JavaScript */}`                                           |
| Caracteres especiales                | `&nbsp;`                                   | `{'\xa0'}` or `{String.fromCharCode(160)}`                     |
| Atributos                            | `dash-case`                                | `camelCase`                                                    |

## Resolución de URL

Es importante tener en cuenta que Astro **no** transformará las referencias HTML por ti. Por ejemplo, considera una etiqueta `<img>` con un atributo relativo `src` dentro de `src/pages/about.astro`:

```html
<!-- ❌ Incorrecto: Intentará cargar `/about/thumbnail.png` -->
<img src="./thumbnail.png" />
```

Dado que `src/pages/about.astro` se compilará en `/about/index.html`, es posible que no haya esperado que la imagen viva en `/about/thumbnail.png`. Entonces, para solucionar este problema, elige una de las dos opciones:

#### Opción 1: URL absolutas

```html
<!-- ✅ Correcto: referencia a public/thumbnail.png -->
<img src="/thumbnail.png" />
```

El enfoque recomendado es colocar archivos dentro de `public/*`. Esto hace referencia a un archivo en `public/thumbnail.png`, que se resolverá en `/thumbnail.png` en la compilación final (ya que `public/` termina en `/`).

#### Opción 2: Referencias de importación de activos

```astro
---
//  ✅ Correcto: referencia a src/thumbnail.png
import thumbnailSrc from './thumbnail.png';
---

<img src={thumbnailSrc} />
```

Si prefieres organizar los activos junto con los componentes de Astro, puedes importar el archivo en JavaScript dentro del script del componente. Esto funciona según lo previsto, pero hace que sea más difícil hacer referencia a `thumbnail.png` en otras partes de su aplicación, ya que su URL final no es fácilmente predecible (a diferencia de los recursos en ` public/*`, donde se garantiza que la URL final nunca cambia).

[code-ext]: https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode
