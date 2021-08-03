# Astro Lit Renderer

This is a plugin for [Astro](https://astro.build/) apps that enables server-side rendering of custom elements build with [Lit](https://lit.dev/).

Server-side rendering uses [Declarative Shadow DOM](https://web.dev/declarative-shadow-dom/), a new web technology that allows custom elements to be rendered to HTML with __0 JavaScript__.

## Installation

Install `@astrojs/renderer-lit` and then add it to your `astro.config.mjs` in the `renderers` property:

```
npm install @astrojs/renderer-lit
```

__astro.config.mjs__

```js
export default {
  // ...

  renderers: [
    // ...
    '@astrojs/renderer-lit'
  ]
}
```

## Usage

If you're familiar with Astro then you already know that you can import components into your templates and use them. What's different about custom elements is you can use the *tag name* directly.

Astro needs to know which tag is associated with which component script. We expose this through exporting a `tagName` variable from the component script. It looks like this:

__src/components/my-element.js__

```js
import { LitElement, html } from 'lit';

export const tagName = 'my-element';

class MyElement extends LitElement {
  render() {
    return html` <p>Hello world! From my-element</p> `;
  }
}

customElements.define(tagName, MyElement);
```

> Note that exporting the `tagName` is __required__ if you want to use the tag name in your templates. Otherwise you can export and use the constructor, like with non custom element frameworks.

In your Astro template import this component as a side-effect and use the element.

__src/pages/index.astro__

```jsx
---
import '../components/my-element.js';
---

<my-element></my-element>
```

> Note that Lit requires browser globals such as `HTMLElement` and `customElements` to be present. For this reason the Lit renderer shims the server with these globals so Lit can run. You *might* run into libraries that work incorrectly because of this.

### Polyfills & Hydration

The renderer automatically handles adding appropriate polyfills for support in browsers that don't have Declarative Shadow DOM. The polyfill is about *1.5kB*. If the browser does support Declarative Shadow DOM then less than 250 bytes are loaded (to feature detect support).

Hydration is also handled automatically. You can use the same hydration directives such as `client:load`, `client:idle` and `client:visible` as you can with other libraries that Astro supports.

```jsx
---
import '../components/my-element.js';
---

<my-element client:visible />
```

The above will only load the element's JavaScript when the user has scrolled it into view. Since it is server rendered they will not see any jank; it will load and hydrate transparently.