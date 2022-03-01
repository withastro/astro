---
layout: ~/layouts/MainLayout.astro
title: Hidratación Parcial en Astro
---

**Astro genera todos los sitios web sin JavaScript en el lado del cliente, de forma predeterminada.** Utiliza cualquier componente de interfaz de usuario que desee (React, Svelte, Vue, etc.) y Astro lo representará automáticamente en HTML en el momento de la compilación y elimina todo el JavaScript. Esto mantiene todos los sitios rápidos de forma predeterminada.

Pero a veces, se requiere JavaScript del lado del cliente. Esta guía muestra cómo funcionan los componentes interactivos en Astro mediante una técnica llamada hidratación parcial.

```astro
---
// Ejemplo: Importar y luego usar un componente React.
// De forma predeterminada, Astro representa esto en HTML y CSS durante
// su compilación, sin JavaScript del lado del cliente.
// (¿Necesitas JavaScript del lado del cliente? Sigue leyendo...)
import MyReactComponent from '../components/MyReactComponent.jsx';
---
<!-- 100% HTML, Zero JavaScript! -->
<MyReactComponent />
```

## Concepto: Hidratación parcial

Hay muchos casos en los que necesita un componente de UI interactivo para ejecutarse en el navegador:

- Un carrusel de imágenes
- Una barra de búsqueda de autocompletar
- Un botón de apertura/cierre de la barra lateral móvil
- Un botón "Comprar ahora"

En Astro, depende de ti, como desarrollador, "habilitar" explícitamente cualquier componente de la página que deba ejecutarse en el navegador. Astro puede usar esta información para saber exactamente qué JavaScript se necesita y solo hidratar exactamente lo que se necesita en la página. Esta técnica se conoce como hidratación parcial.

**Hidratación parcial**, el acto de solo hidratar los componentes individuales que requieren JavaScript y dejar el resto de su sitio como HTML estático, puede parecer relativamente sencillo. ¡Debería! Los sitios web se han construido de esta manera durante décadas. Recientemente, las aplicaciones de una sola página (SPA) introdujeron la idea de que todo su sitio web está escrito en JavaScript y compilado/renderizado por cada usuario en el navegador.

\_Nota: La hidratación parcial a veces se denomina "mejora progresiva" o "hidratación progresiva". Si bien hay ligeros matices entre los términos, para nuestros propósitos, puede pensar en todos ellos como sinónimos del mismo concepto.

**La hidratación parcial es el secreto de la historia de rendimiento rápido por defecto de Astro.** Next.js, Gatsby y otros marcos de JavaScript no pueden admitir la hidratación parcial porque imaginan todo su sitio web/página como una sola aplicación de JavaScript.

## Concepto: Arquitectura de la isla

**La arquitectura de la isla** es la idea de utilizar la hidratación parcial para construir sitios web completos. La arquitectura de la isla es una alternativa a la idea popular de construir su sitio web en un paquete de JavaScript del lado del cliente que debe enviarse al usuario.

> En un modelo de "islas", la representación del servidor no es una optimización complementaria destinada a mejorar el SEO o la UX. En cambio, es una parte fundamental de cómo se envían las páginas al navegador. El HTML devuelto en respuesta a la navegación contiene una representación significativa e inmediatamente renderizable del contenido solicitado por el usuario.
> <br/> -- [Jason Miller](https://jasonformat.com/islands-architecture/)

Además de los obvios beneficios de rendimiento de enviar menos JavaScript al navegador, existen dos beneficios clave para la arquitectura de la isla:

- **Los componentes se cargan individualmente.** Un componente liviano (como una barra lateral) se cargará y renderizará rápidamente sin ser bloqueado por los componentes más pesados ​​de la página.
- **Los componentes se procesan de forma aislada.** Cada parte de la página es una unidad aislada y un problema de rendimiento en una unidad no afectará directamente a las demás.

![diagram](https://res.cloudinary.com/wedding-website/image/upload/v1596766231/islands-architecture-1.png)

## Hidrata los componentes interactivos

Astro procesa todos los componentes en el servidor **en el momento de la compilación**, a menos que se use [client:only](#mycomponent-clientonly-). Para hidratar componentes en el cliente **en tiempo de ejecución**, puede usar cualquiera de las siguientes directivas `client:*`. Una directiva es un atributo de componente (siempre con un `:`) que le dice a Astro cómo debe renderizarse tu componente.

```astro
---
// Ejemplo: hidratación de un componente React en el navegador.
import MyReactComponent from '../components/MyReactComponent.jsx';
---
<!-- "client:visible" significa que el componente no cargará ningún Javascript
  del lado del cliente hasta que sea visible en el navegador del usuario. -->
<MyReactComponent client:visible />
```

### `<MyComponent client:load />`

Hidratar el componente al cargar la página.

### `<MyComponent client:idle />`

Hidrata el componente tan pronto como el hilo principal esté libre (usa [requestIdleCallback()] [mdn-ric]).

### `<MyComponent client:visible />`

Hidrata el componente tan pronto como el elemento entre en la ventana gráfica (usa [IntersectionObserver] [mdn-io]). Útil para el contenido que se encuentra más abajo en la página.

### `<MyComponent client:media={QUERY} />`

Hidrata el componente tan pronto como el navegador coincida con la consulta de medios dada (usa [matchMedia] [mdn-mm]). Útil para alternar la barra lateral u otros elementos que solo deberían mostrarse en dispositivos móviles o de escritorio.

### `<MyComponent client:only />`

Hidrata el componente en la carga de la página, similar a `client:load`. El componente se **omitirá** en el momento de la compilación, lo que resulta útil para los componentes que dependen por completo de las API del lado del cliente. Es mejor evitar esto a menos que sea absolutamente necesario; en la mayoría de los casos, es mejor representar el contenido del marcador de posición en el servidor y retrasar las llamadas a la API del navegador hasta que el componente se hidrate en el navegador.

Si se incluye más de un renderizador en Astro [config](/es/reference/configuration-reference), `client:only` necesita una pista para saber qué renderizador usar para el componente. Por ejemplo, `client:only="react"` aseguraría que el componente esté hidratado en el navegador con el renderizador React. Para los renderizadores personalizados no proporcionados por `@astrojs`, use el nombre completo del renderizador proporcionado en su configuración de Astro, es decir,`<client: only="my-custom-renderer" />`.

## ¿Puedo hidratar los componentes de Astro?

Los [componentes de Astro](./astro-components)(archivos `.astro`) son componentes con plantillas de solo HTML sin ejecución del lado del cliente. Si intentas hidratar un componente Astro con un modificador `client:`, obtendrás un error.

Para hacer que su componente Astro sea interactivo, necesitará convertirlo al framework de su elección: React, Svelte, Vue, etc. Si no tienes preferencias, recomendamos React o Preact ya que son más similares a la sintaxis de Astro.

Alternativamente, puedes agregar una etiqueta `<script>` a tu plantilla HTML del componente de Astro y enviar JavaScript al navegador de esa manera. Aunque esto está bien para las cosas simples, recomendamos un framework de frontend para componentes interactivos más complejos.

```astro
---
// Ejemplo: uso de Astro con etiquetas de secuencia de comandos
---
<h1>No clickeado</h1>
<button>Haz click para cambiar el título</button>
<script>
document.querySelector("button").addEventListener("click",() => {
    document.querySelector("h1").innerText = "clickeado"
})
</script>
```

[mdn-io]: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
[mdn-ric]: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
[mdn-mm]: https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia
