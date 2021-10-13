---
layout: ~/layouts/MainLayout.astro
title: Astro versus X
lang: es
---

Con frecuencia nos preguntamos, "¿Cómo se comporta Astro en comparación a mi generador de páginas web favorito, **\_\_\_\_**?". Esta guía fue escrita para responder a esa pregunta, al comparar varios generadores de páginas web y alternativas a Astro.

Si no ves tu generador de páginas web favorito en la lista, [pregúntanos en Discord.](https://astro.build/chat)

## Estado del Proyecto

Una nota rápida sobre la madurez del proyecto: **Astro aún se encuentra en beta.** Muchas de las herramientas listadas aquí son mucho más maduras. !Algunas tienen más de 12 años en comparación a Astro!

Algunas características, aunque son pocas, aún no están disponibles en Astro y algunas APIs aún no están terminadas. Sin embargo, el proyecto se considera estable desde un punto de vista de los errores; además, ya se han construido muchas páginas web usando Astro. Esto es un punto importante a considerar al momento de escoger a Astro.

## Docusaurus vs. Astro

[Docusaurus](https://docusaurus.io/) es un popular generador de sitios web sobre documentación. Docusaurus desarrollado por React para generar tu UI del sitio web; mientras que Astro soporta React, Vue.js, Svelte, y plantillas HTML.

Docusaurus fue diseñada para construir la documentación de las páginas web y tienen una creación propia y unas características específicas de documentación que Astro no posee. En lugar de eso, Astro ofrece características específicas de documentación mediante un tema oficial [`docs`](https://github.com/snowpackjs/astro/tree/main/examples/docs) que puedes utilizar en tu sitio. !Este sitio web se construyó usando ese tema!

#### Comparando el Rendimiento de Docusaurus vs. Astro

En la mayoría de casos, los sitios web de Astro cargarán mucho más rápido que los sitios web de Docusaurus. Esto es porque Astro automáticamente quita el código JavaScript innecesario de la página, cargando sólo los componentes individuales que la página que necesita. Esta característica se llama [hidratación parcial](/es/core-concepts/component-hydration).

Docusaurus no soporta hidratación parcial, en lugar de eso, hace que el usuario cargue y rehidrata la página completa en el navegador, incluso si la mayoría del contenido de la página es estático. Esto crea una carga de página más lenta y un peor rendimiento para tu sitio web. No hay manera de deshabilitar este comportamiento en Docusaurus.

#### Caso de Estudio: Documentando un sitio web

[docusaurus.io/docs](https://docusaurus.io/docs) es la documentación oficial de Docusaurus y está construida con Docusaurus. El sitio web ofrece unas características similares en su diseño y funcionalidad al compararla con documentación oficial de Astro. Esto nos da una **_vista detallada y realista_** entre los dos generadores de sitios web.

- **Puntaje de rendimiento de Docusaurus**: 61 de 100 [(ver detalles)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocusaurus.io%2Fdocs)
- **Puntaje de rendimiento de Astro**: 99 de 100 [(ver detalles)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

Una de las más grandes razones detrás de la diferencia en los rendimientos es que la carga de Javascript en Astro es el poco tiempo de carga de Javascropt en Astro: [docusaurus.io/docs](https://docusaurus.io/docs) carga **238kb** de Javascript en la primera carga; mientras que [docs.astro.build](https://docs.astro.build/es/getting-started) carga **78.7kb** (en general, 67% menos de JavaScript) _después_ de la primera carga.

## Elder.js vs. Astro

[Elder.js](https://elderguide.com/tech/elderjs/) es un dogmático generador de sitios web estáticos de código abierto que desarrollado para Svelte.

Elder.js utiliza Svelte para generar tu sitio web. Astro es más flexible: eres libre de crear un componente UI en cualquier librería popular (React, Preact, Vue, Svelte, Solid entre otros) o puedes crear un componente de Astro con una sintaxis parecida a HTML, que es similar a HTML + JSX.

Elder.js es el único en esta lista, junto con Astro, que soporta [hidratación parcial](/es/core-concepts/component-hydration). Astro y Elder.js automáticamente quitan el código JavaScript innecesario de la página, cargando sólo los componentes individuales que se necesiten. Elder.js tiene una API de hidratación parcial un poco diferente, pero Astro soporta algunas características que Elder.js no soporta (como `client:media`). Sin embargo, ambos generadores de sitios web construyen sitios web similares en temas de rendimiento.

Elder.js utiliza una solución de rutas personalizadas que puede sentirse poco familiar para los nuevos desarrolladores. Astro utiliza [rutas basadas en archivos](/es/core-concepts/routing) que debería sentirse familiar a todos los desarrolladores que han visto Next.js, SvelteKit y otros generadores de sitios web estáticos como Eleventy.

Elder.js fue diseñado para correr en sitios web grandes y afirma que puede construir un sitio web de 20 mil páginas en menos de 10 minutos (en una modesta máquina virtual). Al momento de escribir esto, Astro construye mil páginas en 66 segundos, pero aún no ha sido probado en proyectos de más de 20 mil páginas. Astro está aún en la fase inicial y la meta para Astro v1.0 es alcanzar la velocidad de construcción sitios web de Elder.js.

Elder.js soporta tanto Static Site Generation (SSG) como Server-Side Rendering (SSR). Hoy en día, Astro tan sólo soporta Static Site Generation (SSG).

## Eleventy vs. Astro

[Eleventy](https://www.11ty.dev/) es un popular creador de sitios estáticos desarrollado por Node.js.

Eleventy utiliza mucho [plantillas de lenguaje HTML antiguas](https://www.11ty.dev/docs/languages/) para renderizar tu sitio web: Nunjucks, Liquid, Pug, EJS, entre otros. Astro es más flexible: eres libre de crear un componente UI en cualquier librería popular (React, Preact, Vue, Svelte, Solid entre otros) o puedes crear un componente de Astro con una sintaxis parecida a HTML, que es similar a HTML + JSX.

#### Comparando el Rendimiento de Eleventy vs. Astro

Conceptualmente, Eleventy está alineado con el enfoque de Astro sobre "el uso mínimo de Javascript en el lado del cliente". Tanto Eleventy y Astro ofrecen un rendimiento similar, un uso extremadamente bajo de Javascript por defecto.

Eleventy alcanza este punto al empujarte a evitar usar Javascript. Los sitios de Eleventy son escritos, con frecuencia, con poco o ninguna línea de Javascript. Esto se convierte en un problema cuando necesitas Javascript en el lado del cliente. Es tu responsabilidad crear tu propia línea de construcción de recursos para Eleventy. Esto puede ser una tarea difícil y te obliga a configurar una gran cantidad de optimizaciones, como la fusión de archivos, la minificación y otros.

Por otro lado, Astro automáticamente construye el CSS y Javascript en el lado del cliente por ti. Astro automáticamente quita el código Javascript innecesario de la página, cargando sólo los componentes individuales que se necesiten. Está funcionalidad se llama [hidratación parcial](/es/core-concepts/component-hydration). Mientras que en Eleventy lo puedes alcanzar esto por ti mismo; Astro la ofrece desde el inicio y sin configuración extra.

## Gatsby vs. Astro

[Gatsby](https://www.gatsbyjs.com/) es una popular página web y framework de React.

Gatsby utiliza React para renderizar tu sitio web. Astro es más flexible: eres libre de crear un componente UI en cualquier librería popular (React, Preact, Vue, Svelte, Solid, entre otros) o puedes crear un componente de Astro con una sintaxis parecida a HTML, que es similar a HTML + JSX.

Gatsby v4 soporta tanto Static Site Generation (SSG) como Server-Side Rendering (SSR). Hoy en día, Astro tan sólo soporta Static Site Generation (SSG).

Gatsby requiere de una API personalizada de GraphQL para trabajar con todo el contenido de tu sitio web. Aunque algunos desarrolladores disfrutan de este modelo, una crítica común a Gatsby es que este modelo se vuelve demasiado complejo y difícil de mantener en el tiempo, especialmente cuando las páginas crecen. Astro no requiere una API de GraphQL, en su lugar ofrece apoyos para API familiares (como `fetch()` y `await`) para la carga de datos cuando se necesite.

#### Comparando el Rendimiento de Gatsby vs. Astro

En la mayoría de casos, los sitios de Astro cargarán mucho más rápido que los sitios de Gatsby. Esto pasa porque Astro automáticamente quita el código Javascript innecesario de la página, cargando sólo los componentes individuales que se necesiten. Esta característica se llama [hidratación parcial](/es/core-concepts/component-hydration).

Gatsby no soporta la hidratación parcial. En su lugar, hace que el usuario cargue e hidrate la página completa en el navegador, incluso si la mayoría del contenido es estático. Esto hace que las páginas carguen más lentamente y que el rendimiento sea más bajo para tu sitio web. Gatsby tiene [un plugin comunitario](https://www.gatsbyjs.com/plugins/gatsby-plugin-no-javascript/) para remover todo el Javascript de la página, pero esto rompería muchos sitios web. Esto le queda a usted con una decisión de todo-o-nada para la interactividad en cada una de las páginas.

Gatsby tiene un gran ecosistema de plugins, el cual podría hacer que Gatsby sea una gran opción para tu proyecto dependiendo de tus necesidades. [gatsby-plugin-image](https://www.gatsbyjs.com/plugins/gatsby-plugin-image/) es un popular plugin para optimizar imágenes, esto podría convertir a Gatsby en una mejor opción para algunas páginas con muchas imágenes.

#### Caso de Estudio: Documentando un sitio web

[gatsbyjs.com/docs](https://www.gatsbyjs.com/docs/quick-start/) es la documentación oficial de Gatsby, construida con Gatsby. El sitio web ofrece una interfaz similar y un conjunto de características a comparar con la documentación oficial de Astro. Esto nos da una **_vista detallada y realista_** entre los dos generadores de sitios web.

- **Puntaje de rendimiento de Gatsby**: 64 de 100 [(ver detalles)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fwww.gatsbyjs.com%2Fdocs%2Fquick-start%2F)
- **Puntaje de rendimiento de Astro**: 99 de 100 [(ver detalles)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

Una de las más grandes razones detrás de la diferencia en los rendimientos es que la carga de Javascript en Astro es el poco tiempo de carga de Javascropt en Astro: [gatsbyjs.com/docs](https://www.gatsbyjs.com/docs/quick-start/) carga **417kb** de Javascript en la primera carga; mientras que [docs.astro.build](https://docs.astro.build/es/getting-started) loads **78.7kb** (en general, 81% menos de JavaScript) _después_ de la primera carga.

## Hugo vs. Astro

[Hugo](https://gohugo.io/) es un generador de sitios web estático desarrollado por Go.

Hugo utiliza una [plantilla de lenguajes personalizados](https://gohugo.io/templates/introduction/) para renderizar tu sitio web. Astro te deja crear un componente UI en cualquier librería popular (React, Preact, Vue, Svelte, Solid, entre otros) o puedes crear un componente de Astro con una sintaxis parecida a HTML, que es similar a HTML + JSX.

#### Comparando el Rendimiento de Hugo vs. Astro

Conceptualmente, Hugo está alineado con el enfoque de Astro sobre "el uso mínimo de Javascript en el lado del cliente". Tanto Hugo y Astro ofrecen un rendimiento similar, un uso extremadamente bajo de Javascript por defecto.

Tanto Hugo como Astro, traen incorporado soporte para la construcción, el empaquetado y la minificación de JavaScript. Astro automáticamente quita el código Javascript innecesario de la página, cargando sólo los componentes individuales que se necesiten. Esta característica se llama [hidratación parcial](/es/core-concepts/component-hydration). Mientras que esto lo puedes hacer en Hugo por ti mismo, Astro lo ofrece incorporado por defecto.

## Jekyll vs. Astro

[Jekyll](https://jekyllrb.com/) es un popular generador de sitios estáticos, desarrollado por Ruby.

Jekyll utiliza una vieja versión de [lenguaje de plantillas](https://jekyllrb.com/docs/liquid/) para renderizar tu sitio web. Astro te permite crear páginas usando una interfaz de usuario de librerías de componentes (React, Preact, Vue, Svelte, entre otros otros) o una sintaxis de componente similar a HTML + JSX. Jekyll no soporta la utilización de componentes modernos para las plantillas de HTML.

#### Comparando el Rendimiento de Jekyll vs. Astro

Conceptualmente, Eleventy está alineado con el enfoque de Astro sobre "el uso mínimo de Javascript en el lado del cliente". Tanto Jekyll y Astro ofrecen un rendimiento similar, un uso extremadamente bajo de Javascript por defecto.

Jekyll alcanza este punto porque no permite que el usuario cargue Javascript. Los sitios Jekyll son frecuentemente escritos con poco a ningún Javascript, en su lugar promueven el renderizado de HTML en el lado del servidor. Esto se convierte en un problema cuando necesitas utilizar JavaScript en el lado del cliente. Es tu responsabilidad crear tu propia cadena de procesos de construcción para Jekyll. Esto consume mucho de tu tiempo y te obliga a configurar la empaquetación, la minificación y otras optimizaciones por ti mismo.

En contraste, Astro automáticamente construye el Javascript del lado del cliente para ti. Astro sólo envía el mínimo de Javascript al navegador, minificado, empaquetado y optimizado para producción. Esto puede ser posible por ti mismo en Jekyll, pero con Astro esto se hace por defecto.

## SvelteKit vs. Astro

[SvelteKit](https://kit.svelte.dev/) es un popular sitio web y un marco de trabajo para Svelte.

SeveltKit utiliza Svelte para renderizar tu sitio web. Astro es más flexible: eres libre de crear un componente UI en cualquier librería popular (React, Preact, Vue, Svelte, Solid, entre otros) o puedes crear un componente de Astro con una sintaxis parecida a HTML, que es similar a HTML + JSX.

Tanto SveltKit como Astro, son estructuras o frameworks para crear sitios web. SvelteKit funciona mejor con sitios web altamente dinámicos (como tableros y bandejas de entradas); mientras que Astro funciona mejor con sitios altamente estáticos (como contenido web y sitios de comercio electrónico).

SvelteKit soporta tanto Static Site Generation (SSG) como Server-Side Rendering (SSR). Hoy en día, Astro tan sólo soporta Static Site Generation (SSG).

#### Comparando el Rendimiento de SveltKit vs. Astro

En la mayoría de casos, los sitios de Astro cargarán mucho más rápido que los sitios de SveltKit. Esto pasa porque Astro automáticamente quita el código Javascript innecesario de la página, cargando sólo los componentes individuales que se necesiten. Esta característica se llama [hidratación parcial](/es/core-concepts/component-hydration).

SveltKit no soporta la hidratación parcial, en su lugar hace que el usuario cargue e hidrate la página completa en el navegador, incluso si la mayoría del contenido de la página es estático. Esto crea una carga de página más lenta y un rendimiento inferior para tu sitio web. SveltKit ofrece soporte para [páginas estáticas, con cero JavaScript](https://kit.svelte.dev/docs#ssr-and-javascript-hydrate). Sin embargo, en su página no hay planificación para realizar la hidratación parcial de componentes individuales. Por lo tanto, queda a tu criterio tomar la decisión de todo-o-nada en la interactividad de cada página.

#### Caso de Estudio: Documentando un sitio web

[kit.svelte.dev](https://kit.svelte.dev/docs#ssr-and-javascript-hydrate) es el sitio oficial de SvelteKit, está construido con SvelteKit. El sitio web ofrece una interfaz similar y un conjunto de características a comparar con la documentación oficial de Astro. Esto nos da una **_vista detallada y realista_** entre los dos generadores de sitios web.

Una notable diferencia entre los dos sitios web que se están probando: es que la documentación de SvelteKit se proporciona como una sola página, mientras que la documentación de Astro se divide en múltiples páginas. Este mayor contenido debería tener un impacto negativo en el rendimiento que no está relacionado con la herramienta en sí misma.

- **Puntaje de rendimiento de SveltKit**: 92 de 100 [(ver detalles)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fkit.svelte.dev%2Fdocs)
- **Puntaje de rendimiento de Astro**: 99 de 100 [(ver detalles)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

El rendimiento de SvelteKit fue muy similar al de Astro en esta prueba.

## Next.js vs. Astro

[Next.js](https://nextjs.org/) es una popular y un framework para React.

Next.js utiliza React para renderizar tu sitio web. Astro es más flexible: eres libre de crear un componente UI en cualquier librería popular (React, Preact, Vue, Svelte, Solid, entre otros) o puedes crear un componente de Astro con una sintaxis parecida a HTML, que es similar a HTML + JSX.

Tanto Next.js como Astro, son frameworks para crear sitios web. Nesxt.js funciona mejor en sitios web altamente dinámicos (como tableros y bandejas de entradas); mientras que Astro funciona mejor con sitios altamente estáticos (como contenido web y sitios de comercio electrónico).

Next.js soporta tanto Static Site Generation (SSG) como Server-Side Rendering (SSR). Hoy en día, Astro tan sólo soporta Static Site Generation (SSG).

#### Comparando el Rendimiento de Gatsby vs. Astro

En la mayoría de casos, los sitios de Astro cargarán mucho más rápido que los sitios de Next.js. Esto pasa porque Astro automáticamente quita el código Javascript innecesario de la página, cargando sólo los componentes individuales que se necesiten. Esta característica se llama [hidratación parcial](/es/core-concepts/component-hydration).

Next.js no soporta hidratación parcial, en su lugar hace que el usuario cargue e hidrate la página completa en el navegador, incluso si la mayoría del contenido de la página es estático. Esto crea una carga de página más lenta y un rendimiento inferior para tu sitio web. Next.js ofrece un [ soporte experimental](https://piccalil.li/blog/new-year-new-website/#heading-no-client-side-react-code) para sitios completamente estáticos con cero Javascript. Sin embargo, en su página no hay planificación para realizar la hidratación parcial de componentes individuales. Por lo tanto, queda a tu criterio tomar la decisión de todo-o-nada en la interactividad de cada página.

Next.js tiene un gran soporte para optimizar imágenes, lo que podría hacer que Next.js sea una buena opción para sitios web con muchas imágenes.

#### Caso de Estudio: Documentando un sitio web

[nextjs.org/docs](https://nextjs.org/docs/getting-started) es la página oficial de Next.js, está construida con Next.js. El sitio web ofrece una interfaz similar y un conjunto de características a comparar con la documentación oficial de Astro. Esto nos da una **_vista detallada y realista_** entre los dos generadores de sitios web.

- **Puntaje de rendimiento de Next.js**: 59 de 100 [(ver detalles)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fnextjs.org%2Fdocs%2Fgetting-started)
- **Puntaje de rendimiento de Astro**: 99 de 100 [(ver detalles)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

Una razón de peso por lo que se produce esta diferencia de rendimiento es que Astro tiene una menor carga de JavaScript: [nextjs.org/docs](https://nextjs.org/docs/getting-started) carga **463kb** de JavaScript en la primera carga de la página, mientras que [docs.astro.build](https://docs.astro.build/es/getting-started) carga **78.7kb** (en general, 83% menos de JavaScript) _después_ de la primera carga.

## Nuxt vs. Astro

[Nuxt](https://nuxtjs.org/) es una popular página web y un framework para Vue. Es similar a Next.js

Nuxt utiliza Vue para renderizar tu sitio web. Astro es más flexible: eres libre de crear un componente UI en cualquier librería popular (React, Preact, Vue, Svelte, Solid, entre otros) o puedes crear un componente de Astro con una sintaxis parecida a HTML, que es similar a HTML + JSX.

Tanto Nuxt como Astro, son frameworks para crear sitios web. Nuxt funciona mejor con sitios web altamente dinámicos (como tableros y bandejas de entradas); mientras que Astro funciona mejor con sitios altamente estáticos (como contenido web y sitios de comercio electrónico).

Nuxt soporta tanto Static Site Generation (SSG) como Server-Side Rendering (SSR). Hoy en día, Astro tan sólo soporta Static Site Generation (SSG).

#### Comparando el Rendimiento de Nuxt vs. Astro

En la mayoría de casos, los sitios de Astro cargarán mucho más rápido que los sitios de Nuxt. Esto pasa porque Astro automáticamente quita el código Javascript innecesario de la página, cargando sólo los componentes individuales que se necesiten. Esta característica se llama [hidratación parcial](/es/core-concepts/component-hydration).

Nuxt no soporta hidratación parcial, en su lugar hace que el usuario cargue e hidrate la página completa en el navegador, incluso si la mayoría del contenido de la página es estático. Esto crea una carga de página más lenta y un rendimiento inferior para tu sitio web. No hay forma de deshabilitar este comportamiento en Nuxt.

Nuxt tiene un gran soporte para optimizar imágenes, lo que podría hacer que Nuxt sea una buena opción para sitios web con muchas imágenes.

#### Caso de Estudio: Documentando un sitio web

[nuxtjs.org/docs](https://nuxtjs.org/docs/2.x/get-started/installation) es la documentación oficial de Nuxt, construida con Gatsby. El sitio web ofrece una interfaz similar y un conjunto de características a comparar con la documentación oficial de Astro. Esto nos da una **_vista detallada y realista_** entre los dos generadores de sitios web.

- **Puntaje de rendimiento de Nuxt**: 48 de 100 [(ver detalles)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fnuxtjs.org%2Fdocs%2F2.x%2Fget-started%2Finstallation)
- **Puntaje de rendimiento de Astro**: 99 de 100 [(ver detalles)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

Una de las más grandes razones detrás de la diferencia en los rendimientos es que la carga de Javascript en Astro es el poco tiempo de carga de Javascropt en Astro: [nuxtjs.org/docs](https://nuxtjs.org/docs/2.x/get-started/installation) carga **469kb** de Javascript en la primera carga; mientras que [docs.astro.build](https://docs.astro.build/es/getting-started) loads **78.7kb** (en general, 83% menos de JavaScript) _después_ de la primera carga.

## VuePress vs. Astro

[VuePress](https://vuepress.vuejs.org/guide/) es un constructor de documentación de sitios web, desarrollado por los creadores de Vue.js. VuePress utiliza Vue.js para generar la interfaz de usuario de tu sitio web, mientras que Astro soporta React, Vue.js, Svelte, y plantillas HTML.

VuePress fue diseñado para documentar sitios web y tiene funcionalidades y características propias que Astro no soporta por defecto. En su lugar, Astro ofrece características específicas de documentación mediante un tema oficial [`docs`](https://github.com/snowpackjs/astro/tree/main/examples/docs), el cual puedes usar para tu sitio web. !Este sitio web fue construido usando ese tema!

Actualmente, Evan You (creador de Vue.js) está trabajando en una nueva versión de Vuepress llamado [VitePress.](https://vitepress.vuejs.org/). Si quieres conocer una moderna alternativa a VuePress, [revisa este post de Evan](https://github.com/snowpackjs/astro/issues/1159#issue-974035962) del porqué VitePress podría ser una mejor opción.

#### Comparando el VuePress de Gatsby vs. Astro

En la mayoría de casos, los sitios de Astro cargarán mucho más rápido que los sitios de VuePress. Esto pasa porque Astro automáticamente quita el código Javascript innecesario de la página, cargando sólo los componentes individuales que se necesiten. Esta característica se llama [hidratación parcial](/es/core-concepts/component-hydration).

VuePress no soporta hidratación parcial, en su lugar hace que el usuario cargue e hidrate la página completa en el navegador, incluso si la mayoría del contenido de la página es estático. Esto crea una carga de página más lenta y un rendimiento inferior para tu sitio web. No hay forma de deshabilitar este comportamiento en VuePress.

#### Caso de Estudio: Documentando un sitio web

[vuepress.vuejs.org](https://vuepress.vuejs.org/guide/) es la documentación oficial de VuePress, construida con VuePress. El sitio web ofrece una interfaz similar y un conjunto de características a comparar con la documentación oficial de Astro. Esto nos da una **_vista detallada y realista_** entre los dos generadores de sitios web.

- **Puntaje de rendimiento de Vuepress**: 63 de 100 [(ver detalles)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fvuepress.vuejs.org%2Fguide%2F)
- **Puntaje de rendimiento de Astro**: 99 de 100 [(ver detalles)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

Una de las más grandes razones detrás de la diferencia en los rendimientos es que la carga de Javascript en Astro es el poco tiempo de carga de Javascropt en Astro: [vuepress.vuejs.org](https://vuepress.vuejs.org/guide/) carga **166kb** de Javascript en la primera carga; mientras que [docs.astro.build](https://docs.astro.build/es/getting-started) loads **78.7kb** (en general, 53% menos de JavaScript) _después_ de la primera carga.

## Zola vs. Astro

[Zola](https://www.getzola.org/) es un popular y rápido generador de sitios estáticos, desarrollado por Rust.

Zola utiliza [Tera](https://tera.netlify.app/) para renderizar tu sitio web. Astro es más flexible: eres libre de crear un componente UI en cualquier librería popular (React, Preact, Vue, Svelte, Solid, entre otros) o puedes crear un componente de Astro con una sintaxis parecida a HTML, que es similar a HTML + JSX. Zola no soporta el uso de componentes modernos para plantillas HTML.

#### Comparando el Rendimiento de Gatsby vs. Astro

Conceptualmente, Zola está alineado con el enfoque de Astro sobre "el uso mínimo de Javascript en el lado del cliente". Tanto Zola y Astro ofrecen un rendimiento similar, un uso extremadamente bajo de Javascript por defecto.

Astro ofrece soporte para construir, empaquetar y minimizar JavaScript. Zola requiere usar otra herramienta de construcción como Webpack para empaquetar y procesar JavaScript. Astro automáticamente quita el código Javascript innecesario de la página, cargando sólo los componentes individuales que se necesiten. Esta característica se llama [hidratación parcial](/es/core-concepts/component-hydration). Mientras que Zola puedes hacerlo por ti mismo, Astro lo ofrece incorporado por defecto.
